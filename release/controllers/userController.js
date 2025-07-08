// backend/controllers/userController.js
const db = require("../config/db");
const generateCertificatePdf = require("../utils/generateCertificatePdf");
const path = require("path");
const fs = require("fs");
exports.downloadCertificatePdf = async (req, res) => {
  const userId = req.user?.id;
  const { scheduleId } = req.params;

  try {
    // (1) 유효성 검사: 수료증이 존재하는지 체크
    const [rows] = await db.query(
      `SELECT c.*, s.certificate_template
       FROM certificates c
       JOIN schedules s ON s.id = c.schedule_id
       WHERE c.user_id = ? AND c.schedule_id = ? AND c.is_active = 1`,
      [userId, scheduleId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "수료증을 찾을 수 없습니다." });
    }

    const certificate = rows[0];

    // (2) PDF 생성
    const pdfBuffer = await generateCertificatePdf({
      html: certificate.certificate_template,
      data: {
        username: certificate.username,
        title: certificate.schedule_title,
        release_date: certificate.release_date,
      },
    });

    // (3) 응답으로 PDF 파일 다운로드
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.schedule_title}_수료증.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ 수료증 다운로드 실패:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};
// ✔️ 수료증 다운로드
exports.downloadCertificatePdf = async (req, res) => {
  const { certificateId } = req.params;

  try {
    // (1) certificates 테이블에서 URL 가져오기
    const [rows] = await db.query(
      `SELECT certificate_url FROM certificates WHERE id = ? AND is_active = 1`,
      [certificateId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "수료증을 찾을 수 없습니다." });
    }

    const certificateUrl = rows[0].certificate_url;
    if (!certificateUrl) {
      return res
        .status(400)
        .json({ success: false, message: "수료증 파일 경로가 없습니다." });
    }

    // (2) 파일 실제 경로
    const filePath = path.join(__dirname, "..", certificateUrl);

    // (3) 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "수료증 파일이 존재하지 않습니다." });
    }

    // (4) 다운로드
    res.download(filePath, (err) => {
      if (err) {
        console.error("❌ 다운로드 실패:", err);
        res.status(500).json({ success: false, message: "다운로드 실패" });
      }
    });
  } catch (error) {
    console.error("❌ 수료증 다운로드 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};
// ✅ 내 정보 조회 (쿠폰 amount 포함된 상태로 응답)
exports.getMyInfo = async (req, res) => {
  const userId = req.user?.id;

  try {
    const [[user]] = await db.query(
      `SELECT id, username, email, phone, role FROM users WHERE id = ?`,
      [userId]
    );

    const [cartItems] = await db.query(
      `SELECT unit_price, quantity FROM cart_items WHERE user_id = ?`,
      [userId]
    );
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const [couponRows] = await db.query(
      `SELECT c.*, ct.discount_type, ct.discount_amount, ct.discount_value
       FROM coupons c
       JOIN coupon_templates ct ON c.template_id = ct.id
       WHERE c.user_id = ? AND c.is_used = 0`,
      [userId]
    );
    const coupons = couponRows.map((c) => ({
      ...c,
      amount:
        c.discount_type === "fixed"
          ? Number(c.discount_amount || 0)
          : c.discount_type === "percent"
            ? Math.floor((totalPrice * Number(c.discount_value || 0)) / 100)
            : 0,
    }));

    const [pointRow] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN change_type = '사용' THEN -amount ELSE amount END), 0) AS point_balance
       FROM points WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      coupons,
      point_balance: Number(pointRow[0].point_balance || 0), // ✅ 여기만 바꾸면 끝
    });
  } catch (err) {
    console.error("❌ 내 정보 조회 오류:", err);
    res.status(500).json({ success: false, message: "내 정보 조회 실패" });
  }
};
