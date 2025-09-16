const db = require("../config/db");

// 회원/비회원 모두 지원
exports.createInquiry = async ({ userId, title, message, attachment, guest_name, guest_email, guest_phone }) => {
  let query, params;

  if (userId) {
    // ✅ 회원 문의
    query = `
      INSERT INTO inquiries (user_id, title, message, status, created_at, attachment)
      VALUES (?, ?, ?, '접수', NOW(), ?)
    `;
    params = [userId, title, message, attachment];
  } else {
    // ✅ 비회원 문의 (이름, 이메일, 휴대폰 필수)
    query = `
      INSERT INTO inquiries (title, message, status, created_at, attachment, guest_name, guest_email, guest_phone)
      VALUES (?, ?, '접수', NOW(), ?, ?, ?, ?)
    `;
    params = [title, message, attachment, guest_name, guest_email, guest_phone];
  }

  const [rows] = await db.query(query, params);
  return rows;
};


exports.getInquiriesByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT id, title, message, status, created_at, answered_at, answer, attachment
    FROM inquiries
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId]
  );
  return rows;
};

exports.updateInquiryAnswer = async (inquiryId, answer) => {
  const [rows] = await db.query(
    `
    UPDATE inquiries
    SET answer = ?, status = '답변 완료', answered_at = NOW()
    WHERE id = ?
    `,
    [answer, inquiryId]
  );
  return rows;
};
exports.deleteInquiryByUser = async (inquiryId, userId) => {
  const [result] = await db.query(
    `
    DELETE FROM inquiries
    WHERE id = ? AND user_id = ? AND status = '접수'
    `,
    [inquiryId, userId]
  );
  return result;
};
