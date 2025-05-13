const db = require("../config/db");

exports.getPaymentHistoryByUser = async (userId) => {
  const [rows] = await db.query(
    `
      SELECT 
        o.id                       AS order_id,
        o.total_amount             AS amount,
        o.used_point,
        IFNULL(
          (
            SELECT ct.discount_amount
            FROM coupons c
            JOIN coupon_templates ct ON ct.id = c.template_id
            WHERE c.id = o.coupon_id
            LIMIT 1
          ),
          0
        )                         AS coupon_discount,
        (
          SELECT SUM(quantity)
          FROM order_items
          WHERE order_id = o.id
        )                         AS total_quantity,
        o.payment_method,
        o.order_status            AS status,     -- paid / refunded
        o.created_at
      FROM orders o
      WHERE o.user_id = ?
        AND o.order_status IN ('paid','refunded')
      ORDER BY o.created_at DESC
      `,
    [userId]
  );
  return rows;
};
