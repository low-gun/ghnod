const express = require("express");
const router = express.Router();
const pool = require("../../config/db");

// 공개용 일정 목록 조회
router.get("/public", async (req, res) => {
  const { type, sort = "start_date", order = "asc" } = req.query;

  // ✅ 허용된 정렬 필드만 사용 (SQL 인젝션 방지)
  const allowedSortFields = ["start_date", "end_date", "price", "created_at"];
  const sortField = allowedSortFields.includes(sort) ? sort : "start_date";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  try {
    const [rows] = await pool.execute(
      `SELECT 
         s.*, 
         p.title AS product_title, 
         p.type, 
         p.image_url AS product_image -- ✅ 상품 썸네일 별칭으로 분리
       FROM schedules s
       JOIN products p ON s.product_id = p.id
       WHERE p.category = '교육'
         AND p.type = ?
         AND s.status = 'open'
         AND s.is_active = 1
       ORDER BY s.${sortField} ${sortOrder}`,
      [type]
    );

    res.json({ success: true, schedules: rows });
  } catch (err) {
    console.error("공개 일정 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 공개용 일정 단건 조회
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         s.*, 
         p.title AS product_title, 
         p.image_url AS product_image -- ✅ 여기서도 상품 썸네일 별칭 지정
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
