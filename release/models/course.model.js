const db = require("../config/db");
// 사용자가 수강 중인 강의 정보 조회
exports.getCourseInfoByUser = async (userId) => {
  const [rows] = await db.query(
    `
      SELECT 
        s.id AS schedule_id,
        s.title,
        s.start_date,
        s.end_date,
        s.location,
        s.instructor,
        s.category,
        o.created_at AS order_date, -- 🆕 주문일
        CASE 
          WHEN NOW() < s.start_date THEN '예정'
          WHEN NOW() > s.end_date THEN '완료'
          ELSE '진행중'
        END AS status              -- 🆕 상태
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN schedules s ON oi.schedule_id = s.id
      WHERE o.user_id = ? 
      AND o.order_status = 'paid' 
      AND s.end_date >= NOW()
      ORDER BY s.start_date ASC
    `,
    [userId]
  );
  return rows;
};
