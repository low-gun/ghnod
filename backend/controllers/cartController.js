// backend/controllers/cartController.js
const pool = require("../config/db");

/**
 * 장바구니 목록 조회
 * GET /api/cart/items
 * - 회차가 있으면 회차 기간/시간 우선 노출
 */
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    if (!userId && !guestToken) {
      return res.status(400).json({ success: false, message: "사용자 정보가 없습니다." });
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

    // ids 필터 (선택)
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
      // ids가 없을 때만 buyNow 제외
      whereClause += " AND (ci.type IS NULL OR ci.type != 'buyNow')";
    }

    const query = `
      SELECT
  ci.id,
  ci.schedule_id,
  ci.schedule_session_id,
  s.title AS schedule_title,
  COALESCE(ss.start_date, s.start_date) AS start_date,
  COALESCE(ss.end_date,   s.end_date)   AS end_date,
  ss.start_time,
  ss.end_time,
  p.type AS type,                                   -- ✅ 상세 경로용
  ss.total_spots AS session_total_spots,            -- ✅ 회차 총원(표시/검증용)
  ss.remaining_spots AS session_remaining_spots,    -- ✅ 회차 잔여(표시/검증용)
  COALESCE(s.image_url, p.image_url) AS image_url,
  ci.quantity,
  ci.unit_price,
  ci.discount_price,
  (ci.unit_price - ci.discount_price) * ci.quantity AS subtotal

      FROM cart_items ci
      JOIN schedules s ON ci.schedule_id = s.id
      LEFT JOIN schedule_sessions ss ON ss.id = ci.schedule_session_id
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
 * - 회차(scheduler_session_id)가 있으면 병합 기준에 포함
 * - buyNow는 동일 schedule(+session) 기존 항목 제거 후 1건만 유지
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;
    const { schedule_id, schedule_session_id, quantity, unit_price, discount_price, type } = req.body;

    if (!userId && !guestToken) {
      return res.status(403).json({ success: false, message: "사용자 정보 없음" });
    }
    if (
      schedule_id == null ||
      quantity == null ||
      unit_price == null ||
      typeof unit_price !== "number"
    ) {
      return res.status(400).json({ success: false, message: "필수 항목 누락 또는 가격 형식 오류" });
    }

    const effectiveType = type === "buyNow" ? "buyNow" : "cart";

    // 회차 검증(선택): 값이 있으면 존재/소속 체크
    let sessionId = null;
    if (schedule_session_id !== undefined && schedule_session_id !== null && schedule_session_id !== "") {
      const sid = Number(schedule_session_id);
      if (!Number.isInteger(sid) || sid <= 0) {
        return res.status(400).json({ success: false, message: "유효하지 않은 회차입니다." });
      }
      const [sess] = await pool.execute(
        `SELECT schedule_id FROM schedule_sessions WHERE id = ?`,
        [sid]
      );
      if (sess.length === 0) {
        return res.status(400).json({ success: false, message: "존재하지 않는 회차입니다." });
      }
      if (sess[0].schedule_id !== Number(schedule_id)) {
        return res.status(400).json({ success: false, message: "회차가 해당 일정과 일치하지 않습니다." });
      }
      
      // 잔여 인원 확인
      const [[spotRow]] = await pool.execute(
        `SELECT remaining_spots FROM schedule_sessions WHERE id = ?`,
        [sid]
      );
      if (!spotRow || spotRow.remaining_spots < quantity) {
        return res.status(400).json({ success: false, message: "회차 잔여 인원이 부족합니다." });
      }
      
      sessionId = sid;
      
    }

    // buyNow는 동일 schedule(+session)의 기존 항목 제거
    if (effectiveType === "buyNow") {
      let deleteWhere = `schedule_id = ? AND type = 'buyNow'`;
      const deleteValues = [schedule_id];

      if (sessionId === null) {
        deleteWhere += ` AND (schedule_session_id IS NULL OR schedule_session_id = 0)`;
      } else {
        deleteWhere += ` AND schedule_session_id = ?`;
        deleteValues.push(sessionId);
      }

      if (userId) {
        deleteWhere += " AND user_id = ?";
        deleteValues.push(userId);
      } else {
        deleteWhere += " AND guest_token = ?";
        deleteValues.push(guestToken);
      }

      await pool.execute(`DELETE FROM cart_items WHERE ${deleteWhere}`, deleteValues);
    }

    // 중복 병합(같은 schedule + 같은 session + 같은 type + 같은 사용자)
    let selectSql = `
      SELECT id, quantity FROM cart_items
      WHERE schedule_id = ? AND type = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}
    `;
    const selectVals = [schedule_id, effectiveType, userId || guestToken];
    if (sessionId === null) {
      selectSql += ` AND (schedule_session_id IS NULL OR schedule_session_id = 0)`;
    } else {
      selectSql += ` AND schedule_session_id = ?`;
      selectVals.push(sessionId);
    }
    const [existing] = await pool.execute(selectSql, selectVals);

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
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
    } else {
      const [result] = await pool.execute(
        `INSERT INTO cart_items
         (schedule_id, schedule_session_id, quantity, unit_price, discount_price, type, ${userId ? "user_id" : "guest_token"})
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule_id,
          sessionId,
          quantity,
          unit_price,
          discount_price || 0,
          effectiveType,
          userId || guestToken,
        ]
      );

      return res.json({
        success: true,
        message: "장바구니에 추가되었습니다.",
        item: { id: result.insertId },
      });
    }
  } catch (err) {
    console.error("❌ 장바구니 추가 실패:", err);
    res.status(500).json({ success: false, message: "장바구니 추가 실패" });
  }
};

/**
 * removeItem
 * - 장바구니 항목 삭제
 */
exports.removeItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    if (!userId && !guestToken) {
      return res.status(403).json({ success: false, message: "사용자 인증 필요" });
    }

    const [rows] = await pool.execute(
      `SELECT id FROM cart_items
       WHERE id = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [itemId, userId || guestToken]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "해당 항목 없음" });
    }

    await pool.execute(`DELETE FROM cart_items WHERE id = ?`, [itemId]);
    res.json({ success: true, message: "장바구니 항목 삭제 완료" });
  } catch (err) {
    console.error("❌ 장바구니 항목 삭제 실패:", err);
    res.status(500).json({ success: false, message: "삭제 실패" });
  }
};

/**
 * 장바구니 전체 비움
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;

    if (!userId && !guestToken) {
      return res.status(403).json({ success: false, message: "사용자 정보 없음" });
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
 * 장바구니 항목 수정
 * - 수량/가격/할인 + 회차 변경(schedule_session_id)
 */
exports.updateCartItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user?.id || null;
    const guestToken = req.headers["x-guest-token"] || null;
    const { quantity, unit_price, discount_price, schedule_session_id } = req.body;

    if (!itemId || !quantity || typeof unit_price !== "number") {
      return res.status(400).json({ success: false, message: "잘못된 요청" });
    }
    if (!userId && !guestToken) {
      return res.status(403).json({ success: false, message: "인증 정보 없음" });
    }

    // 현재 아이템 로드(소유 확인)
    const [itemRows] = await pool.execute(
      `SELECT id, schedule_id, schedule_session_id FROM cart_items
       WHERE id = ? AND ${userId ? "user_id = ?" : "guest_token = ?"}`,
      [itemId, userId || guestToken]
    );
    if (itemRows.length === 0) {
      return res.status(404).json({ success: false, message: "항목 없음 또는 권한 없음" });
    }
    const current = itemRows[0];

    // 회차 변경 검증
    let nextSessionId = current.schedule_session_id ?? null;
    if (schedule_session_id !== undefined) {
      if (schedule_session_id === null || schedule_session_id === "") {
        nextSessionId = null; // 회차 해제
      } else {
        const sid = Number(schedule_session_id);
        if (!Number.isInteger(sid) || sid <= 0) {
          return res.status(400).json({ success: false, message: "유효하지 않은 회차입니다." });
        }
        const [sess] = await pool.execute(
          `SELECT schedule_id FROM schedule_sessions WHERE id = ?`,
          [sid]
        );
        if (sess.length === 0) {
          return res.status(400).json({ success: false, message: "존재하지 않는 회차입니다." });
        }
        if (sess[0].schedule_id !== current.schedule_id) {
          return res.status(400).json({ success: false, message: "회차가 해당 일정과 일치하지 않습니다." });
        }
        
        // 잔여 인원 확인
        const [[spotRow]] = await pool.execute(
          `SELECT remaining_spots FROM schedule_sessions WHERE id = ?`,
          [sid]
        );
        if (!spotRow || spotRow.remaining_spots < quantity) {
          return res.status(400).json({ success: false, message: "회차 잔여 인원이 부족합니다." });
        }
        
        nextSessionId = sid;
        
      }
    }

    await pool.execute(
      `UPDATE cart_items
       SET quantity = ?, unit_price = ?, discount_price = ?, schedule_session_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [quantity, unit_price, discount_price ?? 0, nextSessionId, itemId]
    );

    return res.json({ success: true, message: "장바구니 항목 수정 완료" });
  } catch (err) {
    console.error("❌ 장바구니 항목 수정 실패:", err);
    return res.status(500).json({ success: false, message: "장바구니 항목 수정 실패" });
  }
};
