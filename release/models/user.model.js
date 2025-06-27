const db = require("../config/db");

// 🔍 사용자 정보 조회
exports.getUserInfoById = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT username AS name, email, phone, created_at, company, department, position, marketing_agree
    FROM users
    WHERE id = ?
    `,
    [userId]
  );
  return rows;
};

// 🔧 사용자 정보 수정
exports.updateUserInfoById = async (
  userId,
  username,
  phone,
  company,
  department,
  position,
  marketing_agree
) => {
  const [result] = await db.query(
    `
      UPDATE users
      SET username = ?, phone = ?, company = ?, department = ?, position = ?, marketing_agree = ?
      WHERE id = ?
    `,
    [username, phone, company, department, position, marketing_agree, userId]
  );
  return result;
};

// 🔍 ID로 사용자 조회
exports.findUserById = async (userId) => {
  const [rows] = await db.query(`SELECT * FROM users WHERE id = ?`, [userId]);
  return rows[0];
};

// 🔐 비밀번호 업데이트
exports.updatePassword = async (userId, hashedPassword) => {
  const [result] = await db.query(
    `UPDATE users SET password = ? WHERE id = ?`,
    [hashedPassword, userId]
  );
  return result;
};

// 🚫 소프트 삭제
exports.softDeleteUser = async (userId) => {
  const [result] = await db.query(
    `UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?`,
    [userId]
  );
  return result;
};

// 🔁 초기화 상태 해제 (password_reset_required → false)
exports.clearPasswordResetFlag = async (userId) => {
  const [result] = await db.query(
    `UPDATE users SET password_reset_required = false WHERE id = ?`,
    [userId]
  );
  return result;
};
