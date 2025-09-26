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
router.put(
  "/users/inquiries/:id/answer",
  authenticateToken,
  authenticateAdmin,
  adminController.answerInquiryByAdmin   // ✅ 컨트롤러로 위임
);

// ✅ 관리자 답변 삭제
// DELETE /api/admin/users/inquiries/:id/answer
router.delete(
  "/users/inquiries/:id/answer",
  authenticateToken,
  authenticateAdmin,
  adminController.deleteInquiryAnswer   // ✅ 새 컨트롤러 함수
);

module.exports = router;
