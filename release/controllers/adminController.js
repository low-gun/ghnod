// backend/controllers/adminController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const courseModel = require("../models/course.model");
const paymentModel = require("../models/payment.model");
const pointModel = require("../models/point.model");
const pool = require("../config/db");
const { generateCertificatePdf } = require("../utils/generateCertificatePdf"); // 상단 import 추가
exports.getDashboardSummary = async (req, res) => {
  try {
    const [[userRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE is_deleted = 0"
    );
    const [[orderRow]] = await pool.query(
      `SELECT COUNT(*) AS count FROM orders 
       WHERE DATE(created_at) = CURDATE() AND order_status = 'paid'`
    );
    const [[totalRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE order_status = 'paid'
    `);

    const [[paymentRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE status IN ('paid', '완료')
    `);

    const [[pendingInquiries]] = await pool.query(
      `SELECT COUNT(*) AS count FROM inquiries WHERE status = '접수'`
    );
    const [[refundWait]] = await pool.query(
      `SELECT COUNT(*) AS count FROM orders WHERE order_status = 'refunded'`
    );
    const [[weekRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE order_status = 'paid' 
        AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
    `);

    const [[monthRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE order_status = 'paid' 
        AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    `);
    const [[todayVisitorsRow]] = await pool.query(`
      SELECT COUNT(DISTINCT ip_address) AS count
      FROM visit_logs
      WHERE DATE(visited_at) = CURDATE()
    `);

    const alertMessage = `답변 안 된 문의 ${pendingInquiries.count}건, 환불 대기 ${refundWait.count}건`;

    const [[newUsersThisMonth]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE is_deleted = 0
        AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    `);

    const [topProducts] = await pool.query(`
      SELECT s.id AS productId, s.title, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN schedules s ON oi.schedule_id = s.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status = 'paid'
      GROUP BY s.id, s.title
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const [recentOrdersFull] = await pool.query(`
      SELECT o.id AS orderId, u.username, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.order_status = 'paid'
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    const [recentInquiriesFull] = await pool.query(`
      SELECT id, title, status, created_at
      FROM inquiries
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const [recentReviewsFull] = await pool.query(`
      SELECT id, comment, created_at
      FROM reviews
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      userCount: userRow.count,
      todayOrders: orderRow.count,
      totalRevenue: totalRevenue.total,
      paymentRevenue: paymentRevenue.total, // ✅ 여기에 추가
      weekRevenue: weekRevenue.total,
      monthRevenue: monthRevenue.total,
      todayVisitors: todayVisitorsRow.count,
      newUsersThisMonth: newUsersThisMonth.count,
      topProducts,
      recentOrders: recentOrdersFull,
      recentInquiries: recentInquiriesFull,
      recentReviews: recentReviewsFull,
      alertMessage,
    });
  } catch (err) {
    console.error("❌ 관리자 대시보드 요약 조회 실패:", err);
    res.status(500).json({ success: false, message: "요약 데이터 조회 실패" });
  }
};

// ======================= 사용자 목록 조회 =======================
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, phone, role, created_at, updated_at FROM users"
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "사용자 목록 조회 실패" });
  }
};

// ======================= 사용자 요약(수강, 포인트, 결제 등) 조회 =======================
exports.getUserSummary = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        (
          SELECT COUNT(*) FROM courses WHERE user_id = u.id
        ) AS courseCount,
        (
          SELECT IFNULL(SUM(CASE WHEN change_type = '사용' THEN -amount ELSE amount END), 0)
          FROM points WHERE user_id = u.id
        ) AS pointTotal,
        (
          SELECT IFNULL(SUM(amount), 0)
          FROM payments 
          WHERE user_id = u.id AND status = '완료'
        ) AS paymentTotal,
        (
          SELECT COUNT(*) FROM user_coupons WHERE user_id = u.id
        ) AS couponCount,
        (
          SELECT COUNT(*) FROM inquiries WHERE user_id = u.id
        ) AS inquiryCount
      FROM users u
      WHERE u.is_deleted != 1 OR u.is_deleted IS NULL
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, summaries: rows, totalCount: rows.length });
  } catch (err) {
    console.error("❌ 사용자 요약 정보 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// ======================= 사용자 역할 변경 =======================
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ success: true, user: { id, role } });
  } catch (err) {
    console.error("❌ 사용자 역할 업데이트 오류:", err);
    res.status(500).json({ success: false, message: "역할 변경 실패" });
  }
};

// ======================= 사용자 비밀번호 초기화 =======================
exports.resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const newPassword = "1234";

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password = ?, password_reset_required = true WHERE id = ?",
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: "비밀번호가 [1234]로 초기화되었습니다.",
    });
  } catch (err) {
    console.error("❌ 비밀번호 초기화 오류:", err);
    res.status(500).json({ success: false, message: "비밀번호 초기화 실패" });
  }
};

// ======================= 특정 유저의 수강내역 조회 =======================
exports.getUserCourses = async (req, res) => {
  const userId = req.params.id;
  try {
    const courses = await courseModel.getCourseInfoByUser(userId);
    res.json({ success: true, courses });
  } catch (err) {
    console.error("❌ 관리자 수강내역 조회 오류:", err);
    res.status(500).json({ success: false, message: "수강내역 조회 실패" });
  }
};

// ======================= 특정 유저의 결제내역 조회 =======================
exports.getUserPayments = async (req, res) => {
  const userId = req.params.id;
  try {
    const payments = await paymentModel.getPaymentHistoryByUser(userId);
    res.json({ success: true, payments });
  } catch (err) {
    console.error("❌ 관리자 결제내역 조회 오류:", err);
    res.status(500).json({ success: false, message: "결제내역 조회 실패" });
  }
};

// ======================= 특정 유저의 포인트 조회 =======================
exports.getUserPoints = async (req, res) => {
  const userId = req.params.id;
  try {
    const points = await pointModel.getPointsByUser(userId);
    res.json({ success: true, points });
  } catch (err) {
    console.error("❌ 관리자 포인트 조회 오류:", err);
    res.status(500).json({ success: false, message: "포인트 조회 실패" });
  }
};

// ======================= 특정 유저의 쿠폰 조회 =======================
exports.getUserCoupons = async (req, res) => {
  const userId = req.params.id;
  try {
    const [coupons] = await db.query(
      `SELECT 
         c.id,
         c.user_id,
         c.is_used,
         c.expiry_date,
         c.issued_at,
         ct.name AS coupon_name,
         ct.discount_type,
         ct.discount_amount,
         ct.discount_value,
         CASE 
           WHEN ct.discount_type = 'fixed' THEN ct.discount_amount
           WHEN ct.discount_type = 'percent' THEN ct.discount_value
           ELSE NULL
         END AS discount_display
       FROM coupons c
       LEFT JOIN coupon_templates ct ON c.template_id = ct.id
       WHERE c.user_id = ?
       ORDER BY c.issued_at DESC`,
      [userId]
    );

    res.json({ success: true, coupons });
  } catch (err) {
    console.error("❌ 관리자 쿠폰 조회 오류:", err);
    res.status(500).json({ success: false, message: "쿠폰 조회 실패" });
  }
};

exports.giveUserCouponsBatch = async (req, res) => {
  const { userIds, templateId } = req.body;
  console.log("📥 [쿠폰 발급 요청]", { userIds, templateId });

  if (!userIds?.length || !templateId) {
    console.warn("❌ 잘못된 요청: 유저 또는 템플릿 ID 없음");
    return res
      .status(400)
      .json({ success: false, message: "요청이 유효하지 않습니다." });
  }

  try {
    const [[template]] = await db.query(
      `SELECT * FROM coupon_templates WHERE id = ?`,
      [templateId]
    );
    console.log("📦 [템플릿 조회 결과]", template);

    if (!template) {
      console.warn("❌ 템플릿 없음, ID:", templateId);
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }

    if (template.expired_at && new Date(template.expired_at) < new Date()) {
      console.warn("⏰ 템플릿 만료됨:", template.expired_at);
      return res
        .status(400)
        .json({ success: false, message: "만료된 쿠폰은 발급할 수 없습니다." });
    }

    const expiryDate = template.expired_at || null;
    const now = new Date();
    const values = userIds.map((userId) => [
      userId,
      templateId,
      0,
      expiryDate,
      now,
    ]);

    console.log("📝 [INSERT 예정 쿠폰 데이터]", values);

    await db.query(
      `INSERT INTO coupons (user_id, template_id, is_used, expiry_date, issued_at) VALUES ?`,
      [values]
    );

    console.log("✅ 쿠폰 발급 완료!");
    res.json({ success: true, message: "쿠폰이 일괄 지급되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 발급 중 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류로 지급 실패" });
  }
};

// ======================= 특정 유저 정보 조회 =======================
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, phone, role, department, position, company,
              marketing_agree, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("❌ 사용자 상세 조회 오류:", err);
    res.status(500).json({ success: false, message: "사용자 조회 실패" });
  }
};

// ======================= 쿠폰 템플릿 조회 (발급수, 사용수 포함) =======================
exports.getCouponTemplates = async (req, res) => {
  try {
    const [templates] = await db.query(
      `SELECT 
         ct.id,
         ct.name,
         ct.discount_type,
         ct.discount_value,
         ct.discount_amount,
         ct.valid_days,
         ct.expired_at,
         ct.is_active,
         (
           SELECT COUNT(*)
           FROM coupons c
           WHERE c.template_id = ct.id
         ) AS issued_count,
         (
           SELECT COUNT(*)
           FROM coupons c
           WHERE c.template_id = ct.id AND c.is_used = 1
         ) AS used_count
       FROM coupon_templates ct
       ORDER BY ct.created_at DESC`
    );

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 조회 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// ======================= 쿠폰 템플릿 등록 (is_active 기본 1) =======================
// 함수 위에 추가 (코드 자동 생성 함수)
const generateCouponCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ✅ 수정된 createCouponTemplate 함수
exports.createCouponTemplate = async (req, res) => {
  const { name, discount_type, discount_value, discount_amount, expired_at } =
    req.body;

  // ✅ 기본 필수값 검사
  if (!name || !discount_type) {
    return res
      .status(400)
      .json({ success: false, message: "쿠폰명, 할인타입은 필수입니다." });
  }

  // ✅ 정액 할인 유효성 검사 강화
  if (discount_type === "fixed") {
    const amount = Number(discount_amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "금액 할인 쿠폰은 0보다 큰 할인금액이 필요합니다.",
      });
    }
  }

  // ✅ 퍼센트 할인 유효성 검사
  if (discount_type === "percent") {
    const percent = Number(discount_value);
    if (!percent || percent <= 0) {
      return res.status(400).json({
        success: false,
        message: "퍼센트 할인 쿠폰은 0보다 큰 할인율(%)이 필요합니다.",
      });
    }
  }

  // ✅ 코드 자동 생성
  const code = generateCouponCode();

  try {
    await db.query(
      `INSERT INTO coupon_templates (code, name, discount_type, discount_value, discount_amount, expired_at, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        code,
        name,
        discount_type,
        discount_type === "percent" ? Number(discount_value) : null, // ⬅️ 타입별로 명확하게 분기
        discount_type === "fixed" ? Number(discount_amount) : null, // ⬅️ 0도 올바르게 저장됨
        expired_at || null,
      ]
    );

    res.json({ success: true, message: "쿠폰 템플릿이 등록되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 등록 오류:", error);
    res.status(500).json({ success: false, message: "쿠폰 템플릿 등록 실패" });
  }
};

// ======================= 쿠폰 템플릿 수정 =======================
exports.updateCouponTemplate = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    discount_type,
    discount_value,
    discount_amount,
    valid_days,
    expired_at,
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE coupon_templates
       SET name = ?, discount_type = ?, discount_value = ?, discount_amount = ?, valid_days = ?, expired_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        discount_type,
        discount_value || null,
        discount_amount || null,
        valid_days || null,
        expired_at || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "쿠폰 템플릿이 수정되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 수정 오류:", error);
    res.status(500).json({ success: false, message: "쿠폰 템플릿 수정 실패" });
  }
};
// ======================= 쿠폰 템플릿 삭제 =======================
exports.deleteCouponTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    // 먼저 발급된 쿠폰이 있는지 체크
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) AS count FROM coupons WHERE template_id = ?`,
      [id]
    );

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "발급된 쿠폰이 있어 삭제할 수 없습니다.",
      });
    }

    const [result] = await db.query(
      `DELETE FROM coupon_templates WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "쿠폰 템플릿이 삭제되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 삭제 오류:", error);
    res.status(500).json({ success: false, message: "쿠폰 템플릿 삭제 실패" });
  }
};

// ======================= 쿠폰 지급 (만료일 체크 추가) =======================
exports.giveUserCoupon = async (req, res) => {
  const userId = req.params.id;
  const { templateId } = req.body;

  try {
    const [templateRows] = await db.query(
      `SELECT * FROM coupon_templates WHERE id = ?`,
      [templateId]
    );
    if (templateRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }
    const template = templateRows[0];

    // ✅ 여기 추가: 만료 체크
    if (template.expired_at && new Date(template.expired_at) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "만료된 쿠폰은 발급할 수 없습니다." });
    }

    let expiryDate = template.expired_at;

    await db.query(
      `INSERT INTO coupons
       (user_id, template_id, is_used, expiry_date, issued_at)
       VALUES (?, ?, 0, ?, NOW())`,
      [userId, template.id, expiryDate]
    );

    res.json({ success: true, message: "쿠폰이 지급되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 지급 오류:", error);
    res.status(500).json({ success: false, message: "쿠폰 지급 실패" });
  }
};
exports.toggleCouponTemplateActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // 1 or 0

  try {
    const [result] = await db.query(
      `UPDATE coupon_templates
       SET is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [is_active, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "활성화 상태가 변경되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 활성화/비활성화 오류:", error);
    res.status(500).json({ success: false, message: "활성화/비활성화 실패" });
  }
};
// ======================= 사용자 정보 수정 (이력 기록) =======================
exports.updateUserInfo = async (req, res) => {
  console.log("✅ 인증된 사용자 정보:", req.user);
  const userId = req.params.id;
  const newValues = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "사용자 없음" });
    }

    const oldUser = rows[0];
    const fieldsToCheck = [
      "username",
      "email",
      "phone",
      "role",
      "department",
      "position",
      "company",
      "marketing_agree",
    ];

    const updates = {};
    const historyLogs = [];

    // 요청 origin
    const origin = req.originalUrl.startsWith("/api/admin")
      ? "admin"
      : req.originalUrl.startsWith("/api/mypage")
        ? "mypage"
        : "api";

    for (let field of fieldsToCheck) {
      const oldValue = oldUser[field] ?? "";
      const newValue = newValues[field] ?? "";
      if (String(oldValue) !== String(newValue)) {
        updates[field] = newValue;
        historyLogs.push({
          user_id: userId,
          field,
          old_value: String(oldValue),
          new_value: String(newValue),
          modified_by: req.user?.id || null,
          modifier_role: req.user?.role || null,
          origin,
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ success: false, message: "변경된 항목이 없습니다." });
    }

    // 실제 DB 업데이트
    const updateFields = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const updateValues = Object.values(updates);

    await db.query(
      `UPDATE users SET ${updateFields}, updated_at = NOW() WHERE id = ?`,
      [...updateValues, userId]
    );

    // user_history 테이블에 기록
    for (const log of historyLogs) {
      await db.query(
        `INSERT INTO user_history
         (user_id, field, old_value, new_value, changed_at,
          modified_by, modifier_role, origin)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`,
        [
          log.user_id,
          log.field,
          log.old_value,
          log.new_value,
          log.modified_by,
          log.modifier_role,
          log.origin,
        ]
      );
    }

    res.json({ success: true, message: "수정이 완료되었습니다." });
  } catch (err) {
    console.error("❌ 사용자 정보 수정 오류:", err);
    res.status(500).json({ success: false, message: "사용자 정보 수정 실패" });
  }
};

// 📌 관리자 전체 결제 내역 조회 – payments 기준 + orders LEFT JOIN
exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id AS payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.status,
        p.created_at,
        p.updated_at,
        u.id AS user_id,
        u.username,
        u.email,
        o.id AS order_id,
        o.total_amount,
        COALESCE(o.used_point, 0) AS used_point,        -- ✅ 반드시 0 기본값
        COALESCE(ct.discount_amount, 0) AS coupon_discount, -- ✅ 쿠폰할인 연결
        (
          SELECT SUM(quantity)
          FROM order_items
          WHERE order_id = o.id
        ) AS total_quantity
      FROM payments p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN orders o ON o.payment_id = p.id
      LEFT JOIN coupons c ON o.coupon_id = c.id
      LEFT JOIN coupon_templates ct ON c.template_id = ct.id
      ORDER BY p.created_at DESC
    `);

    return res.json({ success: true, payments: rows });
  } catch (err) {
    console.error("❌ 관리자 결제내역 조회 실패:", err);
    res.status(500).json({ success: false, message: "결제내역 조회 실패" });
  }
};

// 📌 관리자 환불 처리
exports.refundOrderByAdmin = async (req, res) => {
  const orderId = req.params.id;

  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. orders 상태 변경
    await conn.query(
      `UPDATE orders 
       SET order_status = 'refunded', updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    // 2. payments 상태 변경
    await conn.query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = NOW()
       WHERE id = (
         SELECT payment_id FROM orders WHERE id = ?
       )`,
      [orderId]
    );

    await conn.commit();
    res.json({ success: true, message: "✅ 관리자 환불 처리 완료" });
  } catch (err) {
    console.error("❌ 관리자 환불 처리 실패:", err);
    res.status(500).json({ success: false, message: "관리자 환불 실패" });
  }
};
// 📌 관리자 결제 단건 조회 (payment_id 기준)
exports.getPaymentDetail = async (req, res) => {
  const paymentId = req.params.id;

  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id              AS payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.status,
        p.created_at,
        p.updated_at,
        u.username,
        u.email,
        o.id              AS order_id,
        o.total_amount,
        o.used_point,
(
  SELECT 
    CASE 
      WHEN ct.discount_type = 'fixed' THEN ct.discount_amount
      WHEN ct.discount_type = 'percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
      ELSE 0
    END
  FROM coupons c
  JOIN coupon_templates ct ON c.template_id = ct.id
  WHERE c.id = o.coupon_id
  LIMIT 1
) AS coupon_discount

        (
          SELECT SUM(quantity)
          FROM order_items
          WHERE order_id = o.id
        ) AS total_quantity
      FROM payments p
      JOIN users u     ON u.id = p.user_id
      LEFT JOIN orders o ON o.payment_id = p.id
      WHERE p.id = ?
      LIMIT 1
    `,
      [paymentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 결제 내역을 찾을 수 없습니다.",
      });
    }

    res.json({ success: true, payment: rows[0] });
  } catch (err) {
    console.error("❌ 관리자 결제 상세 조회 실패:", err);
    res.status(500).json({ success: false, message: "결제 상세 조회 실패" });
  }
};
// ======================= 수료증 발급 (일괄 + PDF 생성) =======================
exports.generateCertificate = async (req, res) => {
  const { schedule_id, release_date } = req.body;

  if (!schedule_id) {
    return res
      .status(400)
      .json({ success: false, message: "일정 ID가 필요합니다." });
  }

  try {
    // (1) 스케줄 정보 조회
    const [scheduleRows] = await db.query(
      `SELECT id, title, certificate_template FROM schedules WHERE id = ?`,
      [schedule_id]
    );
    if (scheduleRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });
    }
    const schedule = scheduleRows[0];

    if (!schedule.certificate_template) {
      return res.status(400).json({
        success: false,
        message: "수료증 템플릿이 등록되어 있지 않습니다.",
      });
    }

    // (2) 수강 완료자 조회
    const [students] = await db.query(
      `SELECT DISTINCT u.id AS user_id, u.username
       FROM users u
       JOIN orders o ON u.id = o.user_id
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.schedule_id = ? AND o.order_status = 'paid'`,
      [schedule_id]
    );

    if (students.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "수강 완료한 수강자가 없습니다." });
    }

    const formattedReleaseDate = release_date
      ? new Date(release_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    for (const student of students) {
      // (3) 템플릿 치환
      let filledHtml = schedule.certificate_template;
      filledHtml = filledHtml.replace(/{{username}}/g, student.username);
      filledHtml = filledHtml.replace(/{{schedule_title}}/g, schedule.title);
      filledHtml = filledHtml.replace(
        /{{release_date}}/g,
        formattedReleaseDate
      );

      // (4) 파일 이름 & URL
      const filename = `certificate_${student.user_id}_${schedule.id}.pdf`;
      const certificateUrl = `/uploads/certificates/${filename}`;

      // (5) PDF 생성
      await generateCertificatePdf({ html: filledHtml, filename });

      // (6) DB 저장
      await db.query(
        `INSERT IGNORE INTO certificates
         (user_id, schedule_id, schedule_title, username, release_date, certificate_url, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
        [
          student.user_id,
          schedule.id,
          schedule.title,
          student.username,
          formattedReleaseDate,
          certificateUrl,
        ]
      );
    }

    res.json({ success: true, message: "수료증 발급 완료" });
  } catch (error) {
    console.error("❌ 수료증 발급 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "서버 오류로 수료증 발급 실패" });
  }
};

// ======================= 수료증 활성/비활성 상태 변경 =======================
exports.toggleCertificateActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // 1 또는 0

  try {
    const [result] = await db.query(
      `UPDATE certificates
       SET is_active = ?
       WHERE id = ?`,
      [is_active, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "수료증을 찾을 수 없습니다." });
    }

    res.json({
      success: true,
      message: "수료증 활성화 상태가 변경되었습니다.",
    });
  } catch (error) {
    console.error("❌ 수료증 활성화/비활성화 실패:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};
// ======================= 수료증 템플릿 저장 =======================
exports.updateCertificateTemplate = async (req, res) => {
  const { id } = req.params;
  const { certificate_template } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE schedules
       SET certificate_template = ?, updated_at = NOW()
       WHERE id = ?`,
      [certificate_template, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "수료증 템플릿이 저장되었습니다." });
  } catch (error) {
    console.error("❌ 수료증 템플릿 저장 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "수료증 템플릿 저장 실패" });
  }
};
// ======================= 관리자 포인트 일괄 지급 =======================
exports.giveUserPointsBatch = async (req, res) => {
  const { userIds, amount, description } = req.body;

  if (!userIds?.length || !amount || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: "유효한 유저 목록과 금액이 필요합니다.",
    });
  }

  try {
    const now = new Date();
    const values = userIds.map((userId) => [
      userId,
      "적립",
      Number(amount),
      description || "관리자 지급",
      now,
    ]);

    await db.query(
      `INSERT INTO points (user_id, change_type, amount, description, created_at)
       VALUES ?`,
      [values]
    );

    res.json({ success: true, message: "포인트가 일괄 지급되었습니다." });
  } catch (error) {
    console.error("❌ 포인트 일괄 지급 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류로 지급 실패" });
  }
};
