const express = require("express");
const router = express.Router();
const db = require("../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../middlewares/authMiddleware");
const {
  getMyInfo,
} = require("../controllers/userController");

// ✔️ 로그인된 사용자 정보 조회 (쿠폰 amount 포함)
router.get("/", authenticateToken, getMyInfo);

// ✔️ 관리자 - 전체 유저 목록 조회
router.get("/all", authenticateToken, adminOnly, async (req, res) => {
  const { showDeleted } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, phone, role, is_deleted, created_at, updated_at
       FROM users
       WHERE (? = 'true' OR is_deleted = 0)
       ORDER BY created_at DESC`,
      [showDeleted === "true" ? "true" : "false"]
    );

    return res.json({ success: true, users: rows });
  } catch (err) {
    console.error("❌ 유저 목록 조회 실패:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});


// ✔️ 로그아웃
router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ success: true, message: "로그아웃 완료" });
});

module.exports = router;
