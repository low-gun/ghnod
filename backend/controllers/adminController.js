// backend/controllers/adminController.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const courseModel = require("../models/course.model");
const paymentModel = require("../models/payment.model");
const pointModel = require("../models/point.model");

/** ======================= 공통 필터 빌더 ======================= */
/** ======================= 공통 필터 빌더 ======================= */
function buildUserFilters(query) {
  let {
    type = "all",
    search = "",
    field,
    keyword,
    start_date,
    end_date,
  } = query;

  const includeDeleted = String(query.showDeleted) === "true";
  const whereConditions = [];
  if (!includeDeleted) {
    // 기본값: 삭제되지 않은 사용자만
    whereConditions.push("(u.is_deleted = 0 OR u.is_deleted IS NULL)");
  }
  const values = [];

  // field/keyword 호환성 처리
  if (!search && keyword) {
    search = String(keyword);
  }
  if ((!type || type === "all") && field) {
    type = String(field);
  }

  // ✅ 전체 검색(all) 지원: username / email / phone
  if (search && (type === "all" || !type)) {
    whereConditions.push(
      `(
        REPLACE(LOWER(u.username), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')
        OR u.email LIKE ?
        OR u.phone LIKE ?
      )`
    );
    values.push(
      `%${String(search).toLowerCase()}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  // 기존 단일 필드 검색
  if ((search || start_date || end_date) && type !== "all") {
    if (type === "username") {
      whereConditions.push(`u.username LIKE ?`);
      values.push(`%${search}%`);
    } else if (type === "email") {
      whereConditions.push(`u.email LIKE ?`);
      values.push(`%${search}%`);
    } else if (type === "phone") {
      whereConditions.push(`u.phone LIKE ?`);
      values.push(`%${search}%`);
    } else if (type === "role") {
      whereConditions.push(`u.role = ?`);
      values.push(search);
    } else if (type === "created_at") {
      // 가입일 필터 (start_date, end_date 또는 문자열 검색)
      let startDate =
        start_date && String(start_date).slice(0, 10).replace(/\//g, "-");
      let endDate =
        end_date && String(end_date).slice(0, 10).replace(/\//g, "-");

      if (!startDate && !endDate && search) {
        if (String(search).includes("|")) {
          const [searchStart, searchEnd] = String(search).split("|");
          startDate =
            searchStart && searchStart.slice(0, 10).replace(/\//g, "-");
          endDate = searchEnd && searchEnd.slice(0, 10).replace(/\//g, "-");
        } else {
          startDate = String(search).slice(0, 10).replace(/\//g, "-");
        }
      }

      if (
        startDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
        endDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ) {
        whereConditions.push(`DATE(u.created_at) BETWEEN ? AND ?`);
        values.push(startDate, endDate);
      } else if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        whereConditions.push(`DATE(u.created_at) >= ?`);
        values.push(startDate);
      } else if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        whereConditions.push(`DATE(u.created_at) <= ?`);
        values.push(endDate);
      } else if (search) {
        whereConditions.push(`DATE_FORMAT(u.created_at, '%Y-%m-%d') LIKE ?`);
        values.push(`%${String(search).replace("|", "%")}%`);
      }
    }
  }

  return { where: whereConditions, vals: values, type, search };
}

/** ======================= 대시보드 요약 ======================= */
exports.getDashboardSummary = async (req, res) => {
  try {
    const [[userRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE is_deleted = 0"
    );

    const [[orderRow]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM orders 
       WHERE DATE(created_at) = CURDATE() AND order_status = 'paid'`
    );

    const [[totalRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE order_status = 'paid'
    `);

    // 상태 공백/대소문자 혼용 대응
    const [[paymentRevenue]] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE TRIM(LOWER(status)) IN ('paid', '완료')
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
      paymentRevenue: paymentRevenue.total,
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

/** ======================= 사용자 목록 조회 ======================= */
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      sort = "created_at",
      order = "desc",
    } = req.query;
    const { where, vals } = buildUserFilters(req.query);

    const limit = Math.max(parseInt(pageSize, 10) || 20, 1);
    const offset = Math.max((parseInt(page, 10) - 1) * limit, 0);
    const sortField = [
      "id",
      "username",
      "email",
      "phone",
      "role",
      "created_at",
      "updated_at",
    ].includes(sort)
      ? sort
      : "created_at";
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const sql = `
  SELECT 
    u.id, u.username, u.email, u.phone, u.role, u.created_at, u.updated_at, u.is_deleted
  FROM users u
  ${where.length ? "WHERE " + where.join(" AND ") : ""}
  ORDER BY u.${sortField} ${sortOrder}
  LIMIT ? OFFSET ?
`;

    const [users] = await pool.query(sql, [...vals, limit, offset]);

    const [[{ totalCount }]] = await pool.query(
      `SELECT COUNT(*) AS totalCount FROM users u ${where.length ? "WHERE " + where.join(" AND ") : ""}`,
      vals
    );

    res.json({ success: true, users, totalCount });
  } catch (err) {
    console.error("❌ getUsers 오류:", err);
    res.status(500).json({ success: false, message: "사용자 목록 조회 실패" });
  }
};

/** ======================= 사용자 요약(수강, 포인트, 결제 등) 조회 ======================= */
/** ======================= 사용자 요약(수강, 포인트, 결제 등) 조회 ======================= */
exports.getUserSummary = async (req, res) => {
  console.log("🔎 [Backend.getUserSummary] req.query =", req.query);

  try {
    const {
      page = 1,
      pageSize = 20,
      sort = "created_at",
      order = "desc",
      type = "all",
      search = "",
    } = req.query;

    const { where, vals } = buildUserFilters(req.query);

    const limit = Math.max(parseInt(page, 10) ? parseInt(pageSize, 10) : 20, 1);
    const offset = Math.max((parseInt(page, 10) - 1) * limit, 0);
    const sortOrder = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

    // ORDER BY 허용 컬럼 (기본 + 요약 alias)
    const ORDER_COL_MAP = {
      id: "u.id",
      username: "u.username",
      email: "u.email",
      created_at: "u.created_at",
      updated_at: "u.updated_at",

      // 요약 alias
      courseCount: "courseCount",
      paymentTotal: "paymentTotal",
      pointBalance: "pointBalance",
      couponBalance: "couponBalance",
      inquiryCount: "inquiryCount",
      inquiryStatus: "inquiryStatus",
    };
    const sortCol = ORDER_COL_MAP[sort] || "u.created_at";

    // 🔸 공통 SELECT 블록 (alias 포함)
    const baseSelect = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_deleted,
        (
          SELECT COUNT(DISTINCT oi.schedule_id)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = u.id AND o.order_status = 'paid'
        ) AS courseCount,
        (
          SELECT IFNULL(SUM(CASE WHEN change_type = '사용' THEN -amount ELSE amount END), 0)
          FROM points WHERE user_id = u.id
        ) AS pointBalance,
        (
          SELECT IFNULL(SUM(amount), 0)
          FROM payments 
          WHERE user_id = u.id AND TRIM(LOWER(status)) IN ('paid','완료')
        ) AS paymentTotal,
        (SELECT COUNT(*) FROM coupons   WHERE user_id = u.id AND is_used = 0) AS couponBalance,
        (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id)                AS inquiryCount,
        (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id AND status = '접수')  AS unansweredCount,
        (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id AND status <> '접수') AS answeredCount,
        CASE
          WHEN (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id AND status = '접수') > 0 THEN 'unanswered'
          WHEN (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id AND status <> '접수') > 0 THEN 'answered'
          ELSE 'none'
        END AS inquiryStatus
      FROM users u
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      GROUP BY u.id
    `;

    // 🔸 HAVING 빌드 (alias 기준)
    const having = [];
    const havingVals = [];

    if (type !== "all" && String(search).length > 0) {
      if (type === "paymentTotal" || type === "pointBalance") {
        const [op, rawVal] = String(search).split("|");
        const val = Number(rawVal) || 0;
        if (op === "gte") {
          having.push(`${type} >= ?`);
          havingVals.push(val);
        } else if (op === "lte") {
          having.push(`${type} <= ?`);
          havingVals.push(val);
        }
      } else if (type === "couponCount" || type === "couponBalance") {
        // 둘 다 couponBalance alias 사용
        having.push(`couponBalance = ?`);
        havingVals.push(Number(search) || 0);
      } else if (type === "inquiryStatus") {
        const s = String(search);
        if (s === "unanswered") {
          having.push(`unansweredCount > 0`);
        } else if (s === "answered") {
          having.push(`unansweredCount = 0`, `answeredCount > 0`);
        } else if (s === "none") {
          having.push(`inquiryCount = 0`);
        }
      }
    }

    // 🔸 목록 쿼리
    const listSql = `
      ${baseSelect}
      ${having.length ? "HAVING " + having.join(" AND ") : ""}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    console.log("🧮 [Backend.getUserSummary] LIST SQL =", listSql);
    console.log("🧮 [Backend.getUserSummary] LIST vals =", [
      ...vals,
      ...havingVals,
      limit,
      offset,
    ]);

    const [rows] = await pool.query(listSql, [
      ...vals,
      ...havingVals,
      limit,
      offset,
    ]);

    // 🔸 카운트 쿼리 (동일 SELECT + 동일 HAVING 을 서브쿼리로 감싼다)
    const countSql = `
      SELECT COUNT(*) AS totalCount
      FROM (
        ${baseSelect}
        ${having.length ? "HAVING " + having.join(" AND ") : ""}
      ) t
    `;
    console.log("🧮 [Backend.getUserSummary] COUNT SQL =", countSql);
    console.log("🧮 [Backend.getUserSummary] COUNT vals =", [
      ...vals,
      ...havingVals,
    ]);

    const [[{ totalCount }]] = await pool.query(countSql, [
      ...vals,
      ...havingVals,
    ]);

    console.log("✅ [Backend.getUserSummary] 응답 크기", {
      rows: rows.length,
      totalCount,
    });

    res.json({ success: true, summaries: rows, totalCount });
  } catch (err) {
    console.error("❌ [Backend.getUserSummary] 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/** ======================= 사용자 역할 변경 ======================= */
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ success: true, user: { id, role } });
  } catch (err) {
    console.error("❌ 사용자 역할 업데이트 오류:", err);
    res.status(500).json({ success: false, message: "역할 변경 실패" });
  }
};

/** ======================= 사용자 비밀번호 초기화 ======================= */
exports.resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const newPassword = "1234";

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
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

/** ======================= 특정 유저의 수강내역 조회 ======================= */
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

/** ======================= 특정 유저의 결제내역 조회 ======================= */
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

/** ======================= 특정 유저의 포인트 조회 ======================= */
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

/** ======================= 특정 유저의 쿠폰 조회 ======================= */
exports.getUserCoupons = async (req, res) => {
  const userId = req.params.id;
  try {
    const [coupons] = await pool.query(
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
  if (!userIds?.length || !templateId) {
    return res
      .status(400)
      .json({ success: false, message: "요청이 유효하지 않습니다." });
  }

  try {
    const [[template]] = await pool.query(
      `SELECT * FROM coupon_templates WHERE id = ?`,
      [templateId]
    );
    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }

    if (template.expired_at && new Date(template.expired_at) < new Date()) {
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

    await pool.query(
      `INSERT INTO coupons (user_id, template_id, is_used, expiry_date, issued_at) VALUES ?`,
      [values]
    );

    res.json({ success: true, message: "쿠폰이 일괄 지급되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 발급 중 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류로 지급 실패" });
  }
};

/** ======================= 특정 유저 정보 조회 ======================= */
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows] = await pool.query(
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

/** ======================= 쿠폰 템플릿 조회 ======================= */
exports.getCouponTemplates = async (req, res) => {
  try {
    const [templates] = await pool.query(
      `SELECT 
         ct.id,
         ct.name,
         ct.discount_type,
         ct.discount_value,
         ct.discount_amount,
         ct.valid_days,
         ct.expired_at,
         ct.is_active,
         (SELECT COUNT(*) FROM coupons c WHERE c.template_id = ct.id) AS issued_count,
         (SELECT COUNT(*) FROM coupons c WHERE c.template_id = ct.id AND c.is_used = 1) AS used_count
       FROM coupon_templates ct
       ORDER BY ct.created_at DESC`
    );

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 조회 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/** ======================= 쿠폰 템플릿 등록 ======================= */
const generateCouponCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.createCouponTemplate = async (req, res) => {
  const { name, discount_type, discount_value, discount_amount, expired_at } =
    req.body;

  if (!name || !discount_type) {
    return res
      .status(400)
      .json({ success: false, message: "쿠폰명, 할인타입은 필수입니다." });
  }

  if (discount_type === "fixed") {
    const amount = Number(discount_amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "금액 할인 쿠폰은 0보다 큰 할인금액이 필요합니다.",
      });
    }
  }

  if (discount_type === "percent") {
    const percent = Number(discount_value);
    if (!percent || percent <= 0) {
      return res.status(400).json({
        success: false,
        message: "퍼센트 할인 쿠폰은 0보다 큰 할인율(%)이 필요합니다.",
      });
    }
  }

  const code = generateCouponCode();

  try {
    await pool.query(
      `INSERT INTO coupon_templates (code, name, discount_type, discount_value, discount_amount, expired_at, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        code,
        name,
        discount_type,
        discount_type === "percent" ? Number(discount_value) : null,
        discount_type === "fixed" ? Number(discount_amount) : null,
        expired_at || null,
      ]
    );

    res.json({ success: true, message: "쿠폰 템플릿이 등록되었습니다." });
  } catch (error) {
    console.error("❌ 쿠폰 템플릿 등록 오류:", error);
    res.status(500).json({ success: false, message: "쿠폰 템플릿 등록 실패" });
  }
};

/** ======================= 쿠폰 템플릿 수정/삭제/토글 ======================= */
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
    const [result] = await pool.query(
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

exports.deleteCouponTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM coupons WHERE template_id = ?`,
      [id]
    );

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "발급된 쿠폰이 있어 삭제할 수 없습니다.",
      });
    }

    const [result] = await pool.query(
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

exports.giveUserCoupon = async (req, res) => {
  const userId = req.params.id;
  const { templateId } = req.body;

  try {
    const [templateRows] = await pool.query(
      `SELECT * FROM coupon_templates WHERE id = ?`,
      [templateId]
    );
    if (templateRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "쿠폰 템플릿을 찾을 수 없습니다." });
    }
    const template = templateRows[0];

    if (template.expired_at && new Date(template.expired_at) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "만료된 쿠폰은 발급할 수 없습니다." });
    }

    const expiryDate = template.expired_at || null;

    await pool.query(
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
  const { is_active } = req.body;

  try {
    const [result] = await pool.query(
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

/** ======================= 사용자 정보 수정(이력 기록) ======================= */
exports.updateUserInfo = async (req, res) => {
  const userId = req.params.id;
  const newValues = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
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

    const updateFields = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const updateValues = Object.values(updates);

    await pool.query(
      `UPDATE users SET ${updateFields}, updated_at = NOW() WHERE id = ?`,
      [...updateValues, userId]
    );

    for (const log of historyLogs) {
      await pool.query(
        `INSERT INTO user_history
         (user_id, field, old_value, new_value, changed_at, modified_by, modifier_role, origin)
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

/** ======================= 관리자 전체 결제 내역 조회 ======================= */
exports.getAllPayments = async (req, res) => {
  try {
    // 1) 파라미터 파싱 + 호환 처리(field/keyword, start_date/end_date)
    let {
      page = 1,
      pageSize = 20,
      sort = "created_at",
      order = "desc",
      type = "all",
      search = "",
      field,
      keyword,
      start_date,
      end_date,
    } = req.query;

    // 프론트가 field/keyword로 보냈다면 우선 사용
    if (!search && keyword) search = String(keyword);
    if ((!type || type === "all") && field) type = String(field);

    const limit = Math.max(parseInt(pageSize, 10) || 20, 1);
    const offset = Math.max((parseInt(page, 10) - 1) * limit, 0);
    const sortOrder = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

    const SORT_MAP = {
      payment_id: "p.id",
      id: "p.id",
      username: "u.username",
      email: "u.email",
      amount: "p.amount",
      // SORT_MAP 일부
      total_quantity: `(
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o2 ON oi.order_id = o2.id
  WHERE o2.payment_id = p.id
)`,
      payment_method: "p.payment_method",
      created_at: "p.created_at",
      status: "p.status",
      discount_total: `(
        COALESCE(o.used_point,0) +
        COALESCE(
          CASE
            WHEN ct.discount_type='fixed'   THEN ct.discount_amount
            WHEN ct.discount_type='percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
            ELSE 0
          END
        ,0)
      )`,
    };
    const sortCol = SORT_MAP[sort] || "p.created_at";

    const SEARCH_MAP = {
      payment_id: "p.id",
      username: "u.username",
      email: "u.email",
      total_quantity: `(
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o2 ON oi.order_id = o2.id
        WHERE o2.payment_id = p.id
      )`,
      amount: "p.amount",
      discount_total: `(
        COALESCE(o.used_point,0) +
        COALESCE(
          CASE
            WHEN ct.discount_type='fixed'   THEN ct.discount_amount
            WHEN ct.discount_type='percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
            ELSE 0
          END
        ,0)
      )`,
      payment_method: "p.payment_method",
      created_at: "p.created_at",
      status: "p.status",
      all: null,
    };

    const where = [];
    const vals = [];

    /* ✅ 1) 검색어가 없어도, type=created_at 이고 start_date/end_date가 있으면 날짜 필터 적용 */
    if ((!search || String(search).trim() === "") && type === "created_at") {
      const col = SEARCH_MAP["created_at"] || "p.created_at"; // 안전 기본값
      const colDate = `DATE(${col})`;

      const s =
        start_date && String(start_date).slice(0, 10).replace(/\//g, "-");
      const e = end_date && String(end_date).slice(0, 10).replace(/\//g, "-");

      if (
        s &&
        /^\d{4}-\d{2}-\d{2}$/.test(s) &&
        e &&
        /^\d{4}-\d{2}-\d{2}$/.test(e)
      ) {
        where.push(`${colDate} BETWEEN ? AND ?`);
        vals.push(s, e);
      } else if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
        where.push(`${colDate} >= ?`);
        vals.push(s);
      } else if (e && /^\d{4}-\d{2}-\d{2}$/.test(e)) {
        where.push(`${colDate} <= ?`);
        vals.push(e);
      }
    }

    /* 기존 로직 유지: 검색어가 있을 때의 다양한 필터 */
    if (search) {
      const col = SEARCH_MAP[type] ?? null;

      if (type !== "all" && col) {
        if (type === "created_at") {
          // (기존 블록 동일)
          let s = start_date,
            e = end_date;
          if (!s || !e) {
            const raw = String(search).trim();
            if (raw.includes("|")) {
              const [sr, er] = raw.split("|");
              s = s || (sr || "").slice(0, 10).replace(/\//g, "-");
              e = e || (er || "").slice(0, 10).replace(/\//g, "-");
            } else {
              s = s || raw.slice(0, 10).replace(/\//g, "-");
            }
          }
          const colDate = `DATE(${col})`;
          if (
            s &&
            /^\d{4}-\d{2}-\d{2}$/.test(s) &&
            e &&
            /^\d{4}-\d{2}-\d{2}$/.test(e)
          ) {
            where.push(`${colDate} BETWEEN ? AND ?`);
            vals.push(s, e);
          } else if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
            where.push(`${colDate} >= ?`);
            vals.push(s);
          } else if (e && /^\d{4}-\d{2}-\d{2}$/.test(e)) {
            where.push(`${colDate} <= ?`);
            vals.push(e);
          } else {
            where.push(`DATE_FORMAT(${col}, '%Y-%m-%d') LIKE ?`);
            vals.push(`%${String(search).replace("|", "%")}%`);
          }
        } else if (type === "discount_total") {
          // ✅ 할인 적용여부 전용 처리 (서브쿼리 사용)
          const couponSubquery = `COALESCE((
            SELECT
              CASE
                WHEN ct.discount_type='fixed'   THEN ct.discount_amount
                WHEN ct.discount_type='percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
                ELSE 0
              END
            FROM coupons c
            JOIN coupon_templates ct ON c.template_id = ct.id
            WHERE c.id = o.coupon_id
            LIMIT 1
          ),0)`;

          if (search === "applied") {
            where.push(`(COALESCE(o.used_point,0) + ${couponSubquery}) > 0`);
          } else if (search === "none") {
            where.push(`(COALESCE(o.used_point,0) + ${couponSubquery}) = 0`);
          } else if (/^\d+$/.test(search)) {
            // 숫자 직접 입력 검색
            where.push(`(COALESCE(o.used_point,0) + ${couponSubquery}) = ?`);
            vals.push(parseInt(search, 10));
          } else if (search) {
            where.push(
              `CAST((COALESCE(o.used_point,0) + ${couponSubquery}) AS CHAR) LIKE ?`
            );
            vals.push(`%${search}%`);
          }
        } else if (
          type === "payment_id" ||
          type === "amount" ||
          type === "total_quantity"
        ) {
          if (/^\d+$/.test(search)) {
            where.push(`${col} = ?`);
            vals.push(parseInt(search, 10));
          } else {
            where.push(`CAST(${col} AS CHAR) LIKE ?`);
            vals.push(`%${search}%`);
          }
        } else if (type === "payment_method") {
          const s = String(search).toLowerCase();
          if (s === "card") {
            where.push(`(LOWER(${col}) LIKE '%card%' OR ${col} LIKE '%카드%')`);
          } else if (s === "transfer") {
            where.push(
              `(LOWER(${col}) LIKE '%transfer%' OR ${col} LIKE '%계좌%' OR ${col} LIKE '%이체%')`
            );
          } else if (s === "vbank") {
            where.push(
              `(LOWER(${col}) LIKE '%vbank%' OR ${col} LIKE '%가상%')`
            );
          } else {
            where.push(`(${col} LIKE ? OR LOWER(${col}) LIKE LOWER(?))`);
            vals.push(`%${search}%`, `%${search}%`);
          }
        } else if (type === "status") {
          where.push(
            `TRIM(LOWER(REPLACE(${col}, ' ', ''))) LIKE TRIM(LOWER(REPLACE(?, ' ', '')))`
          );
          vals.push(`%${search}%`);
        } else if (type === "username") {
          where.push(
            `REPLACE(LOWER(u.username), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`
          );
          vals.push(`%${String(search).toLowerCase()}%`);
        } else {
          where.push(`${col} LIKE ?`);
          vals.push(`%${search}%`);
        }
      } else {
        where.push(`(
          REPLACE(LOWER(u.username), ' ', '') LIKE REPLACE(LOWER(?), ' ', '') OR
          u.email LIKE ? OR
          p.payment_method LIKE ? OR
          p.status LIKE ? OR
          CAST(p.id AS CHAR) LIKE ?
        )`);
        vals.push(
          `%${String(search).toLowerCase()}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`
        );
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ 디버그: 최종 필터/정렬/페이징 상태를 로그로 확인
    console.log("🔶[getAllPayments] filter:", {
      type,
      search,
      field,
      keyword,
      start_date,
      end_date,
      whereSql,
      vals,
      sortCol,
      sortOrder,
      limit,
      offset,
    });

    const listSql = `
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
        COALESCE(o.used_point, 0) AS used_point,
        COALESCE((
          SELECT
            CASE
              WHEN ct.discount_type='fixed'   THEN ct.discount_amount
              WHEN ct.discount_type='percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
              ELSE 0
            END
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = o.coupon_id
          LIMIT 1
        ),0) AS coupon_discount,
                COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o2 ON oi.order_id = o2.id
  WHERE o2.payment_id = p.id
), 0) AS total_quantity
      FROM payments p
      JOIN users u       ON u.id = p.user_id
      LEFT JOIN orders o ON o.payment_id = p.id
      ${whereSql}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(listSql, [...vals, limit, offset]);

    const countSql = `
      SELECT COUNT(*) AS totalCount
      FROM payments p
      JOIN users u       ON u.id = p.user_id
      LEFT JOIN orders o ON o.payment_id = p.id
      ${whereSql}
    `;
    const [[{ totalCount }]] = await pool.query(countSql, vals);

    const sumSql = `
      SELECT COALESCE(SUM(p.amount), 0) AS totalAmount
      FROM payments p
      JOIN users u       ON u.id = p.user_id
      LEFT JOIN orders o ON o.payment_id = p.id
      ${whereSql}
      ${whereSql ? "AND" : "WHERE"} TRIM(LOWER(REPLACE(p.status, ' ', ''))) IN ('paid','완료')
    `;
    const [[{ totalAmount }]] = await pool.query(sumSql, vals);

    return res.json({
      success: true,
      payments: rows,
      totalCount: totalCount || 0,
      totalAmount: totalAmount || 0,
    });
  } catch (err) {
    console.error("❌ 관리자 결제내역 조회 실패:", err);
    return res
      .status(500)
      .json({ success: false, message: "결제내역 조회 실패" });
  }
};

/** ======================= 관리자 환불 처리 ======================= */
exports.refundOrderByAdmin = async (req, res) => {
  const orderId = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `UPDATE orders 
       SET order_status = 'refunded', updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    await conn.query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = NOW()
       WHERE id = (SELECT payment_id FROM orders WHERE id = ?)`,
      [orderId]
    );

    await conn.commit();
    res.json({ success: true, message: "✅ 관리자 환불 처리 완료" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ 관리자 환불 처리 실패:", err);
    res.status(500).json({ success: false, message: "관리자 환불 실패" });
  } finally {
    if (conn) conn.release();
  }
};

/** ======================= 관리자 결제 단건 조회 ======================= */
exports.getPaymentDetail = async (req, res) => {
  const paymentId = req.params.id;

  try {
    const [rows] = await pool.query(
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
              WHEN ct.discount_type='fixed'   THEN ct.discount_amount
              WHEN ct.discount_type='percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
              ELSE 0
            END
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = o.coupon_id
          LIMIT 1
        ) AS coupon_discount,
        COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o2 ON oi.order_id = o2.id
  WHERE o2.payment_id = p.id
), 0) AS total_quantity
      FROM payments p
      JOIN users u  ON u.id = p.user_id
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

/** ======================= 관리자 포인트 일괄 지급 ======================= */
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

    await pool.query(
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

/** ======================= 사용자 요약(메트릭) by-ids ======================= */
// adminController.js (교체)
exports.getUserSummaryByIds = async (req, res) => {
  try {
    const raw = (req.query.ids || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ids = raw
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "ids 파라미터가 필요합니다. 예: ?ids=1,2,3",
      });
    }
    if (ids.length > 200) {
      return res.status(400).json({
        success: false,
        message: "요청 가능한 사용자 수(최대 200명)를 초과했습니다.",
      });
    }

    const placeholders = ids.map(() => "?").join(",");
    const params = [...ids];

    const [rows] = await pool.query(
      `
      SELECT
        u.id AS id,
        u.username,
        u.email,
        (
          SELECT COUNT(DISTINCT oi.schedule_id)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = u.id
            AND o.order_status = 'paid'
        ) AS course_count,
        (
          SELECT IFNULL(SUM(amount), 0)
          FROM payments
          WHERE user_id = u.id
            AND TRIM(LOWER(status)) IN ('paid','완료')
        ) AS payment_total,
        (
          SELECT IFNULL(SUM(CASE WHEN change_type = '적립' THEN amount ELSE 0 END), 0)
          FROM points
          WHERE user_id = u.id
        ) AS point_given,
        (
          SELECT IFNULL(SUM(CASE WHEN change_type = '사용' THEN amount ELSE 0 END), 0)
          FROM points
          WHERE user_id = u.id
        ) AS point_used,
        (
          SELECT IFNULL(SUM(CASE
                              WHEN change_type = '적립' THEN amount
                              WHEN change_type = '사용' THEN -amount
                              ELSE 0 END), 0)
          FROM points
          WHERE user_id = u.id
        ) AS point_balance,
        (SELECT COUNT(*) FROM coupons   WHERE user_id = u.id AND is_used = 0) AS coupon_balance,
        (SELECT COUNT(*) FROM inquiries WHERE user_id = u.id)                AS inquiry_count
      FROM users u
      WHERE u.id IN (${placeholders})
      `,
      params
    );

    const summaries = rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      courseCount: r.course_count,
      paymentTotal: r.payment_total,
      pointGiven: r.point_given,
      pointUsed: r.point_used,
      pointBalance: r.point_balance,
      couponBalance: r.coupon_balance,
      inquiryCount: r.inquiry_count,
    }));

    return res.json({ success: true, summaries });
  } catch (err) {
    console.error("❌ getUserSummaryByIds 오류:", err);
    return res
      .status(500)
      .json({ success: false, message: "요약 데이터 조회 실패" });
  }
};
// ✅ 모든 미답변 문의 조회 (검색/정렬/페이징)
// GET /api/admin/inquiries?page=1&pageSize=20&search=&sort=created_at&order=desc&status=unanswered
exports.getUnansweredInquiries = async (req, res) => {
  try {
    let {
      page = 1,
      pageSize = 20,
      search = "",
      sort = "created_at", // created_at | answered_at | username | email
      order = "desc",
      status = "unanswered", // unanswered(기본) | all
    } = req.query;

    const limit = Math.max(parseInt(pageSize, 10) || 20, 1);
    const offset = Math.max((parseInt(page, 10) - 1) * limit, 0);

    const ALLOWED_SORT = new Set([
      "created_at",
      "answered_at",
      "username",
      "email",
    ]);
    const sortCol = ALLOWED_SORT.has(String(sort))
      ? String(sort)
      : "created_at";
    const sortOrder = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

    const where = [];
    const vals = [];

    // ✅ status 필터: all | unanswered | answered
    const st = String(status || "unanswered");
    if (st === "unanswered") {
      where.push("(i.status = '접수' OR i.answer IS NULL OR i.answer = '')");
    } else if (st === "answered") {
      where.push("(i.answer IS NOT NULL AND i.answer <> '')");
    }
    // (all 은 추가 where 없음)

    if (search) {
      where.push(
        "(u.username LIKE ? OR u.email LIKE ? OR i.title LIKE ? OR i.message LIKE ?)"
      );
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    const listSql = `
      SELECT
        i.id, i.user_id, i.title, i.message, i.answer, i.status,
        i.created_at, i.answered_at,
        u.username, u.email
      FROM inquiries i
      JOIN users u ON u.id = i.user_id
      ${whereSql}
      ORDER BY i.${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) AS totalCount
      FROM inquiries i
      JOIN users u ON u.id = i.user_id
      ${whereSql}
    `;

    const [rows] = await pool.query(listSql, [...vals, limit, offset]);
    const [[{ totalCount }]] = await pool.query(countSql, vals);

    res.json({ success: true, inquiries: rows, totalCount: totalCount || 0 });
  } catch (err) {
    console.error("❌ getUnansweredInquiries 오류:", err);
    res.status(500).json({ success: false, message: "문의 조회 실패" });
  }
};
// ✅ 관리자 답변 등록
// PUT /api/admin/users/inquiries/:id/answer { answer: "..." }
exports.answerInquiryByAdmin = async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!id || !String(answer || "").trim()) {
    return res
      .status(400)
      .json({ success: false, message: "유효한 문의 ID와 답변이 필요합니다." });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE inquiries
      SET answer = ?, answered_at = NOW(), status = '답변'
      WHERE id = ?
      `,
      [String(answer).trim(), id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "해당 문의를 찾을 수 없습니다." });
    }

    res.json({
      success: true,
      message: "답변이 등록되었습니다.",
      inquiryId: Number(id),
    });
  } catch (err) {
    console.error("❌ answerInquiryByAdmin 오류:", err);
    res.status(500).json({ success: false, message: "답변 등록 실패" });
  }
};
/** ======================= 교육일정 일괄 삭제 ======================= */
// DELETE /api/admin/schedules
// body: { ids:[1,2,...] } 또는 ?ids=1,2,3
exports.deleteSchedules = async (req, res) => {
  try {
    // ids 파싱(중복 제거 + 숫자화)
    let ids = [];
    if (Array.isArray(req.body?.ids)) {
      ids = req.body.ids
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
    } else if (req.query?.ids) {
      ids = String(req.query.ids)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    }
    if (!ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 ids가 필요합니다." });
    }

    const placeholders = ids.map(() => "?").join(",");

    // 1) 주문내역(order_items) 존재 여부 검사
    const [orderBlocks] = await pool.query(
      `SELECT schedule_id, COUNT(*) AS order_count
         FROM order_items
        WHERE schedule_id IN (${placeholders})
        GROUP BY schedule_id`,
      ids
    );

    // 2) 수료증(certificates) 존재 여부 검사(있다면 함께 차단)
    const [certBlocks] = await pool.query(
      `SELECT schedule_id, COUNT(*) AS cert_count
         FROM certificates
        WHERE schedule_id IN (${placeholders})
        GROUP BY schedule_id`,
      ids
    );

    if ((orderBlocks?.length || 0) > 0 || (certBlocks?.length || 0) > 0) {
      return res.status(409).json({
        success: false,
        code: "HAS_DEPENDENCIES",
        message:
          "연결된 주문/수료증 데이터가 있어 일정을 삭제할 수 없습니다. 관련 데이터를 먼저 정리하세요.",
        details: { orderBlocks, certBlocks },
      });
    }

    // 3) 실제 삭제
    const [result] = await pool.query(
      `DELETE FROM schedules WHERE id IN (${placeholders})`,
      ids
    );

    return res.json({
      success: true,
      deletedCount: result.affectedRows || 0,
      ids,
    });
  } catch (err) {
    console.error("❌ deleteSchedules 오류:", err);
    return res.status(500).json({ success: false, message: "일정 삭제 실패" });
  }
};
/** ======================= 상품 일괄 삭제 ======================= */
// DELETE /api/admin/products
// body: { ids:[1,2,...] } 또는 ?ids=1,2,3
exports.deleteProducts = async (req, res) => {
  try {
    let ids = [];
    if (Array.isArray(req.body?.ids)) {
      ids = req.body.ids
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
    } else if (req.query?.ids) {
      ids = String(req.query.ids)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    }
    if (!ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 ids가 필요합니다." });
    }

    const placeholders = ids.map(() => "?").join(",");

    // 1) 연결 일정(schedules) 존재 여부(필수 차단)
    const [scheduleBlocks] = await pool.query(
      `SELECT product_id, COUNT(*) AS schedule_count
         FROM schedules
        WHERE product_id IN (${placeholders})
        GROUP BY product_id`,
      ids
    );

    // 2) 후기(reviews) 존재 여부(있는 경우 함께 안내) - FK: reviews.product_id → products.id
    const [reviewBlocks] = await pool.query(
      `SELECT product_id, COUNT(*) AS review_count
         FROM reviews
        WHERE product_id IN (${placeholders})
        GROUP BY product_id`,
      ids
    );

    if ((scheduleBlocks?.length || 0) > 0 || (reviewBlocks?.length || 0) > 0) {
      return res.status(409).json({
        success: false,
        code: "HAS_DEPENDENCIES",
        // message 제거: 프론트에서 details로 안내
        details: { scheduleBlocks, reviewBlocks },
      });
    }

    // 3) 실제 삭제
    const [result] = await pool.query(
      `DELETE FROM products WHERE id IN (${placeholders})`,
      ids
    );

    return res.json({
      success: true,
      deletedCount: result.affectedRows || 0,
      ids,
    });
  } catch (err) {
    console.error("❌ deleteProducts 오류:", err);
    return res.status(500).json({ success: false, message: "상품 삭제 실패" });
  }
};
