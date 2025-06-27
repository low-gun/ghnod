const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const pool = require("../config/db"); // DB 커넥션 풀

// 📌 [GET] /api/orders - 사용자 주문 목록 조회
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  console.log("✅ /api/orders 호출됨. userId:", userId); // 🔥 이 로그 꼭 넣기

  try {
    console.log("✅ userId:", userId);
    const [orders] = await pool.execute(
      `SELECT id, user_id, order_status, total_amount, created_at, updated_at
         FROM orders
         WHERE user_id = ?`,
      [userId]
    );
    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ 주문 목록 조회 실패:", err);
    res.status(500).json({ success: false, message: "주문 목록 조회 실패" });
  }
});
// 📌 [PUT] /api/orders/:id - 주문 상태 '결제완료' 처리
// 📌 [PUT] /api/orders/:id - 주문 상태 '결제완료' 처리
router.put("/:id", authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const conn = await pool.getConnection();
  try {
    const [[orderRow]] = await conn.query(
      `SELECT o.*, (
         SELECT COALESCE(SUM(subtotal),0)
         FROM order_items
         WHERE order_id = o.id
       ) AS calc_total
       FROM orders o
       WHERE o.id = ? AND o.user_id = ? FOR UPDATE`,
      [orderId, userId]
    );

    if (!orderRow) {
      return res
        .status(404)
        .json({ success: false, message: "주문을 찾을 수 없습니다." });
    }

    await conn.beginTransaction();

    // 📌 결제 정보 저장
    const [payRes] = await conn.query(
      `INSERT INTO payments 
         (user_id, amount, currency, payment_method, status, created_at, updated_at)
       VALUES (?, ?, 'KRW', ?, '완료', NOW(), NOW())`,
      [userId, orderRow.calc_total, orderRow.payment_method || "card"]
    );
    const paymentId = payRes.insertId;

    // ✅ 주문 상태를 paid로 업데이트 (중요!)
    await conn.query(
      `UPDATE orders 
       SET order_status = 'paid',
           total_amount = ?, 
           used_point = ?, 
           coupon_id = ?, 
           payment_id = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [
        orderRow.total_amount,
        orderRow.used_point || 0,
        orderRow.coupon_id || null,
        paymentId,
        orderId,
      ]
    );

    // 📌 쿠폰 사용 처리
    if (orderRow.coupon_id) {
      await conn.query(
        `UPDATE coupons
         SET is_used = 1
         WHERE id = ?`,
        [orderRow.coupon_id]
      );
    }

    // 📌 buyNow 타입 장바구니 비우기
    await conn.query(
      `DELETE FROM cart_items WHERE user_id = ? AND type = 'buyNow'`,
      [userId]
    );

    await conn.commit();

    res.json({ success: true, message: "결제 완료", payment_id: paymentId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 결제 처리 실패 :", err);
    res.status(500).json({ success: false, message: "결제 처리 실패" });
  } finally {
    conn.release();
  }
});

// 📌 [GET] /api/orders/:id/items - 특정 주문의 항목 목록 조회
router.get("/:id/items", authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  try {
    const [items] = await pool.execute(
      `
      SELECT 
  oi.id,
  oi.quantity,
  oi.unit_price,
  oi.discount_price,
  oi.subtotal,
  s.title AS title,                      -- ✅ 프론트에서 기대하는 item.title
  s.id AS schedule_id,
  s.image_url,
  s.start_date,
  s.end_date,
  p.type,
  p.price AS price                      -- ✅ 프론트에서 기대하는 item.price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN schedules s ON oi.schedule_id = s.id
LEFT JOIN products p ON s.product_id = p.id
WHERE oi.order_id = ?`,
      [orderId]
    );
    console.log("🧾 주문 ID:", orderId);
    const [orderInfoRows] = await pool.execute(
      `
      SELECT 
        o.total_amount,

        o.used_point,
        o.created_at,
        (
          SELECT 
            CASE 
              WHEN ct.discount_type = 'fixed' THEN ct.discount_amount
              WHEN ct.discount_type = 'percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
              ELSE 0
            END
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = o.coupon_id
          LIMIT 1
        ) AS coupon_discount
      FROM orders o
      WHERE o.id = ?
      `,
      [orderId]
    );
    console.log("📄 주문 정보:", orderInfoRows);
    console.log("📦 order_items 결과:", items);
    console.log("📄 orderInfoRows 결과:", orderInfoRows);
    res.json({
      success: true,
      order: orderInfoRows[0] || {},
      items,
    });
  } catch (err) {
    console.error("주문 항목 조회 실패:", err);
    res.status(500).json({ success: false, message: "주문 항목 조회 실패" });
  }
});

// ✅ [POST] /api/orders - 새 주문 생성
router.post("/", authenticateToken, async (req, res) => {
  console.log("✅ /api/orders 진입"); // ✅ 이 줄 추가
  const userId = req.user.id;
  const { cart_item_ids, coupon_id, used_point, payment_method } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) cart_items 조회
    const [cartItems] = await conn.query(
      `SELECT id, schedule_id, quantity, unit_price, discount_price
       FROM cart_items
       WHERE id IN (?) AND user_id = ?`,
      [cart_item_ids, userId]
    );

    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "장바구니 항목을 찾을 수 없습니다." });
    }

    // 2) 주문 생성
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, order_status, total_amount, payment_method, created_at, updated_at)
       VALUES (?, 'pending', 0, ?, NOW(), NOW())`,
      [userId, payment_method]
    );
    const orderId = orderResult.insertId;

    let orderTotal = 0;
    let discount = 0;
    let validatedCouponId = null;

    // 3) order_items 저장
    for (const item of cartItems) {
      const discountAmt = item.discount_price || 0;
      const subtotal = (item.unit_price - discountAmt) * item.quantity;
      orderTotal += subtotal;

      await conn.query(
        `INSERT INTO order_items (order_id, schedule_id, quantity, unit_price, discount_price, subtotal, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          item.schedule_id,
          item.quantity,
          item.unit_price,
          discountAmt,
          subtotal,
        ]
      );
    }

    // 4) 쿠폰 적용
    if (coupon_id) {
      const [[couponCheck]] = await conn.query(
        `SELECT c.id FROM coupons c
         WHERE c.id = ? AND c.is_used = 0 AND (c.expiry_date IS NULL OR c.expiry_date > NOW())`,
        [coupon_id]
      );

      if (couponCheck) {
        const [couponRows] = await conn.query(
          `SELECT ct.discount_type, ct.discount_amount, ct.discount_value
           FROM coupons c
           JOIN coupon_templates ct ON c.template_id = ct.id
           WHERE c.id = ?`,
          [coupon_id]
        );

        if (couponRows.length > 0) {
          const coupon = couponRows[0];
          if (coupon.discount_type === "fixed") {
            discount = coupon.discount_amount || 0;
          } else if (coupon.discount_type === "percent") {
            discount = Math.floor(
              (orderTotal * (coupon.discount_value || 0)) / 100
            );
          }

          orderTotal -= discount;
          validatedCouponId = coupon_id;

          console.log("💸 할인 적용 완료, 할인액:", discount);
        }
      }
    }

    if (validatedCouponId) {
      await conn.query(`UPDATE coupons SET is_used = 1 WHERE id = ?`, [
        validatedCouponId,
      ]);
    }

    // 5) 포인트 사용
    if (used_point && used_point > 0) {
      await conn.query(
        `INSERT INTO points (user_id, change_type, amount, description, created_at, used_at)
         VALUES (?, '사용', ?, '주문 시 사용', NOW(), NOW())`,
        [userId, used_point]
      );
      orderTotal -= used_point;
    }

    if (orderTotal < 0) orderTotal = 0;

    await conn.query(
      `UPDATE orders
       SET total_amount = ?, used_point = ?, coupon_id = ?, coupon_discount = ?, updated_at = NOW()
       WHERE id = ?`,
      [orderTotal, used_point || 0, validatedCouponId, discount, orderId]
    );

    // ✅ 6) 주문에 포함된 cart_items 삭제
    await conn.query(`DELETE FROM cart_items WHERE id IN (?) AND user_id = ?`, [
      cart_item_ids,
      userId,
    ]);

    await conn.commit();
    return res.json({ success: true, order_id: orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 주문 생성 실패:", err);
    return res.status(500).json({ success: false, message: "주문 생성 실패" });
  } finally {
    conn.release();
  }
});

// 📌 [PUT] /api/orders/:id/refund - 주문 환불 처리
router.put("/:id/refund", authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. 주문 상태를 refunded 로 업데이트
    await conn.query(
      `UPDATE orders 
       SET order_status = 'refunded', updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    // 2. 연결된 결제건도 refunded 로 상태 변경
    await conn.query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = NOW()
       WHERE id = (
         SELECT payment_id FROM orders WHERE id = ?
       )`,
      [orderId]
    );

    await conn.commit();
    res.json({ success: true, message: "환불 처리 완료" });
  } catch (err) {
    console.error("❌ 환불 처리 실패:", err);
    res.status(500).json({ success: false, message: "환불 처리 실패" });
  }
});
module.exports = router;
