// backend/routes/admin/schedules.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../../middlewares/authMiddleware"); // ✅ 이 줄 추가!

router.get("/", authenticateToken, adminOnly, async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    sort = "start_date",
    order = "desc",
    tabType, // 탭 필터용
    searchField, // 검색 대상 컬럼 (프론트에서 보냄)
    search,
  } = req.query;
  // ✅ 로그 추가 ①: 쿼리 파라미터 수신 확인

  try {
    // 1. 전체 일정 조회 (JOIN 포함)
    const [rows] = await pool.execute(`
      SELECT
        s.*,
        s.image_url AS schedule_image, -- ✅ 추가
        p.title AS product_title,
        p.type AS product_type,
        p.category AS product_category, -- ✅ 이 줄 추가
        p.image_url AS product_image
      FROM schedules s
      LEFT JOIN products p ON s.product_id = p.id
    `);

    let filtered = rows;

    if (tabType && tabType !== "전체") {
      filtered = filtered.filter((s) => s.product_type === tabType);
    }

    // 3. 필터 - 검색 필드
    if (searchField === "is_active") {
      // 비활성 포함 전체 보기
      if (search === "") {
        // 전체 선택 시 필터링 하지 않음
        // 그대로 filtered 유지
      } else {
        // 활성 또는 비활성만 필터
        filtered = filtered.filter((s) => String(s.is_active) === search);
      }
    } else if (searchField && search) {
      filtered = filtered.filter((s) => {
        const value =
          searchField === "product_title"
            ? s.product_title
            : searchField === "product_type"
              ? s.product_type
              : s[searchField];

        if (typeof value === "string") {
          return value.toLowerCase().includes(search.toLowerCase());
        } else if (typeof value === "number") {
          return value === Number(search);
        }
        return true;
      });
    }

    // 4. 정렬
    // 4. 정렬 (null-safe 처리 추가)
    const sorted = [...filtered].sort((a, b) => {
      const aVal =
        sort === "product_title"
          ? a.product_title
          : sort === "product_type"
            ? a.product_type
            : a[sort];
      const bVal =
        sort === "product_title"
          ? b.product_title
          : sort === "product_type"
            ? b.product_type
            : b[sort];

      if (typeof aVal === "string" || typeof bVal === "string") {
        const aStr = aVal || "";
        const bStr = bVal || "";
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      if (
        (typeof aVal === "number" && typeof bVal === "number") ||
        aVal instanceof Date ||
        bVal instanceof Date
      ) {
        return order === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      return 0;
    });

    // 5. 페이징
    const start = (page - 1) * pageSize;

    res.json({
      success: true,
      schedules: sorted,
      totalCount: filtered.length,
    });
  } catch (err) {
    console.error("❌ 일정 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
router.get("/types", authenticateToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT p.type
      FROM schedules s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE p.type IS NOT NULL
    `);

    const types = rows.map((r) => r.type).filter(Boolean);
    res.json({ success: true, types });
  } catch (err) {
    console.error("❌ 유형 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "유형 조회 실패" });
  }
});
// ✅ GET 단건 조회 (상품 정보 포함)
router.get("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, p.title AS product_title, p.type AS product_type, p.image_url AS product_image
       FROM schedules s
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id = ?`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: "일정 없음" });
    return res.json({ success: true, schedule: rows[0] });
  } catch (err) {
    console.error("일정 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ POST 일정 등록 (product_id 포함)
router.post("/", authenticateToken, adminOnly, async (req, res) => {
  const {
    product_id,
    title,
    start_date,
    end_date,
    location,
    instructor,
    description,
    total_spots,
    price,
    detail, // ✅ 추가
    image_url, // ✅ 이거 추가!
  } = req.body;

  if (!product_id || !title || !start_date || !end_date || !price) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    await pool.execute(
      `INSERT INTO schedules (product_id, title, start_date, end_date, location, instructor, description, total_spots, price, detail, image_url,  created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        product_id,
        title,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots,
        price,
        detail,
        image_url,
      ]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("일정 등록 오류:", err);
    return res.status(500).json({ success: false, message: "등록 실패" });
  }
});

// ✅ PUT 일정 수정 (product_id 포함)
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    product_id,
    title,
    start_date,
    end_date,
    location,
    instructor,
    description,
    total_spots,
    price,
    detail,
    image_url, // ✅ 추가
  } = req.body;

  if (!product_id || !title || !start_date || !end_date || !price) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    await pool.execute(
      `UPDATE schedules
       SET product_id=?, title=?, start_date=?, end_date=?, location=?, instructor=?, description=?, total_spots=?, price=?, detail=?, image_url=?, updated_at=NOW()
       WHERE id=?`,
      [
        product_id,
        title,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots,
        price,
        detail,
        image_url, // ✅ 추가
        id,
      ]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("일정 수정 오류:", err);
    return res.status(500).json({ success: false, message: "수정 실패" });
  }
});

// ✅ 일정 활성/비활성 상태 변경 라우터
router.patch("/:id/active", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") {
    return res
      .status(400)
      .json({ success: false, message: "is_active 값이 필요합니다." });
  }

  try {
    await pool.execute(
      `UPDATE schedules SET is_active = ?, updated_at = NOW() WHERE id = ?`,
      [is_active ? 1 : 0, id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ 상태 변경 오류:", err);
    return res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
});

router.delete("/", adminOnly, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "삭제할 ID가 없습니다." });
  }

  try {
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `DELETE FROM schedules WHERE id IN (${placeholders})`;
    await pool.execute(sql, ids);

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ 일정 삭제 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});
// ✅ 일정별 수강자 목록
router.get("/:id/students", authenticateToken, adminOnly, async (req, res) => {
  const scheduleId = req.params.id;

  try {
    // 카트 포함 미결제자
    const [cartItems] = await pool.execute(
      `SELECT c.user_id, u.username, u.email, c.quantity, 'cart' AS source, c.created_at
       FROM cart_items c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.schedule_id = ?`,
      [scheduleId]
    );

    // 결제 완료자
    const [orderItems] = await pool.execute(
      `SELECT o.user_id, u.username, u.email, oi.quantity, 'order' AS source, o.created_at
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE oi.schedule_id = ? AND o.order_status = 'paid'`,
      [scheduleId]
    );

    res.json({
      success: true,
      students: [...cartItems, ...orderItems],
    });
  } catch (err) {
    console.error("❌ 수강자 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
