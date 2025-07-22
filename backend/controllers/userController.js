// backend/controllers/userController.js
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
// ✅ 내 정보 조회 (쿠폰 amount 포함된 상태로 응답)
exports.getMyInfo = async (req, res) => {
  const userId = req.user?.id;

  try {
    const [[user]] = await db.query(
      `SELECT id, username, email, phone, role FROM users WHERE id = ?`,
      [userId]
    );

    const [cartItems] = await db.query(
      `SELECT unit_price, quantity FROM cart_items WHERE user_id = ?`,
      [userId]
    );
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const [couponRows] = await db.query(
      `SELECT c.*, ct.discount_type, ct.discount_amount, ct.discount_value
       FROM coupons c
       JOIN coupon_templates ct ON c.template_id = ct.id
       WHERE c.user_id = ? AND c.is_used = 0`,
      [userId]
    );
    const coupons = couponRows.map((c) => ({
      ...c,
      amount:
        c.discount_type === "fixed"
          ? Number(c.discount_amount || 0)
          : c.discount_type === "percent"
            ? Math.floor((totalPrice * Number(c.discount_value || 0)) / 100)
            : 0,
    }));

    const [pointRow] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN change_type = '사용' THEN -amount ELSE amount END), 0) AS point_balance
       FROM points WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coupons,
        point_balance: Number(pointRow[0].point_balance || 0),
      }
    });
    
  } catch (err) {
    console.error("❌ 내 정보 조회 오류:", err);
    res.status(500).json({ success: false, message: "내 정보 조회 실패" });
  }
};
