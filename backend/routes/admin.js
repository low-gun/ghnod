// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const adminController = require("../controllers/adminController");
const {
  getUserCourses,
  getUserById,
  getUserPayments,
  getUserPoints,
  getUserCoupons,
} = require("../controllers/adminController");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware");
const productRoutes = require("./admin/products"); // ✅ 추가
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { giveUserCouponsBatch } = require("../controllers/adminController");
router.get(
  "/users/summary/by-ids",
  authenticateToken,
  authenticateAdmin,
  adminController.getUserSummaryByIds
);
router.get(
  "/dashboard-summary",
  authenticateToken,
  adminController.getDashboardSummary
);
// ✅ 일정 서브 라우터 위임 (adminSchedulesController 사용)
router.use("/schedules", require("./admin/schedules"));


// ======================= 사용자 요약 데이터 조회 API =======================
router.get(
  "/users/summary",
  authenticateToken,
  authenticateAdmin,
  adminController.getUserSummary
);
router.get(
  "/inquiries",
  authenticateToken,
  authenticateAdmin,
  adminController.getAllInquiries);
// ======================= 사용자 기본 정보 조회 API =======================
router.get("/users/:id", authenticateToken, authenticateAdmin, getUserById);
router.get(
  "/coupon-templates",
  authenticateToken,
  authenticateAdmin,
  adminController.getCouponTemplates
);
// ======================= 쿠폰 템플릿 등록/수정/삭제 API =======================
router.post(
  "/coupon-templates",
  authenticateToken,
  authenticateAdmin,
  adminController.createCouponTemplate
);
router.patch(
  "/coupon-templates/:id/activate",
  authenticateToken,
  authenticateAdmin,
  adminController.toggleCouponTemplateActive
);

router.put(
  "/coupon-templates/:id",
  authenticateToken,
  authenticateAdmin,
  adminController.updateCouponTemplate
);
router.delete(
  "/coupon-templates/:id",
  authenticateToken,
  authenticateAdmin,
  adminController.deleteCouponTemplate
);

// ======================= 사용자 역할 변경 API =======================
router.put("/users/:id/role", adminController.updateUserRole);

// ======================= 사용자 비밀번호 초기화 API =======================
router.put("/users/:id/reset-password", adminController.resetUserPassword);

// ======================= 사용자 정보 업데이트 API =======================
router.put("/users/:id", authenticateToken, adminController.updateUserInfo);

// ======================= 상품 관련 라우터 연결 =======================
/* ✅ 추가: 상품 삭제 사전 체크 (FK: schedules, reviews) */
router.get(
  "/products/deletion-check",
  authenticateToken,
  authenticateAdmin,
  async (req, res) => {
    try {
      const ids = String(req.query.ids || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);

      if (!ids.length) {
        return res.status(400).json({
          success: false,
          message: "ids 쿼리스트링이 필요합니다. 예: ?ids=1,2,3",
        });
      }

      const placeholders = ids.map(() => "?").join(",");

      const [scheduleBlocks] = await db.query(
        `SELECT product_id, COUNT(*) AS schedule_count
           FROM schedules
          WHERE product_id IN (${placeholders})
          GROUP BY product_id`,
        ids
      );

      const [reviewBlocks] = await db.query(
        `SELECT product_id, COUNT(*) AS review_count
           FROM reviews
          WHERE product_id IN (${placeholders})
          GROUP BY product_id`,
        ids
      );

      const blocked =
        (scheduleBlocks?.length || 0) > 0 || (reviewBlocks?.length || 0) > 0;

      return res.json({
        success: true,
        blocked, // true면 삭제 차단 필요
        details: { scheduleBlocks, reviewBlocks },
      });
    } catch (e) {
      console.error("❌ /products/deletion-check 오류:", e);
      return res.status(500).json({ success: false, message: "체크 실패" });
    }
  }
);

/* ✅ 추가: 상품 일괄 삭제 (컨트롤러로 위임; body.ids 또는 ?ids= 지원) */
router.delete(
  "/products",
  authenticateToken,
  authenticateAdmin,
  adminController.deleteProducts
);

// ======================= 상품 관련 라우터 연결 =======================
router.use("/products", productRoutes); // ✅ 최하단에서 연결

// 상품 활성/비활성 토글
router.put(
  "/products/:id/active",
  authenticateToken,
  authenticateAdmin,
  async (req, res) => {
    // ...
  }
);

// ======================= 사용자 수정 이력 조회 API =======================
router.get("/users/:id/history", async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const offset = (page - 1) * limit;

  try {
    const [history] = await db.query(
      `SELECT uh.*, u.email AS modifier_email
       FROM user_history uh
       LEFT JOIN users u ON uh.modified_by = u.id
       WHERE uh.user_id = ?
       ORDER BY uh.changed_at DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM user_history WHERE user_id = ?`,
      [id]
    );

    res.json({ success: true, history, total });
  } catch (error) {
    console.error("❌ [서버 오류]", error);
    res.status(500).json({ success: false });
  }
});

// ======================= 관리자 여부 체크 API =======================
router.get("/check", authenticateToken, (req, res) => {
  if (req.user && req.user.role === "admin") {
    res.json({ isAdmin: true });
  } else {
    res.json({ isAdmin: false });
  }
});

// ======================= 관리자용 유저 마이페이지 뷰어 API =======================
router.get("/users/:id/courses", getUserCourses);
router.get("/users/:id/payments", getUserPayments);
router.get("/users/:id/coupons", getUserCoupons);
router.post("/users/:id/coupons", adminController.giveUserCoupon);
router.get("/users/:id/points", getUserPoints);

// ======================= 사용자 목록 조회 API =======================
// ======================= 사용자 목록 조회 API =======================
const { getUsers } = require("../controllers/adminController");

router.get("/users", authenticateToken, authenticateAdmin, getUsers);

// ======================= 사용자 활성/비활성 상태 변경 API =======================
router.put("/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_deleted } = req.body;

  const deleted = Number(is_deleted);
  console.log("🧪 상태 변경 요청 도착", id, { is_deleted });
  console.log("🧪 is_deleted 실제 타입:", is_deleted, typeof is_deleted);

  if (![0, 1].includes(deleted)) {
    return res
      .status(400)
      .json({ success: false, message: "is_deleted 값이 잘못되었습니다." });
  }

  try {
    const [result] = await db.query(
      "UPDATE users SET is_deleted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [deleted, id]
    );
    console.log("🧪 업데이트 결과:", result);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "계정 상태가 변경되었습니다." });
  } catch (error) {
    console.error("❌ 계정 상태 변경 오류:", error);
    res.status(500).json({ success: false, message: "계정 상태 변경 실패" });
  }
});
router.get(
  "/payments",
  authenticateToken,
  authenticateAdmin,
  (req, res, next) => {
    console.log("▶ [ADMIN-ROUTE] GET /admin/payments  query:", req.query);
    next();
  },
  async (req, res, next) => {
    try {
      await adminController.getAllPayments(req, res);
      console.log("◀ [ADMIN-ROUTE] /admin/payments 응답 완료");
    } catch (err) {
      console.error("❌ [ADMIN-ROUTE] /admin/payments 오류:", err);
      next(err);
    }
  }
);

// ======================= 쿠폰 템플릿 활성화/비활성화 토글 =======================

router.get(
  "/payments/:id",
  authenticateToken,
  authenticateAdmin,
  adminController.getPaymentDetail
);
// ✅ 결제 상세 조회
router.put(
  "/orders/:id/refund",
  authenticateToken,
  authenticateAdmin,
  adminController.refundOrderByAdmin
);
// ✅ 이걸로 교체
router.post(
  "/batch-coupons",
  authenticateToken,
  authenticateAdmin,
  adminController.giveUserCouponsBatch
);

router.post(
  "/batch-points",
  authenticateToken,
  authenticateAdmin,
  adminController.giveUserPointsBatch
);
// ======================= 쿠폰 회수 API =======================
router.delete("/users/coupons/:couponId", async (req, res) => {
  const { couponId } = req.params;

  try {
    const [rows] = await db.query(`SELECT is_used FROM coupons WHERE id = ?`, [
      couponId,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰을 찾을 수 없습니다." });
    }

    if (rows[0].is_used === 1) {
      return res.status(400).json({
        success: false,
        message: "이미 사용된 쿠폰은 회수할 수 없습니다.",
      });
    }

    await db.query(`UPDATE coupons SET is_used = -1 WHERE id = ?`, [couponId]);

    return res.json({
      success: true,
      message: "쿠폰이 성공적으로 회수되었습니다.",
    });
  } catch (error) {
    console.error("❌ 쿠폰 회수 실패:", error);
    return res
      .status(500)
      .json({ success: false, message: "서버 오류로 쿠폰 회수 실패" });
  }
});

// 문의 답변 등록 (관리자 전용)
router.put(
  "/users/inquiries/:id/answer",
  authenticateToken,
  authenticateAdmin,
  adminController.answerInquiryByAdmin
);

router.get("/users/:id/inquiries", async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT id, title, message, answer, status, created_at, answered_at
       FROM inquiries
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, inquiries: rows });
  } catch (err) {
    console.error("❌ 관리자 문의 내역 조회 실패:", err);
    res.status(500).json({ success: false, message: "문의 조회 실패" });
  }
});
module.exports = router;
