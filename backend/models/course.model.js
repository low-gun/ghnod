const pool = require("../config/db"); // 상단에 추가

exports.getCourseInfoByUser = async (userId) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id AS schedule_id,
      s.title,
      COALESCE(ss.start_date, s.start_date) AS start_date,
      COALESCE(ss.end_date,   s.end_date)   AS end_date,
      ss.start_time,
      ss.end_time,
      s.location,
      s.instructor,
      p.type AS type,
      COALESCE(s.image_url, p.image_url) AS image_url,
      oi.schedule_session_id,
      o.created_at AS order_date,
      CASE
        WHEN NOW() < COALESCE(ss.start_date, s.start_date) THEN '예정'
        WHEN NOW() > COALESCE(ss.end_date,   s.end_date)   THEN '완료'
        ELSE '진행중'
      END AS status
    FROM orders o
    JOIN order_items oi       ON o.id = oi.order_id
    JOIN schedules s          ON oi.schedule_id = s.id
    LEFT JOIN schedule_sessions ss ON ss.id = oi.schedule_session_id
    LEFT JOIN products p      ON p.id = s.product_id
    WHERE o.user_id = ?
      AND o.order_status = 'paid'
    ORDER BY COALESCE(ss.start_date, s.start_date) ASC
    `,
    [userId]
  );
  return rows;
};

