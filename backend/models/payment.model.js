const db = require("../config/db");

// payment.model.js (수정 후)
exports.getPaymentHistoryByUser = async (userId) => {
  const pool = require("../config/db"); // ← 반드시 상단에 추가
  const [rows] = await pool.query(
    `
    SELECT 
      o.id AS order_id,
      o.total_amount AS amount,
      o.used_point,
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
      ) AS coupon_discount,
      SUM(oi.quantity) AS quantity,     -- ✅ 주문별 전체 수강인원
      MAX(s.title) AS schedule_title,   -- 여러 row 중 대표값
      MAX(s.image_url) AS image_url,
      MAX(p.type) AS product_type,
      o.order_status AS status,
      o.payment_method,
      o.created_at
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN schedules s ON oi.schedule_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    WHERE o.user_id = ?
      AND o.order_status IN ('paid', 'refunded')
    GROUP BY o.id          -- ✅ 주문번호별 집계
    ORDER BY o.created_at DESC
    `,
    [userId]
  );
  return rows;
};

