const db = require("../config/db");

exports.getPaymentHistoryByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      o.id AS order_id,
      o.total_amount AS amount,
      o.used_point,
      IFNULL(
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
        ),
        0
      ) AS coupon_discount,
      (
        SELECT SUM(quantity)
        FROM order_items
        WHERE order_id = o.id
      ) AS total_quantity,
      (
        SELECT GROUP_CONCAT(s.title SEPARATOR ', ')
        FROM order_items oi
        JOIN schedules s ON oi.schedule_id = s.id
        WHERE oi.order_id = o.id
      ) AS product_titles,       -- ✅ 추가
      o.payment_method,
      o.order_status AS status,
      o.created_at,
      o.refunded_at,
      p.approval_code
    FROM orders o
    LEFT JOIN payments p ON o.payment_id = p.id
    WHERE o.user_id = ?
      AND o.order_status IN ('paid','refunded')
    ORDER BY o.created_at DESC
    `,
    [userId]
  );
  return rows;
};
