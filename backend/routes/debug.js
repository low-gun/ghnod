// backend/routes/debug.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/current-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS current_db");
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ DB 이름 조회 오류:", err);
    res.status(500).json({ error: "DB 이름 확인 실패" });
  }
});

module.exports = router;
