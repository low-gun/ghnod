const express = require("express");
const router = express.Router();
const db = require("../../config/db"); // ✅ 상대 경로 맞음
const { authenticateAdmin } = require("../../middlewares/authMiddleware"); // ✅ 추가
// 관리자 전용 사용자 상세 조회
router.get("/users/:id", authenticateAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const query = `
      SELECT
        id,
        username,
        email,
        phone,
        role,
        company,
        department,
        position,
        marketing_agree
      FROM users
      WHERE id = ?
    `;

    const [rows] = await db.query(query, [userId]);

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    const user = rows[0];
    console.log("✅ user row from DB:", user); // 👈 여기 추가
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        marketing_agree: !!user.marketing_agree,
      },
    });
  } catch (err) {
    console.error("❌ 사용자 상세조회 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
