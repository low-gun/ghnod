const db = require("../config/db");

exports.createInquiry = async (userId, title, message, attachment) => {
  const [rows] = await db.query(
    `
    INSERT INTO inquiries (user_id, title, message, status, created_at, attachment)
    VALUES (?, ?, ?, '접수', NOW(), ?)
    `,
    [userId, title, message, attachment]
  );
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
