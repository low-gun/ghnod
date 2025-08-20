// /backend/routes/admin/inquiries.js
const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/adminController");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../../middlewares/authMiddleware");

// 전체 미답변 문의 조회
// GET /api/admin/inquiries
router.get(
  "/",
  authenticateToken,
  authenticateAdmin,
  adminController.getUnansweredInquiries
);

module.exports = router;
