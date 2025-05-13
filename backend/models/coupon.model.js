const db = require("../config/db");

// 사용자의 쿠폰 목록 조회
exports.getCouponsByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      c.id AS coupon_id,
      ct.code,
      ct.name,
      ct.discount_amount,
      c.is_used,
      c.expiry_date
    FROM coupons c
    JOIN coupon_templates ct ON c.template_id = ct.id
    WHERE c.user_id = ?
    ORDER BY c.expiry_date DESC
    `,
    [userId]
  );
  return rows;
};
