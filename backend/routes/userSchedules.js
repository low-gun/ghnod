// backend/routes/userSchedules.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/education/schedules
 *  - 일반 교육 일정 목록 조회
 */
// 📌 일정 상세 조회 (회차까지 포함)
router.get("/schedules/:id", async (req, res) => {
  const scheduleId = req.params.id;
  try {
    // 1) 기본 일정 정보
    const [[schedule]] = await db.query(
      `SELECT 
         s.id,
         s.title,
         s.start_date,
         s.end_date,
         s.location,
         s.instructor,
         s.description,
         s.detail,
         s.total_spots,
         s.image_url,
         p.id AS product_id,
         p.type,
         p.price AS product_price,
         s.is_active
       FROM schedules s
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id = ?`,
      [scheduleId]
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: "일정을 찾을 수 없습니다." });
    }

    // 2) 회차 정보 가져오기
    const [sessions] = await db.query(
      `SELECT 
         id,
         schedule_id,
         start_date,
         end_date,
         start_time,
         end_time,
         total_spots,
         remaining_spots
       FROM schedule_sessions
       WHERE schedule_id = ?
       ORDER BY start_date ASC`,
      [scheduleId]
    );

    schedule.sessions = sessions;

    return res.json({ success: true, schedule });
  } catch (error) {
    console.error("❌ Error fetching schedule detail:", error);
    return res.status(500).json({ success: false, message: "일정 상세 조회 실패" });
  }
});


module.exports = router;
