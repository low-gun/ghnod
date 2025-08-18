// (수정 후) backend/routes/cart.js
console.log("✅ [cart.js] 라우터 불러와짐"); // 👈 이 줄 추가
const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  optionalAuthenticate, // ✅ 이 줄 추가
} = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cartController");
const pool = require("../config/db");

// [도움 함수] cart 주문 찾기 (없으면 생성)
async function findOrCreateCartOrderForUser(userId) {
  // ✅ 이미 결제 진행 중인 cart 주문은 제외 (payment_id IS NULL)
  const [orders] = await pool.execute(
    `SELECT id FROM orders 
     WHERE user_id = ? AND order_status = 'cart' AND payment_id IS NULL
     ORDER BY updated_at DESC`,
    [userId]
  );

  if (orders.length > 0) {
    // ✅ 최신 1개만 남기고 나머지는 삭제
    const idsToDelete = orders.slice(1).map((o) => o.id);
    if (idsToDelete.length > 0) {
      await pool.execute(
        `DELETE FROM orders WHERE id IN (${idsToDelete.map(() => "?").join(",")})`,
        idsToDelete
      );
    }
    return orders[0].id;
  }

  // ✅ 없으면 새로 생성
  const [result] = await pool.execute(
    `INSERT INTO orders (user_id, order_status, total_amount, created_at, updated_at)
     VALUES (?, 'cart', 0, NOW(), NOW())`,
    [userId]
  );
  return result.insertId;
}

async function findOrCreateCartOrderForGuest(guestToken) {
  const [orders] = await pool.execute(
    `SELECT id FROM orders
     WHERE guest_token = ? AND order_status = 'cart'
     ORDER BY updated_at DESC`,
    [guestToken]
  );

  if (orders.length > 0) return orders[0].id;

  const [result] = await pool.execute(
    `INSERT INTO orders (guest_token, order_status, total_amount, created_at, updated_at)
     VALUES (?, 'cart', 0, NOW(), NOW())`,
    [guestToken]
  );

  return result.insertId;
}
async function recalcOrderTotal(orderId) {
  await pool.execute(
    `UPDATE orders
     SET total_amount = (
       SELECT COALESCE(SUM(subtotal), 0)
       FROM order_items
       WHERE order_id = ?
     ),
     updated_at = NOW()
     WHERE id = ?`,
    [orderId, orderId]
  );
}
// GET /api/cart/items (비로그인도 허용)
router.get(
  "/items",
  optionalAuthenticate,
  (req, res, next) => {
    if (req.query.excludeBuyNow === "true") {
      req.excludeBuyNow = true;
    }
    next();
  },
  cartController.getCartItems
);
router.post("/items", optionalAuthenticate, (req, res, next) => {
  console.log("📥 [POST /cart/items] body:", req.body); // ✅ 요청 로그 추가

  return cartController.addToCart(req, res, next);
});

// 2) PUT /api/cart/items/:itemId - 아이템 수정 (비로그인도 허용)

// ✅ '특정 경로'를 '파라미터 경로'보다 먼저 선언
router.delete(
  "/items/clear",
  authenticateToken,
  (req, res, next) => {
    console.log("🧨 DELETE /items/clear 라우터 진입");
    next();
  },
  cartController.clearCart
);

router.put(
  "/items/:itemId",
  optionalAuthenticate,
  cartController.updateCartItem
);
router.delete(
  "/items/:itemId",
  optionalAuthenticate,
  cartController.removeItem
);
exports.updateCartItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    const { quantity, unit_price, discount_price } = req.body;

    if (!itemId || !quantity || typeof unit_price !== "number") {
      return res.status(400).json({ success: false, message: "잘못된 요청" });
    }

    if (!userId && !guestToken) {
      return res
        .status(403)
        .json({ success: false, message: "인증 정보 없음" });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM cart_items WHERE id = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [itemId, userId || guestToken]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "항목 없음 또는 권한 없음" });
    }

    const discount = discount_price ?? 0;
    const subtotal = (unit_price - discount) * quantity;

    await pool.execute(
      `UPDATE cart_items
       SET quantity = ?, unit_price = ?, discount_price = ?, updated_at = NOW()
       WHERE id = ?`,
      [quantity, unit_price, discount, itemId]
    );

    return res.json({ success: true, message: "장바구니 항목 수정 완료" });
  } catch (err) {
    console.error("❌ 장바구니 항목 수정 실패:", err);
    return res
      .status(500)
      .json({ success: false, message: "장바구니 항목 수정 실패" });
  }
};
// ✅ 게스트 장바구니 → 로그인 유저로 이전
router.post("/migrate", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const guestToken = req.headers["x-guest-token"];

  if (!guestToken) {
    console.warn("🔁 guest_token 없음 → 병합할 항목 없음 (204 No Content)");
    return res.status(204).end();
  }

  try {
    const [result] = await pool.execute(
      `UPDATE cart_items
       SET user_id = ?, guest_token = NULL
       WHERE guest_token = ? AND user_id IS NULL`,
      [userId, guestToken]
    );

    res.json({
      success: true,
      message: "장바구니 이전 완료",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("❌ cart migrate 실패:", err);
    res.status(500).json({ success: false, message: "장바구니 이전 실패" });
  }
});

module.exports = router;
