const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middlewares/authMiddleware"); // ✅ 인증 미들웨어 추가

// 공개용 일정 목록 조회
router.get("/public", async (req, res) => {
  let {
    type,
    sort = "start_date",
    order = "asc",
    start_date,
    end_date,
  } = req.query;

  type = (type ?? "").trim();
  const hasRange = !!(start_date && end_date);

  console.log("🔍 API 요청 받은 type =", type); // ✅ 로그 찍기

  const allowedSortFields = ["start_date", "end_date", "price", "created_at"];
  const sortField = allowedSortFields.includes(sort) ? sort : "start_date";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  try {
    let query = `
  SELECT 
    s.*, 
    p.title AS product_title, 
    p.type, 
    p.image_url AS product_image
  FROM schedules s
  JOIN products p ON s.product_id = p.id
  WHERE p.category = '교육'
    AND s.status = 'open'
    AND s.is_active = 1
`;

    const values = [];

    if (type && type !== "전체") {
      query += " AND p.type = ?";
      values.push(type);
    }

    // 기간 필터 추가: start_date, end_date가 모두 있을 때만 적용
    if (hasRange) {
      query +=
        " AND s.start_date <= ? AND (s.end_date IS NULL OR s.end_date >= ?)";
      values.push(end_date, start_date);
    }
    query += ` ORDER BY s.${sortField} ${sortOrder}`;
    const [rows] = await pool.execute(query, values);

    res.json({ success: true, schedules: rows });
  } catch (err) {
    console.error("공개 일정 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
router.get("/:id/reviews/check-eligible", async (req, res) => {
  const scheduleId = req.params.id;

  // 로그인 상태에서만 userId 확인 (authMiddleware 없이)
  const userId = req.user?.id || null;

  // 로그인 안 한 경우 → eligible: false 반환
  if (!userId) {
    return res.json({ success: true, eligible: false });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT 1
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.schedule_id = ? AND o.order_status = 'paid'
       LIMIT 1`,
      [userId, scheduleId]
    );

    const eligible = rows.length > 0;
    return res.json({ success: true, eligible });
  } catch (err) {
    console.error("후기 작성 가능 여부 확인 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 공개용 일정 단건 조회
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
  s.*, 
  s.product_id, -- ✅ 명시적 추가
  p.title AS product_title, 
  p.image_url AS product_image, 
  p.price AS product_price,
  p.type AS type
       FROM schedules s
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id = ? 
         AND s.status = 'open' 
         AND s.is_active = 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "일정 없음" });
    }

    return res.json({ success: true, schedule: rows[0] });
  } catch (err) {
    console.error("❌ 공개 일정 단건 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
