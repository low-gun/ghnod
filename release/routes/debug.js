const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 현재 DB 이름 확인
router.get("/current-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS current_db");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB 이름 조회 실패" });
  }
});

// ✅ 실제 테이블 목록 확인
router.get("/show-tables", async (req, res) => {
  try {
    const [tables] = await db.query("SHOW TABLES");
    res.json({ success: true, tables });
  } catch (err) {
    console.error("❌ 테이블 조회 오류:", err);
    res.status(500).json({ success: false, message: "테이블 조회 실패" });
  }
});

// ✅ 특정 테이블에서 실제 데이터 확인
router.get("/peek-schedules", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM schedules LIMIT 5");
    res.json({ success: true, rows });
  } catch (err) {
    console.error("❌ schedules 조회 오류:", err);
    res.status(500).json({ success: false, message: "schedules 조회 실패" });
  }
});

module.exports = router;
