const express = require("express");
const router = express.Router();
const { upload, uploadToBlob } = require("../middlewares/uploadBlob");
const pool = require("../config/db");

const {
  getPaymentHistory,
  getCourseInfo,
  getCoupons,
  getPoints,
  createInquiry,
  getInquiriesByUser,
  updateInquiryAnswer,
  getUserInfo,
  updateUserInfo,
  changePassword, // ✅ 추가
  deleteAccount, // ✅ 추가
} = require("../controllers/mypageController");

const { authenticateToken } = require("../middlewares/authMiddleware");
const { deleteInquiry } = require("../controllers/mypageController");
// 사용자 정보 조회 & 수정 & 삭제
router.get("/info", authenticateToken, getUserInfo);
router.patch("/info", authenticateToken, updateUserInfo);
router.post("/change-password", authenticateToken, changePassword);
router.delete("/delete-account", authenticateToken, deleteAccount);

// 수강내역 조회
router.get("/courses", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { all } = req.query;

  try {
    if (all === "true") {
      const [rows] = await pool.query(
        `SELECT
            s.*,
            o.user_id,
            oi.order_id,
            CASE
              WHEN NOW() < s.start_date THEN '예정'
              WHEN NOW() > s.end_date   THEN '완료'
              ELSE '진행중'
            END AS status,
            (
              SELECT r.id FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
              LIMIT 1
            ) AS review_id,
            (
              SELECT r.rating FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
              LIMIT 1
            ) AS review_rating,
            (
              SELECT r.comment FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
              LIMIT 1
            ) AS review_comment,
            (
              SELECT r.created_at FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
              LIMIT 1
            ) AS review_created_at,
            (
              SELECT r.updated_at FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
              LIMIT 1
            ) AS review_updated_at,
            EXISTS (
              SELECT 1 FROM reviews r
              WHERE r.user_id = o.user_id AND r.product_id = s.product_id
            ) AS is_reviewed
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN schedules s ON oi.schedule_id = s.id
         WHERE o.user_id = ?
           AND o.order_status = 'paid'`,
        [userId]
      );
      return res.json({ success: true, courses: rows });
    }

    // 기본 페이징 처리된 조회 로직 (기존 getCourseInfo 함수 내용)
    return getCourseInfo(req, res);
  } catch (error) {
    console.error("❌ 전체 수강 데이터 조회 실패:", error);
    return res
      .status(500)
      .json({ success: false, message: "수강정보 조회 실패" });
  }
});

// 결제내역 조회
router.get("/payments", authenticateToken, getPaymentHistory);

// 쿠폰 조회
router.get("/coupons", authenticateToken, getCoupons);

// 포인트 조회
router.get("/points", authenticateToken, getPoints);

// 1:1 문의 생성
router.post(
  "/inquiries",
  authenticateToken,
  upload.single("attachment"),
  uploadToBlob,
  createInquiry
);

// 1:1 문의 조회
router.get("/inquiries", authenticateToken, getInquiriesByUser);

// 관리자 답변 추가
router.put("/inquiries/answer", authenticateToken, updateInquiryAnswer);
router.delete("/inquiries/:id", authenticateToken, deleteInquiry);
// ✅ 마이페이지 상단 요약 정보 조회
router.get("/header_summary", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [applications] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN schedules s ON oi.schedule_id = s.id
       WHERE o.user_id = ?
         AND o.order_status = 'paid'
         AND (
           (s.start_date <= NOW() AND NOW() <= s.end_date)
           OR (NOW() < s.start_date)
         )`,
      [userId]
    );

    const [coupons] = await pool.execute(
      "SELECT COUNT(*) AS count FROM coupons WHERE user_id = ? AND is_used = 0 AND (expiry_date IS NULL OR expiry_date >= NOW())",
      [userId]
    );
    const [points] = await pool.execute(
      `SELECT COALESCE(SUM(
         CASE 
           WHEN change_type = '적립' THEN amount
           WHEN change_type = '사용' THEN -amount
           ELSE 0
         END
       ), 0) AS total
       FROM points
       WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      applicationsCount: applications[0].count,
      couponsCount: coupons[0].count,
      totalPoints: points[0].total,
    });
  } catch (err) {
    console.error("header_summary error:", err);
    return res.status(500).json({ message: "요약 정보 조회 실패" });
  }
});

exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, phone } = req.body;

    if (!userId) return res.status(401).json({ message: "로그인 필요" });
    if (!username || !phone) {
      return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
    }

    await userModel.updateUserInfoById(userId, username, phone);
    return res
      .status(200)
      .json({ success: true, message: "정보가 수정되었습니다." });
  } catch (error) {
    console.error("❌ 유저 정보 수정 실패:", error);
    return res.status(500).json({ message: "유저 정보 수정 실패" });
  }
};
module.exports = router;
