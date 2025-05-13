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
const {
  generateCertificate,
  toggleCertificateActive,
  updateCertificateTemplate,
} = require("../controllers/adminController");

// ✔️ 업로드 저장 경로 설정
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/certificates/backgrounds/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const certificateUpload = multer({ storage: certificateStorage });
router.get(
  "/dashboard-summary",
  authenticateToken,
  adminController.getDashboardSummary
);
// ======================= 관리자용 일정 조회 =======================
router.get("/schedules", async (req, res) => {
  try {
    const [schedules] = await db.query(
      `SELECT id, title,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        location, instructor, description,
        total_spots, booked_spots
       FROM schedules
       WHERE is_active = 1
       ORDER BY start_date ASC`
    );
    res.json({ success: true, schedules });
  } catch (error) {
    console.error("❌ 일정 조회 오류:", error);
    res.status(500).json({ success: false, message: "일정 불러오기 실패" });
  }
});

// ======================= 일정 추가 API =======================
router.post("/schedules", async (req, res) => {
  try {
    const {
      title,
      start_date,
      end_date,
      location,
      instructor,
      description,
      total_spots,
      price, // ✅ price 항목이 req.body에 있어야 합니다
    } = req.body;

    if (!title || !start_date || !end_date || !total_spots) {
      return res
        .status(400)
        .json({ success: false, message: "필수 입력값이 누락되었습니다." });
    }

    const query = `
      INSERT INTO schedules (
        title, start_date, end_date, location, instructor,
        description, total_spots, booked_spots, price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `;

    const values = [
      title,
      start_date,
      end_date,
      location,
      instructor,
      description,
      total_spots,
      price,
    ];

    await db.query(query, values);
    res.json({ success: true, message: "일정이 추가되었습니다." });
  } catch (error) {
    console.error("❌ 일정 추가 오류:", error);
    res.status(500).json({ success: false, message: "일정 추가 실패" });
  }
});

// ======================= 일정 삭제(숨김 처리) API =======================
router.delete("/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query("SELECT * FROM schedules WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });
    }
    if (existing[0].is_active === 0) {
      return res
        .status(400)
        .json({ success: false, message: "이미 숨겨진 일정입니다." });
    }

    await db.query(
      "UPDATE schedules SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({ success: true, message: "일정이 숨겨졌습니다." });
  } catch (error) {
    console.error("❌ 일정 숨김 오류:", error);
    res.status(500).json({ success: false, message: "일정 숨김 실패" });
  }
});

// ======================= 일정 상세 조회 API =======================
// ⚠️ 이 부분에 있던 router.get("/products", adminController.getProducts); 를 제거했습니다!
router.get("/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [schedules] = await db.query(
      `SELECT id, title,
        DATE_FORMAT(start_date, '%Y-%m-%d %H:%i:%s') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d %H:%i:%s') AS end_date,
        location, instructor, description,
        total_spots, booked_spots, price
       FROM schedules
       WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (schedules.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });
    }

    res.json({ success: true, schedule: schedules[0] });
  } catch (error) {
    console.error("❌ 일정 상세 조회 오류:", error);
    res.status(500).json({ success: false, message: "일정 상세 조회 실패" });
  }
});

// ======================= 일정 수정 API =======================
router.put("/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    product_id,
    start_date,
    end_date,
    location,
    instructor,
    description,
    total_spots,
    price,
  } = req.body;

  if (!title || !start_date || !end_date || !total_spots) {
    return res
      .status(400)
      .json({ success: false, message: "필수 입력값이 누락되었습니다." });
  }

  try {
    const [result] = await db.query(
      `UPDATE schedules SET
        title = ?,
        product_id = ?,
        start_date = ?,
        end_date = ?,
        location = ?,
        instructor = ?,
        description = ?,
        total_spots = ?,
        price = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title,
        product_id || null,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots,
        price,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "해당 일정이 존재하지 않습니다." });
    }

    res.json({ success: true, message: "일정이 수정되었습니다." });
  } catch (error) {
    console.error("❌ 일정 수정 오류:", error);
    res.status(500).json({ success: false, message: "일정 수정 실패" });
  }
});

// ======================= 사용자 요약 데이터 조회 API =======================
router.get("/users/summary", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      sort = "username",
      order = "asc",
      type = "all",
      search = "",
    } = req.query;

    const offset = (page - 1) * pageSize;
    const validFields = [
      "username",
      "email",
      "courseCount",
      "pointTotal",
      "paymentTotal",
      "couponCount",
      "inquiryCount",
    ];
    const sortField = validFields.includes(sort) ? sort : "username";
    const sortOrder = order === "desc" ? "DESC" : "ASC";

    let whereClause = "WHERE u.is_deleted = 0";
    let values = [];

    if (search) {
      if (type !== "all" && ["username", "email"].includes(type)) {
        whereClause += ` AND u.${type} LIKE ?`;
        values.push(`%${search}%`);
      } else {
        whereClause += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
        values.push(`%${search}%`, `%${search}%`);
      }
    }

    const countQuery = `SELECT COUNT(*) AS totalCount FROM users u ${whereClause}`;
    const [[{ totalCount }]] = await db.query(countQuery, values);

    const dataQuery = `
      SELECT
        u.id,
        u.username,
        u.email,
        (
          SELECT COUNT(*)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = u.id AND o.order_status = 'paid'
        ) AS courseCount,

(
  SELECT COALESCE(SUM(CASE WHEN change_type = '적립' THEN amount ELSE 0 END), 0)
  FROM points
  WHERE user_id = u.id
) AS pointGiven,

(
  SELECT COALESCE(SUM(CASE WHEN change_type = '사용' THEN amount ELSE 0 END), 0)
  FROM points
  WHERE user_id = u.id
) AS pointUsed,

(
  SELECT COALESCE(SUM(CASE WHEN change_type = '적립' THEN amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN change_type = '사용' THEN amount ELSE 0 END), 0)
  FROM points
  WHERE user_id = u.id
) AS pointBalance,

(
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE user_id = u.id AND status IN ('완료', 'paid')
) AS paymentTotal,

(
  SELECT COUNT(*)
  FROM coupons
  WHERE user_id = u.id
) AS couponGiven,

(
  SELECT COUNT(*)
  FROM coupons
  WHERE user_id = u.id AND is_used = 1
) AS couponUsed,

(
  SELECT COUNT(*)
  FROM coupons
  WHERE user_id = u.id AND is_used = 0
) AS couponBalance,

(
  SELECT COUNT(*)
  FROM inquiries
  WHERE user_id = u.id
) AS inquiryCount

      FROM users u
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const dataValues = [...values, parseInt(pageSize), parseInt(offset)];
    const [summaries] = await db.query(dataQuery, dataValues);

    res.json({ success: true, summaries, totalCount });
  } catch (error) {
    console.error("❌ 사용자 요약 데이터 조회 실패:", error);
    if (error.sqlMessage) {
      console.error("📛 SQL 에러 메시지:", error.sqlMessage);
    }
    res.status(500).json({ success: false, message: "요약 데이터 조회 실패" });
  }
});

// ======================= 사용자 기본 정보 조회 API =======================
router.get("/users/:id", getUserById);
router.get("/coupon-templates", adminController.getCouponTemplates);
// ======================= 쿠폰 템플릿 등록/수정/삭제 API =======================
router.post("/coupon-templates", adminController.createCouponTemplate);
router.patch(
  "/coupon-templates/:id/activate",
  adminController.toggleCouponTemplateActive
);

router.put("/coupon-templates/:id", adminController.updateCouponTemplate);
router.delete("/coupon-templates/:id", adminController.deleteCouponTemplate);

// ======================= 사용자 역할 변경 API =======================
router.put("/users/:id/role", adminController.updateUserRole);

// ======================= 사용자 비밀번호 초기화 API =======================
router.put("/users/:id/reset-password", adminController.resetUserPassword);

// ======================= 사용자 정보 업데이트 API =======================
router.put("/users/:id", authenticateToken, adminController.updateUserInfo);

// ======================= 상품 관련 라우터 연결 =======================
router.use("/products", productRoutes); // ✅ 최하단에서 연결

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
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      sort = "created_at",
      order = "desc",
      type = "all",
      search = "",
    } = req.query;

    const showDeleted = req.query.showDeleted === "true";

    let whereClause = "";
    if (!showDeleted) {
      whereClause = "WHERE is_deleted = 0";
    }

    const offset = (page - 1) * pageSize;
    const validFields = [
      "id",
      "username",
      "email",
      "phone",
      "role",
      "created_at",
      "updated_at",
    ];
    const sortField = validFields.includes(sort) ? sort : "created_at";
    const sortOrder = order === "asc" ? "ASC" : "DESC";
    let values = [];

    if (search) {
      if (type !== "all" && validFields.includes(type)) {
        whereClause += ` AND ${type} LIKE ?`;
        values.push(`%${search}%`);
      } else {
        whereClause += ` AND (username LIKE ? OR email LIKE ? OR phone LIKE ? OR role LIKE ?)`;
        values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
    }

    const countQuery = `SELECT COUNT(*) AS totalCount FROM users ${whereClause}`;
    const [[{ totalCount }]] = await db.query(countQuery, values);

    const dataQuery = `
      SELECT id, username, email, phone, role, created_at, updated_at, is_deleted
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const dataValues = [...values, parseInt(pageSize), parseInt(offset)];
    const [users] = await db.query(dataQuery, dataValues);

    res.json({ success: true, users, totalCount });
  } catch (error) {
    console.error("❌ 사용자 목록 조회 실패:", error);
    res.status(500).json({ success: false, message: "사용자 목록 조회 실패" });
  }
});

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
  (req, res, next) => {
    // ① 요청 직전
    console.log("▶ [ADMIN-ROUTE] GET /admin/payments  query:", req.query);
    next();
  },
  async (req, res, next) => {
    try {
      await adminController.getAllPayments(req, res); // ② 실제 처리
      console.log("◀ [ADMIN-ROUTE] /admin/payments 응답 완료");
    } catch (err) {
      // ③ 에러 발생
      console.error("❌ [ADMIN-ROUTE] /admin/payments 오류:", err);
      next(err); // 에러 핸들러로 전달
    }
  }
);
// ======================= 쿠폰 템플릿 활성화/비활성화 토글 =======================

router.get("/payments/:id", adminController.getPaymentDetail); // ✅ 결제 상세 조회
router.put("/orders/:id/refund", adminController.refundOrderByAdmin);
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

// ✔️ 수료증 배경 업로드 API 추가
router.post(
  "/certificates/upload",
  authenticateToken,
  authenticateAdmin,
  certificateUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "파일이 없습니다." });
    }
    const url = `/uploads/certificates/backgrounds/${req.file.filename}`;
    res.json({ success: true, url });
  }
);

// ✔️ 수료증 발급
router.post(
  "/certificates/generate",
  authenticateToken,
  authenticateAdmin,
  generateCertificate
);

// ✔️ 수료증 활성/비활성 토글
router.patch(
  "/certificates/:id/activate",
  authenticateToken,
  authenticateAdmin,
  toggleCertificateActive
);

// ✔️ 수료증 템플릿 저장
router.put(
  "/schedules/:id/certificate-template",
  authenticateToken,
  authenticateAdmin,
  updateCertificateTemplate
);
// 📌 포인트 일괄 지급 API
router.post(
  "/batch-points",
  authenticateToken,
  authenticateAdmin,
  adminController.giveUserPointsBatch
);
// 문의 답변 등록 (관리자 전용)
router.put(
  "/users/inquiries/:id/answer",
  authenticateToken,
  authenticateAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res
        .status(400)
        .json({ success: false, message: "답변 내용이 필요합니다." });
    }

    try {
      const [result] = await db.query(
        `UPDATE inquiries
       SET answer = ?, status = '답변완료', answered_at = NOW()
       WHERE id = ?`,
        [answer, id]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "해당 문의를 찾을 수 없습니다." });
      }

      res.json({ success: true, message: "답변이 등록되었습니다." });
    } catch (err) {
      console.error("❌ 문의 답변 등록 실패:", err);
      res.status(500).json({ success: false, message: "답변 등록 실패" });
    }
  }
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
