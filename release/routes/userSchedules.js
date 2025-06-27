// backend/routes/userSchedules.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/education/schedules
 *  - 일반 교육 일정 목록 조회
 */
router.get("/schedules", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        title,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots
      FROM schedules
      ORDER BY start_date ASC
    `);

    return res.status(200).json({ schedules: rows });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

module.exports = router;
