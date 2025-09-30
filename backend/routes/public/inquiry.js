// backend/routes/public/inquiry.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken } = require("../../middlewares/authMiddleware");
const { sendInquiryMail } = require("../../utils/mailer"); // ✅ 메일 발송 함수 import

// 상품별 문의 목록 조회
router.get("/products/:productId/inquiries", async (req, res) => {
  const { productId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
         i.id, 
         i.title,
         CASE WHEN i.is_private = 1 THEN NULL ELSE i.message END AS message,
         CASE WHEN i.is_private = 1 THEN NULL ELSE i.answer  END AS answer,
         i.is_private, 
         i.user_id, 
         i.created_at,
         i.answered_at,
         i.answered_by
       FROM inquiries i
       WHERE i.product_id = ?
       ORDER BY i.created_at DESC`,
      [productId]
    );
    res.json({ success: true, inquiries: rows });
  } catch (err) {
    console.error("문의 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 상품 문의 등록 (회원 + 비회원 가능)
router.post("/products/:productId/inquiries", async (req, res) => {
  console.log("📩 상품 문의 요청 body:", req.body);
  const { productId } = req.params;
  const {
    user_id,
    title = "",
    message = "",
    is_private,
    guest_name = "",
    guest_email = "",
    guest_phone = "",
    company_name = "",
    department = "",
    position = "",
  } = req.body;

  const pid = Number(productId);
  const priv = String(is_private) === "0" ? 0 : 1;

  try {
    if (!Number.isFinite(pid) || pid <= 0) {
      return res.status(400).json({ success: false, message: "유효한 상품 ID가 아닙니다." });
    }
    if (!title.trim() || !message.trim()) {
      return res.status(400).json({ success: false, message: "제목과 내용을 입력해주세요." });
    }

    let insertResult;

    if (user_id) {
      const [insert] = await pool.execute(
        `INSERT INTO inquiries (product_id, user_id, title, message, is_private)
         VALUES (?, ?, ?, ?, ?)`,
        [pid, user_id, title.trim(), message.trim(), priv]
      );
      insertResult = insert;
    } else {
      if (req.body.agree_privacy !== 1) {
        return res.status(400).json({
          success: false,
          message: "개인정보 취급방침 동의가 필요합니다.",
        });
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email.trim());
      const phoneOk = guest_phone.replace(/\D/g, "").length >= 9;

      if (!guest_name.trim() || !emailOk || !phoneOk || !company_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "비회원 문의: 기업명/이름/이메일/휴대폰을 확인하세요.",
        });
      }

      const [insert] = await pool.execute(
        `INSERT INTO inquiries
           (product_id, title, message, is_private, guest_name, guest_email, guest_phone, company_name, department, position, agree_privacy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pid,
          title.trim(),
          message.trim(),
          priv,
          guest_name.trim(),
          guest_email.trim(),
          guest_phone.trim(),
          company_name.trim(),
          department?.trim() || null,
          position?.trim() || null,
          1,
        ]
      );
      insertResult = insert;
    }

    // INSERT 된 문의 조회 후 메일 발송 (상품명 포함)
    const [rows] = await pool.execute(
      `SELECT 
         i.title, i.message, i.product_id, i.created_at,
         p.title AS product_name,
         COALESCE(u.username,  i.guest_name)   AS guest_name,
         COALESCE(u.email,     i.guest_email)  AS guest_email,
         COALESCE(u.phone,     i.guest_phone)  AS guest_phone,
         COALESCE(u.company,   i.company_name) AS company_name,
         COALESCE(u.department,i.department)   AS department,
         COALESCE(u.position,  i.position)     AS position
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.id = ?`,
      [insertResult.insertId]
    );

    try {
      await sendInquiryMail(rows[0]);
      console.log("📧 상품 문의 메일 발송 성공");
    } catch (mailErr) {
      console.error("문의 메일 발송 오류:", mailErr);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("문의 등록 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 상품 문의 삭제 (작성자 또는 관리자만)
router.delete(
  "/products/:productId/inquiries/:id",
  authenticateToken,
  async (req, res) => {
    const { productId, id } = req.params;
    const loginUser = req.user;

    try {
      const [rows] = await pool.execute(
        `SELECT id, user_id
         FROM inquiries
         WHERE id = ? AND product_id = ?`,
        [id, productId]
      );
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "해당 문의를 찾을 수 없습니다." });
      }

      const ownerId = Number(rows[0].user_id);
      const isAdmin = loginUser?.role === "admin";
      const isOwner = Number(loginUser?.id) === ownerId;

      if (!isAdmin && !isOwner) {
        return res
          .status(403)
          .json({ success: false, message: "삭제 권한이 없습니다." });
      }

      const [result] = await pool.execute(
        `DELETE FROM inquiries
         WHERE id = ? AND product_id = ?`,
        [id, productId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "삭제할 문의가 없습니다." });
      }

      return res.json({ success: true, deletedId: Number(id) });
    } catch (err) {
      console.error("문의 삭제 오류:", err);
      return res.status(500).json({ success: false, message: "서버 오류" });
    }
  }
);

// 전역(일반) 문의 등록
router.post("/inquiries", async (req, res) => {
  console.log("📩 일반 문의 요청 body:", req.body);
  const {
    title = "",
    message = "",
    guest_name = "",
    guest_email = "",
    guest_phone = "",
    company_name = "",
    department = "",
    position = "",
    user_id = null,
  } = req.body;

  try {
    if (!title.trim() || !message.trim()) {
      return res.status(400).json({ success: false, message: "제목과 내용을 입력하세요." });
    }

    let insertResult;

    if (user_id) {
      const [insert] = await pool.execute(
        `INSERT INTO inquiries
           (product_id, user_id, title, message, is_private, agree_privacy)
         VALUES (NULL, ?, ?, ?, 0, 1)`,
        [user_id, title.trim(), message.trim()]
      );
      insertResult = insert;
    } else {
      if (req.body.agree_privacy !== 1) {
        return res.status(400).json({
          success: false,
          message: "개인정보 취급방침 동의가 필요합니다.",
        });
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email.trim());
      const phoneOk = guest_phone.replace(/\D/g, "").length >= 9;

      if (!guest_name.trim() || !emailOk || !phoneOk || !company_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "비회원 문의: 기업명/이름/이메일/휴대폰을 확인하세요.",
        });
      }

      const [insert] = await pool.execute(
        `INSERT INTO inquiries
           (product_id, title, message, is_private, guest_name, guest_email, guest_phone, company_name, department, position, agree_privacy)
         VALUES (NULL, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)`,
        [
          title.trim(),
          message.trim(),
          guest_name.trim(),
          guest_email.trim(),
          guest_phone.trim(),
          company_name.trim(),
          department?.trim() || null,
          position?.trim() || null,
        ]
      );
      insertResult = insert;
    }

    // INSERT 된 문의 조회 후 메일 발송 (상품명 포함, 전역은 product_id가 NULL이라 출력X)
    const [rows] = await pool.execute(
      `SELECT 
         i.title, i.message, i.product_id, i.created_at,
         p.title AS product_name,
         COALESCE(u.username,  i.guest_name)   AS guest_name,
         COALESCE(u.email,     i.guest_email)  AS guest_email,
         COALESCE(u.phone,     i.guest_phone)  AS guest_phone,
         COALESCE(u.company,   i.company_name) AS company_name,
         COALESCE(u.department,i.department)   AS department,
         COALESCE(u.position,  i.position)     AS position
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.id = ?`,
      [insertResult.insertId]
    );

    try {
      await sendInquiryMail(rows[0]);
      console.log("📧 전역 문의 메일 발송 성공");
    } catch (mailErr) {
      console.error("문의 메일 발송 오류:", mailErr);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("전역 문의 등록 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
