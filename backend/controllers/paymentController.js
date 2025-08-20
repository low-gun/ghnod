// CommonJS 기준
const axios = require("axios");
const pool = require("../config/db"); // ✅ DB 트랜잭션 사용

exports.confirmToss = async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "필수 파라미터 누락" });
  }

  const secret = process.env.TOSS_SECRET_KEY; // test_sk_... (Azure 환경변수)
  if (!secret) {
    return res
      .status(500)
      .json({ success: false, error: "서버 시크릿키 미설정" });
  }

  const basic = Buffer.from(`${secret}:`).toString("base64");

  try {
    // 1) PG 승인(토스 confirm) 먼저 수행 (외부 I/O)
    const { data } = await axios.post(
      "https://api.tosspayments.com/v1/payments/confirm",
      { paymentKey, orderId: String(orderId), amount: Number(amount) },
      {
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 2) 결제 승인 성공 → 내부 트랜잭션으로 주문/결제 정합성 보장
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 2-1) 주문 존재/상태/소유자 검증
      //  - orderId 는 우리 시스템의 orders.id 라고 가정 (프론트에서 이 값으로 보냄)
      //  - cart/pending 상태였던 걸 paid 로 올림
      const [[orderRow]] = await conn.query(
        `
        SELECT id, user_id, order_status, total_amount, used_point, coupon_id
        FROM orders
        WHERE id = ? FOR UPDATE
        `,
        [orderId]
      );

      if (!orderRow) {
        // 주문 자체가 없으면 고아 결제를 만들지 말고 실패 처리
        throw new Error("주문 없음: orderId가 유효하지 않습니다.");
      }

      if (String(orderRow.order_status).toLowerCase() === "paid") {
        // 이미 처리된 주문이면 이중처리 방지
        throw new Error("이미 결제 완료된 주문입니다.");
      }

      // 2-2) 주문 아이템 합/수량 집계 (수량은 금액과 무관하게 반드시 반영)
      const [[agg]] = await conn.query(
        `
        SELECT 
          COALESCE(SUM(oi.quantity), 0) AS total_qty,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS subtotal
        FROM order_items oi
        WHERE oi.order_id = ?
        `,
        [orderId]
      );

      const totalQty = Number(agg.total_qty || 0);
      const subtotal = Number(agg.subtotal || 0);

      if (totalQty <= 0) {
        // NO_ITEMS 방지: 아이템이 없으면 결제 반영 금지 (모두 롤백)
        throw new Error("주문 아이템이 없습니다.");
      }

      // 2-3) 할인/포인트(이미 주문에 기록돼 있다면 사용) 반영 금액 산출
      const used_point = Number(orderRow.used_point || 0);
      let coupon_discount = 0;
      if (orderRow.coupon_id) {
        const [[ct]] = await conn.query(
          `
          SELECT ct.discount_type, ct.discount_value, ct.discount_amount
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = ? LIMIT 1
          `,
          [orderRow.coupon_id]
        );
        if (ct) {
          if (ct.discount_type === "fixed") {
            coupon_discount = Number(ct.discount_amount || 0);
          } else if (ct.discount_type === "percent") {
            const p = Number(ct.discount_value || 0);
            coupon_discount = Math.floor((subtotal * p) / 100);
          }
        }
      }

      // 2-4) 최종 결제금액 계산 (서버 관점)
      const serverFinalAmount = Math.max(
        0,
        subtotal - used_point - coupon_discount
      );

      // 2-5) 토스 승인 응답의 amount와 서버 계산 금액 일치 여부 확인
      if (Number(amount) !== serverFinalAmount) {
        // 금액 상이 → 결제/주문 데이터 불일치. 모두 롤백.
        throw new Error(
          `결제금액 불일치 (client:${amount}, server:${serverFinalAmount})`
        );
      }

      // 2-6) payments insert
      const paymentStatus = (data?.status || "paid")
        .toString()
        .toLowerCase()
        .includes("fail")
        ? "failed"
        : "paid";

      const [payRes] = await conn.query(
        `
        INSERT INTO payments
          (user_id, amount, currency, payment_method, status, created_at, updated_at, toss_payment_key, toss_order_id)
        VALUES
          (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
        `,
        [
          orderRow.user_id,
          amount,
          data?.currency || "KRW",
          data?.method || "card",
          paymentStatus === "paid" ? data?.status || "paid" : "failed",
          data?.paymentKey || paymentKey || null,
          data?.orderId || String(orderId) || null,
        ]
      );
      const paymentId = payRes.insertId;

      if (paymentStatus !== "paid") {
        throw new Error("PG 승인 상태가 paid/완료가 아닙니다.");
      }

      // 2-7) 주문 업데이트: 결제 매핑, 상태, 금액
      await conn.query(
        `
        UPDATE orders
        SET payment_id = ?, order_status = 'paid', total_amount = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [paymentId, serverFinalAmount, orderId]
      );

      // 2-8) 쿠폰 사용 처리
      if (orderRow.coupon_id) {
        await conn.query(`UPDATE coupons SET is_used = 1 WHERE id = ?`, [
          orderRow.coupon_id,
        ]);
      }

      // 2-9) 포인트 차감 기록 (주문에 used_point가 기록되어 있다면)
      if (used_point > 0) {
        await conn.query(
          `
          INSERT INTO points (user_id, change_type, amount, description, created_at)
          VALUES (?, '사용', ?, '주문 결제 차감', NOW())
          `,
          [orderRow.user_id, used_point]
        );
      }

      // 2-10) 최종 정합성 검증: 결제-주문 매핑 & 아이템 존재
      const [[chk]] = await conn.query(
        `
        SELECT 
          (SELECT COUNT(*) FROM order_items WHERE order_id = ?) AS item_count,
          (SELECT payment_id FROM orders WHERE id = ?)          AS linked_payment_id
        `,
        [orderId, orderId]
      );
      if (
        !chk ||
        Number(chk.item_count) <= 0 ||
        Number(chk.linked_payment_id) !== paymentId
      ) {
        throw new Error("트랜잭션 정합성 실패(매핑/아이템)");
      }

      await conn.commit();

      // 2-11) 응답
      return res.json({
        success: true,
        data,
        paymentId,
        orderId,
        totalQuantity: totalQty,
        totalAmount: serverFinalAmount,
      });
    } catch (txErr) {
      try {
        /* best-effort */
      } finally {
        /* no-op */
      }
      // 트랜잭션 롤백
      try {
        const c = await pool.getConnection();
        await c.rollback();
        c.release();
      } catch (_) {}
      throw txErr;
    }
  } catch (e) {
    const r = e.response;
    if (r) {
      console.error("[TOSS FAIL]", {
        status: r?.status,
        code: r?.data?.code,
        message: r?.data?.message,
        trace: r?.headers?.["x-tosspayments-trace-id"],
      });
      return res.status(r?.status || 500).json({
        success: false,
        code: r?.data?.code,
        error: r?.data?.message || e.message,
      });
    }
    console.error("❌ confirmToss tx error:", e);
    return res.status(500).json({
      success: false,
      error: e?.message || "결제 처리 실패",
    });
  }
};
