const db = require("../config/db");

// 사용자의 포인트 내역 조회 (+ 사용자명 포함)
exports.getPointsByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      p.id AS point_id,
      p.change_type,
      p.amount,
      p.description,
      p.created_at,
      p.used_at,
      u.username
    FROM points p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    `,
    [userId]
  );
  return rows;
};
