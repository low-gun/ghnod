exports.getCourseInfoByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT
      s.id AS schedule_id,
      s.title,
      -- ✅ 회차가 있으면 회차 날짜/시간 우선
      COALESCE(ss.start_date, s.start_date) AS start_date,
      COALESCE(ss.end_date,   s.end_date)   AS end_date,
      ss.start_time,
      ss.end_time,
      s.location,
      s.instructor,
      p.type         AS type,            -- (카테고리/유형 표기 용)
      COALESCE(s.image_url, p.image_url) AS image_url,
      oi.schedule_session_id,            -- ✅ 선택 회차 FK
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
      AND COALESCE(ss.end_date, s.end_date) >= NOW()      -- ✅ 기간 필터도 회차 기준
    ORDER BY COALESCE(ss.start_date, s.start_date) ASC
    `,
    [userId]
  );
  return rows;
};
