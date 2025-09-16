// /backend/routes/admin/inquiries.js
const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/adminController");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../../middlewares/authMiddleware");
const pool = require("../../config/db");

// 전체 미답변 문의 조회
// GET /api/admin/inquiries
router.get(
  "/",
  authenticateToken,
  authenticateAdmin,
  adminController.getAllInquiries // ← 함수명 변경
);

// 관리자 답변 등록/수정
// PUT /api/admin/users/inquiries/:id/answer
router.put("/users/inquiries/:id/answer", authenticateToken, authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  // 프론트가 content로 보낼 가능성까지 방어
  const payloadAnswer = (req.body?.answer ?? req.body?.content ?? "").toString().trim();

  if (!payloadAnswer) {
    return res.status(400).json({ success: false, message: "답변 내용을 입력하세요." });
  }

  try {
    // 1) 존재 확인
    const [exists] = await pool.execute("SELECT id FROM inquiries WHERE id = ?", [id]);
    if (exists.length === 0) {
      return res.status(404).json({ success: false, message: "문의가 존재하지 않습니다." });
    }

    // 2) answered_by / answered_at 컬럼 존재여부 점검
    const [cols] = await pool.execute(
      "SHOW COLUMNS FROM inquiries WHERE Field IN ('answered_by','answered_at')"
    );
    const hasAnsweredBy = cols.some(c => c.Field === "answered_by");
    const hasAnsweredAt = cols.some(c => c.Field === "answered_at");

    // 3) 동적 UPDATE 구성
    const setParts = ["answer = ?"];
    const params = [payloadAnswer];

    if (hasAnsweredBy) { setParts.push("answered_by = ?"); params.push(req.user?.id ?? null); }
    if (hasAnsweredAt) { setParts.push("answered_at = NOW()"); }

    const sql = `UPDATE inquiries SET ${setParts.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: "답변 저장 실패" });
    }

    return res.json({ success: true });
  } catch (err) {
    // ✅ 에러 상세를 서버 콘솔에 명확히 찍어 원인 즉시 확인
    console.error("❌ 관리자 답변 등록 오류:", {
      message: err?.message,
      code: err?.code,
      sqlMessage: err?.sqlMessage,
      sql: err?.sql
    });
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});


module.exports = router;
