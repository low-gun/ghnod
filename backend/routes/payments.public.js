// backend/routes/payments.public.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/db");
const { authenticateToken } = require("../middlewares/authMiddleware");
const MIN_TOSS_AMOUNT = Number(process.env.MIN_TOSS_AMOUNT ?? 100);

/** 포인트 잔액 */
async function getUserPointBalance(userId) {
  const [rows] = await db.query(
    `SELECT 
       SUM(CASE WHEN change_type='적립' THEN amount ELSE -amount END) AS balance
     FROM points
     WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0]?.balance || 0);
}

/** 쿠폰 검증 + 할인액 계산 */
async function getCouponDiscountIfValid({ couponId, userId, baseTotal }) {
  if (!couponId) return { discount: 0, couponRow: null, template: null };

  const [rows] = await db.query(
    `SELECT c.*, ct.discount_type, ct.discount_amount, ct.discount_value, ct.expired_at
       FROM coupons c
       JOIN coupon_templates ct ON c.template_id = ct.id
      WHERE c.id = ? AND c.user_id = ? AND c.is_used = 0`,
    [couponId, userId]
  );
  if (!rows.length) return { discount: 0, couponRow: null, template: null };

  // 템플릿 만료 체크(있으면)
  if (rows[0].expired_at && new Date(rows[0].expired_at) < new Date()) {
    return { discount: 0, couponRow: null, template: null };
  }

  let discount = 0;
  if (rows[0].discount_type === "fixed") {
    discount = Number(rows[0].discount_amount || 0);
  } else if (rows[0].discount_type === "percent") {
    const pct = Number(rows[0].discount_value || 0);
    discount = Math.floor((Number(baseTotal) * pct) / 100);
  }
  discount = Math.max(0, Math.min(discount, baseTotal));
  return { discount, couponRow: rows[0], template: rows[0] };
}

/** 내 cart_item_ids만 조회 + 합계 */
async function getCartItemsAndTotal({ userId, cartItemIds }) {
  if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
    throw new Error("cart_item_ids 비어있음");
  }
  const placeholders = cartItemIds.map(() => "?").join(",");
  const [items] = await db.query(
    `SELECT id, user_id, schedule_id, schedule_session_id, quantity, unit_price, discount_price, type
       FROM cart_items
      WHERE id IN (${placeholders}) AND user_id = ?`,
    [...cartItemIds, userId]
  );
  if (items.length !== cartItemIds.length) {
    throw new Error("일부 장바구니 항목을 찾을 수 없거나 소유자가 아님");
  }
  const baseTotal = items.reduce((sum, it) => {
    const q = Number(it.quantity || 1);
    const u = Number(it.unit_price || 0);
    const d = Number(it.discount_price || 0);
    const per = d > 0 && d < u ? d : u;
    return sum + q * per;
  }, 0);
  return { items, baseTotal };
}

/** 주문명 만들기 */
async function makeOrderName(items) {
  if (!items || items.length === 0) return "주문";
  const first = items[0];
  const [rows] = await db.query(
    `SELECT title FROM schedules WHERE id = ? LIMIT 1`,
    [first.schedule_id]
  );
  const firstTitle = rows[0]?.title || "상품";
  if (items.length === 1) return firstTitle;
  return `${firstTitle} 외 ${items.length - 1}건`;
}

/**
 * [POST] /api/payments/toss/prepare
 * body: { cart_item_ids:number[], coupon_id?:number, used_point?:number }
 * 서버금액 재계산 → 주문(pending) 생성 → 토스 결제 파라미터 반환
 */
router.post("/toss/prepare", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const cart_item_ids = (req.body?.cart_item_ids || [])
    .map(Number)
    .filter(Boolean);
  const coupon_id = req.body?.coupon_id ? Number(req.body.coupon_id) : null;
  const used_point = Number(req.body?.used_point || 0);

  try {
    if (!userId) return res.status(401).json({ error: "로그인이 필요합니다." });
    if (!cart_item_ids.length)
      return res.status(400).json({ error: "cart_item_ids 필요" });

    // 1) 장바구니 합계
    const { items, baseTotal } = await getCartItemsAndTotal({
      userId,
      cartItemIds: cart_item_ids,
    });

    // 2) 쿠폰
    const { discount: couponDiscount, couponRow } =
      await getCouponDiscountIfValid({
        couponId: coupon_id,
        userId,
        baseTotal,
      });

    // 3) 포인트(캡핑: 보유포인트, 사용할 수 있는 최대치, 0 이상)
    const pointBalance = await getUserPointBalance(userId);
    const maxPointUsable = Math.max(0, baseTotal - couponDiscount);
    const pointToUse = Math.min(
      Math.max(0, Number(used_point || 0)),
      pointBalance,
      maxPointUsable
    );

    // 4) 최종금액(이미 0 이상 보장)
    const finalAmount = baseTotal - couponDiscount - pointToUse;

    // 👉 0원 결제면 Toss로 가지 말고 무료결제 플로우로 안내 (주문 생성도 하지 않음)
    if (finalAmount === 0) {
      const orderName = await makeOrderName(items);
      return res.status(200).json({
        flow: "FREE",
        orderName,
        amount: 0,
        cappedPointToUse: pointToUse,
        message: "0원 결제입니다. /api/payments/free-checkout 로 진행하세요.",
      });
    }

    // 👉 최소 결제금액 미만이면 프론트에서 포인트/쿠폰 조정 유도
    if (finalAmount < MIN_TOSS_AMOUNT) {
      return res.status(400).json({
        code: "AMOUNT_BELOW_MIN",
        minAmount: MIN_TOSS_AMOUNT,
        message: `최소 결제금액은 ${MIN_TOSS_AMOUNT}원입니다.`,
      });
    }

    // 5) 주문/아이템 트랜잭션 (DB에는 'pointToUse'를 저장해야 함)
    const conn = await db.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();

      const [ordIns] = await conn.query(
        `INSERT INTO orders
       (user_id, order_status, total_amount, used_point, coupon_id, payment_method, created_at, updated_at)
     VALUES (?, 'pending', ?, ?, ?, 'tosspayments', NOW(), NOW())`,
        [userId, finalAmount, pointToUse, couponRow ? couponRow.id : null] // ← 여기!
      );
      orderId = ordIns.insertId;

      for (const it of items) {
        const q = Number(it.quantity || 1);
        const u = Number(it.unit_price || 0);
        const d = Number(it.discount_price || 0);
        const per = d > 0 && d < u ? d : u;       // ✅ 할인가 우선
const subtotal = q * per;

await conn.query(
  `INSERT INTO order_items
   (order_id, schedule_id, schedule_session_id, quantity, unit_price, discount_price, subtotal, updated_at)
 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
[
  orderId,
  it.schedule_id,
  it.schedule_session_id || null,
  q,
  per,                            // ✅ 오타 수정
  Number(it.discount_price || 0),
  subtotal,
]
);

      }   

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // 6) 토스 파라미터
const orderName = await makeOrderName(items);
// Toss 규격: 6~64자 (영숫자/-/_), 내부 주문 id 패딩
const orderIdStr = String(orderId).padStart(6, "0");

// Toss가 success/fail 시 자동으로 ?paymentKey&orderId&amount 붙여줌
const successUrl = `${process.env.CLIENT_URL}/payments/toss/success`;
const failUrl = `${process.env.CLIENT_URL}/payments/toss/fail`;

return res.json({
  orderId: orderIdStr,
  orderName,
  amount: finalAmount,
  successUrl,
  failUrl,
  customerName: req.user?.username || "",
  customerEmail: req.user?.email || "",
});

    
  } catch (err) {
    console.error("❌ /toss/prepare error:", err?.message || err);
    return res.status(500).json({ error: "결제 준비 중 오류가 발생했습니다." });
  }
});

/**
 * [POST] /api/payments/toss/confirm
 * body: { paymentKey, orderId, amount }
 * 승인 성공 시 payments/order 반영 + 쿠폰 사용 처리 + 포인트 차감
 */
router.post("/toss/confirm", authenticateToken, async (req, res) => {
  const paymentKey = String(req.body?.paymentKey || "").trim();
  const orderIdStr = String(req.body?.orderId || "").trim(); // 패딩 유지 문자열
  const amount = Number(req.body?.amount);
  const orderId = parseInt(orderIdStr, 10); // DB 조회용 숫자

  console.log("📥 [CONFIRM REQ] raw body:", req.body);
  console.log("📥 [CONFIRM REQ] parsed:", { paymentKey, orderIdStr, amount, orderId });

  if (!paymentKey || !orderIdStr || !Number.isFinite(amount)) {
    console.error("❌ [CONFIRM] 필수 파라미터 누락", { paymentKey, orderIdStr, amount });
    return res
      .status(400)
      .json({ success: false, error: "필수 파라미터 누락" });
  }

  try {
    // 1) 서버 금액/소유자 검증
    const [ordRows] = await db.query(
      `SELECT id, user_id, order_status, total_amount, used_point, coupon_id
         FROM orders
        WHERE id = ?`,
      [orderId]
    );

    console.log("🔎 [CONFIRM] DB order lookup:", ordRows);
    if (!ordRows.length) {
      return res
        .status(404)
        .json({ success: false, error: "주문을 찾을 수 없습니다." });
    }
    const order = ordRows[0];

    if (!req.user || order.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, error: "ORDER_OWNERSHIP_MISMATCH" });
    }
    if (order.order_status !== "pending") {
      return res
        .status(400)
        .json({ success: false, error: "이미 처리된 주문입니다." });
    }
    if (Number(order.total_amount) !== Number(amount)) {
      return res
        .status(400)
        .json({ success: false, error: "금액 불일치(서버 검증 실패)" });
    }

    // 2) Toss 승인
    // 2) Toss 승인
if (!process.env.TOSS_SECRET_KEY) {
  return res
    .status(500)
    .json({ success: false, error: "서버 결제키 미설정" });
}

// ✅ 실제 런타임에 어떤 키가 읽히는지 확인
console.log("🔑 [CONFIRM] TOSS_SECRET_KEY (len):", process.env.TOSS_SECRET_KEY?.length);
console.log("🔑 [CONFIRM] TOSS_SECRET_KEY (prefix):", process.env.TOSS_SECRET_KEY?.slice(0, 10));

const url = "https://api.tosspayments.com/v1/payments/confirm";
const secretKey = `${process.env.TOSS_SECRET_KEY.trim()}:`;
const auth = Buffer.from(secretKey).toString("base64");


    const { data } = await axios.post(
      url,
      { paymentKey, orderId: orderIdStr, amount: Number(amount) },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `confirm-${paymentKey}`,
        },
        timeout: 10000,
      }
    );

    if (data.status !== "DONE") {
      return res
        .status(400)
        .json({ success: false, error: `승인 실패(status: ${data.status})` });
    }

    // 승인 정보
    const payMethod = data.method || "toss";
    const approvalCode =
      (data.card && data.card.approveNo) ??
      (data.easyPay && data.easyPay.approvalNo) ??
      data.approvalNumber ??
      null;

   // 3) DB 반영(트랜잭션)
const conn = await db.getConnection();
let paymentId;
try {
  await conn.beginTransaction();

  // (a) 주문 아이템 불러오기 (회차 포함)
  const [items] = await conn.query(
    `SELECT schedule_id, schedule_session_id, quantity, unit_price
       FROM order_items
      WHERE order_id = ?`,
    [orderId]
  );

  // (b) 회차별 재고 확인 & 차감
  for (const it of items) {
    if (it.schedule_session_id) {
      // 좌석 행을 잠금
      const [[row]] = await conn.query(
        `SELECT remaining_spots 
           FROM schedule_sessions 
          WHERE id = ? 
          FOR UPDATE`,
        [it.schedule_session_id]
      );
      if (!row) throw new Error(`회차 ${it.schedule_session_id} 없음`);
      if (row.remaining_spots < it.quantity) {
        throw new Error(`회차 ${it.schedule_session_id} 잔여 부족`);
      }

      await conn.query(
        `UPDATE schedule_sessions
            SET remaining_spots = remaining_spots - ?
          WHERE id = ?`,
        [it.quantity, it.schedule_session_id]
      );
    }
  }

  // (c) 결제 레코드 생성
  const [payIns] = await conn.query(
    `INSERT INTO payments
       (user_id, amount, currency, payment_method, status, approval_code, toss_payment_key, toss_order_id, created_at, updated_at)
     VALUES (?, ?, 'KRW', ?, '완료', ?, ?, ?, NOW(), NOW())`,
    [
      order.user_id,
      data.totalAmount,
      payMethod,
      approvalCode,
      data.paymentKey,
      orderIdStr,
    ]
  );
  paymentId = payIns.insertId;

  // (d) 주문 업데이트
  await conn.query(
    `UPDATE orders
        SET payment_id = ?, order_status = 'paid', payment_method = ?, updated_at = NOW()
      WHERE id = ?`,
    [paymentId, payMethod, orderId]
  );

  // (e) 쿠폰 처리
  if (order.coupon_id) {
    await conn.query(
      `UPDATE coupons SET is_used = 1 WHERE id = ? AND user_id = ?`,
      [order.coupon_id, order.user_id]
    );
  }

  // (f) 포인트 차감
  const usedPoint = Number(order.used_point || 0);
  if (usedPoint > 0) {
    await conn.query(
      `INSERT INTO points (user_id, change_type, amount, description, created_at)
       VALUES (?, '사용', ?, '주문 결제 차감', NOW())`,
      [order.user_id, usedPoint]
    );
  }

  await conn.commit();

    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return res.json({ success: true, payment: data, paymentId });
  } catch (err) {
    console.error("❌ Toss confirm error:", {
      status: err.response?.status,
      data: err.response?.data,
    });
    const status = err.response?.status || 500;
    const payload = err.response?.data || {
      code: "UNKNOWN",
      message: "Toss confirm failed",
    };
    return res.status(status).json({ success: false, ...payload });
  }
});

/**
 * [POST] /api/payments/free-checkout
 * body: { cart_item_ids:number[], coupon_id?:number, used_point?:number }
 * 0원 결제(쿠폰/포인트로 전액 차감) → 주문/결제 즉시 paid 처리
 */
router.post("/free-checkout", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const cart_item_ids = (req.body?.cart_item_ids || [])
    .map(Number)
    .filter(Boolean);
  const coupon_id = req.body?.coupon_id ? Number(req.body.coupon_id) : null;
  const used_point = Number(req.body?.used_point || 0);

  if (!userId)
    return res
      .status(401)
      .json({ success: false, error: "USER_NOT_AUTHENTICATED" });
  if (!cart_item_ids.length)
    return res.status(400).json({ success: false, error: "EMPTY_CART_ITEMS" });

  try {
    // 1) 장바구니/합계 및 혜택 재계산(서버 권위)
    const { items, baseTotal } = await getCartItemsAndTotal({
      userId,
      cartItemIds: cart_item_ids,
    });

    // 2) 쿠폰 유효성 + 할인액
    const { discount: couponDiscount, couponRow } =
      await getCouponDiscountIfValid({
        couponId: coupon_id,
        userId,
        baseTotal,
      });

    // 3) 포인트 사용량 산정 (보유/요청/최대가능치 중 최소)
    const pointBalance = await getUserPointBalance(userId);
    const maxPointUsable = Math.max(0, baseTotal - couponDiscount);
    const pointToUse = Math.min(
      Math.max(0, Number(used_point || 0)),
      pointBalance,
      maxPointUsable
    );

    // 4) 최종금액 검증 — 무료 결제만 허용
    const finalAmount = Math.max(0, baseTotal - couponDiscount - pointToUse);
    if (finalAmount !== 0) {
      return res.status(400).json({
        success: false,
        code: "FREE_CHECKOUT_NOT_ZERO",
        error: "0원 결제가 아닙니다. 일반 결제를 진행해주세요.",
        serverCalculatedAmount: finalAmount,
      });
    }

    // 5) 트랜잭션: 주문/항목/결제/쿠폰/포인트
    const conn = await db.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();

      const [o] = await conn.query(
        `INSERT INTO orders
           (user_id, order_status, total_amount, used_point, coupon_id, payment_method, created_at, updated_at)
         VALUES (?, 'pending', 0, ?, ?, 'free', NOW(), NOW())`,
        [userId, pointToUse, couponRow ? couponRow.id : null]
      );
      orderId = o.insertId;

      // (A) 회차별 재고 확인 & 차감 (무료결제도 동일하게 처리)
for (const it of items) {
  const q = Number(it.quantity || 1);
  if (it.schedule_session_id) {
    const [[row]] = await conn.query(
      `SELECT remaining_spots
         FROM schedule_sessions
        WHERE id = ?
        FOR UPDATE`,
      [it.schedule_session_id]
    );
    if (!row) throw new Error(`회차 ${it.schedule_session_id} 없음`);
    if (Number(row.remaining_spots) < q) {
      throw new Error(`회차 ${it.schedule_session_id} 잔여 부족`);
    }
    await conn.query(
      `UPDATE schedule_sessions
          SET remaining_spots = remaining_spots - ?
        WHERE id = ?`,
      [q, it.schedule_session_id]
    );
  }
}


      const [pmt] = await conn.query(
        `INSERT INTO payments
           (user_id, amount, currency, payment_method, status, created_at, updated_at)
         VALUES (?, 0, 'KRW', 'free', '완료', NOW(), NOW())`,
        [userId]
      );

      await conn.query(
        `UPDATE orders
            SET order_status='paid', payment_method='free', payment_id = ?, updated_at=NOW()
          WHERE id=?`,
        [pmt.insertId, orderId]
      );

      if (couponRow) {
        await conn.query(
          `UPDATE coupons SET is_used = 1 WHERE id = ? AND user_id = ?`,
          [couponRow.id, userId]
        );
      }

      if (pointToUse > 0) {
        await conn.query(
          `INSERT INTO points (user_id, change_type, amount, description, created_at)
           VALUES (?, '사용', ?, '주문 결제 차감(무료결제)', NOW())`,
          [userId, pointToUse]
        );
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return res.json({ success: true, orderId });
  } catch (err) {
    console.error("free-checkout error:", err?.message || err);
    return res
      .status(500)
      .json({ success: false, error: "무료 결제 처리 실패" });
  }
});

module.exports = router;
