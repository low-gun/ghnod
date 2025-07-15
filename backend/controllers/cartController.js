// backend/controllers/cartController.js

const pool = require("../config/db");

/**
 * 장바구니 목록 조회 (검색/정렬/페이징)
 * GET /api/cart/items?searchType=title&searchValue=ABC&sort=title&order=asc&page=1&pageSize=10
 * (로그인 사용자 전용 예시)
 */
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    // 🔥 콘솔 로그
    console.log("🔥 [getCartItems] req.query:", req.query);
    console.log("🔥 [getCartItems] ids:", req.query.ids);
    console.log("🔥 [getCartItems] excludeBuyNow:", req.query.excludeBuyNow);
    console.log("🔥 [getCartItems] userId:", userId);
    console.log("🔥 [getCartItems] guestToken:", guestToken);

    if (!userId && !guestToken) {
      return res.status(400).json({
        success: false,
        message: "사용자 정보가 없습니다.",
      });
    }

    const values = [];
    let whereClause = "";

    if (userId) {
      whereClause = "WHERE ci.user_id = ?";
      values.push(userId);
    } else {
      whereClause = "WHERE ci.guest_token = ?";
      values.push(guestToken);
    }

    // ✅ ids 파라미터 처리
    let idList = [];
    if (Array.isArray(req.query.ids)) {
      idList = req.query.ids.map((x) => Number(x));
    } else if (typeof req.query.ids === "string") {
      idList = req.query.ids.split(",").map((x) => Number(x));
    }

    if (idList.length > 0) {
      const placeholders = idList.map(() => "?").join(",");
      whereClause += ` AND ci.id IN (${placeholders})`;
      values.push(...idList);
    } else if (req.query.excludeBuyNow === "true") {
      // ✅ ids가 없을 경우에만 buyNow 제외 필터 적용
      whereClause += " AND (ci.type IS NULL OR ci.type != 'buyNow')";
    }

    const query = `
      SELECT
        ci.id,
        ci.schedule_id,
        s.title AS schedule_title,
        s.start_date,
        s.end_date,
        COALESCE(s.image_url, p.image_url) AS image_url,
        ci.quantity,
        ci.unit_price,
        ci.discount_price,
        (ci.unit_price - ci.discount_price) * ci.quantity AS subtotal
      FROM cart_items ci
      JOIN schedules s ON ci.schedule_id = s.id
      LEFT JOIN products p ON s.product_id = p.id
      ${whereClause}
      ORDER BY ci.updated_at DESC
    `;

    const [rows] = await pool.execute(query, values);

    res.json({
      success: true,
      items: rows,
      totalCount: rows.length,
    });
  } catch (err) {
    console.error("❌ cart_items 조회 실패:", err);
    res.status(500).json({ success: false, message: "장바구니 조회 실패" });
  }
};

/**
 * addToCart
 * - 사용자 장바구니(order_status='cart')에 아이템 추가
 * - (예: POST /api/cart/add)
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;
    const { schedule_id, quantity, unit_price, discount_price, type } =
      req.body;

    if (!userId && !guestToken) {
      return res
        .status(403)
        .json({ success: false, message: "사용자 정보 없음" });
    }

    if (
      schedule_id == null ||
      quantity == null ||
      unit_price == null ||
      typeof unit_price !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "필수 항목 누락 또는 가격 형식 오류",
      });
    }

    const effectiveType = type === "buyNow" ? "buyNow" : "cart";

    console.log(
      "🔍 [중복 체크용] schedule_id:",
      schedule_id,
      "type:",
      effectiveType
    );

    if (effectiveType === "buyNow") {
      console.log("🗑️ 기존 buyNow 항목 삭제 시도");

      let deleteWhere = `schedule_id = ? AND type = 'buyNow'`;
      const deleteValues = [schedule_id];

      if (userId) {
        deleteWhere += " AND user_id = ?";
        deleteValues.push(userId);
      } else {
        deleteWhere += " AND guest_token = ?";
        deleteValues.push(guestToken);
      }

      await pool.execute(
        `DELETE FROM cart_items WHERE ${deleteWhere}`,
        deleteValues
      );
    }

    const [existing] = await pool.execute(
      `SELECT id, quantity FROM cart_items
   WHERE schedule_id = ? AND type = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [schedule_id, effectiveType, userId || guestToken]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
      // 👇 여기 콘솔로그 추가!
      console.log(
        "[장바구니] 기존 수량:", existing[0].quantity,
        "| 받은 quantity:", quantity,
        "| newQty(누적):", newQty
      );
    
      await pool.execute(
        `UPDATE cart_items
         SET quantity = ?, unit_price = ?, discount_price = ?, updated_at = NOW()
         WHERE id = ?`,
        [newQty, unit_price, discount_price || 0, existing[0].id]
      );
    
      return res.json({
        success: true,
        message: "장바구니 수량 추가 완료",
        item: { id: existing[0].id },
      });
    }
    else {
      const buyNowType = type === "buyNow" ? "buyNow" : "cart";

      console.log("📦 [INSERT 요청] type 값 최종:", buyNowType); // ✅ 로그 추가

      const [result] = await pool.execute(
        `INSERT INTO cart_items
   (schedule_id, quantity, unit_price, discount_price, type, ${userId ? "user_id" : "guest_token"})
   VALUES (?, ?, ?, ?, ?, ?)`,
        [
          schedule_id,
          quantity,
          unit_price,
          discount_price || 0,
          buyNowType, // ✅ 명확하게 저장
          userId || guestToken,
        ]
      );

      return res.json({
        success: true,
        message: "장바구니에 추가되었습니다.",
        item: { id: result.insertId }, // ✅ 프론트에서 res.data.item.id 로 읽힘
      });
    }
  } catch (err) {
    console.error("❌ 장바구니 추가 실패:", err);
    res.status(500).json({ success: false, message: "장바구니 추가 실패" });
  }
};

/**
 * removeItem
 * - 장바구니에서 특정 item 삭제
 * - (예: DELETE /api/cart/items/:itemId)
 */
exports.removeItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    if (!userId && !guestToken) {
      return res
        .status(403)
        .json({ success: false, message: "사용자 인증 필요" });
    }

    const [rows] = await pool.execute(
      `SELECT id FROM cart_items
       WHERE id = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [itemId, userId || guestToken]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "해당 항목 없음" });
    }

    await pool.execute(`DELETE FROM cart_items WHERE id = ?`, [itemId]);

    res.json({ success: true, message: "장바구니 항목 삭제 완료" });
  } catch (err) {
    console.error("❌ 장바구니 항목 삭제 실패:", err);
    res.status(500).json({ success: false, message: "삭제 실패" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    if (!userId && !guestToken) {
      return res
        .status(403)
        .json({ success: false, message: "사용자 정보 없음" });
    }

    await pool.execute(
      `DELETE FROM cart_items WHERE ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [userId || guestToken]
    );

    res.json({ success: true, message: "장바구니 전체 비움 완료" });
  } catch (err) {
    console.error("❌ 장바구니 전체 비우기 실패:", err);
    res.status(500).json({ success: false, message: "비우기 실패" });
  }
};

/**
 * 장바구니 합계 다시 계산하는 헬퍼
 */
async function recalcOrderTotal(orderId) {
  const [rows] = await pool.execute(
    `SELECT SUM(subtotal) AS total 
     FROM order_items
     WHERE order_id=?`,
    [orderId]
  );
  const total = rows[0]?.total || 0;
  await pool.execute(`UPDATE orders SET total_amount=? WHERE id=?`, [
    total,
    orderId,
  ]);
}
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
      `SELECT id FROM cart_items WHERE id = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
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
