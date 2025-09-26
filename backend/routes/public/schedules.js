const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middlewares/authMiddleware"); // (다른 라우트에서 사용)
const serverTiming = require("../../middlewares/serverTiming"); // Server-Timing 미들웨어

// 공개용 일정 목록 조회 (슬림 SELECT + LIMIT + 디버그 콘솔)
router.get("/public", serverTiming, async (req, res) => {
  let {
    type,
    category, // ✅ category 추가
    sort = "start_date",
    order = "asc",
    start_date,
    end_date,
    limit,
  } = req.query;


  req.mark("parse");

  // 안전 처리
  type = (type ?? "").trim();
  const hasRange = !!(start_date && end_date);

  // 정렬 화이트리스트(실제 사용하는 컬럼만 허용)
  const allowedSortFields = ["start_date", "end_date", "created_at"];
  const sortField = allowedSortFields.includes(sort) ? sort : "start_date";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  // LIMIT: 숫자 보장 + 범위 제한 (쿼리에 직접 삽입할 것이므로 필수)
  let limitNum = Number.parseInt(limit ?? "200", 10);
  if (!Number.isFinite(limitNum)) limitNum = 200;
  limitNum = Math.min(Math.max(limitNum, 1), 1000);

  // 날짜: YYYY-MM-DD만 사용(드라이버 바인딩 안정)
  const end = (end_date || "").slice(0, 10);
  const start = (start_date || "").slice(0, 10);

  try {
    // ✅ 필요한 컬럼만 SELECT (전송량↓)
    let query = `
  SELECT
    s.id,
    s.title,
    s.start_date,
    s.end_date,
    COALESCE(s.thumbnail_url, p.thumbnail_url, s.image_url, p.image_url) AS image_url,
    p.type  AS type,
    p.title AS product_title,
    p.category AS category
  FROM schedules s
  JOIN products p ON s.product_id = p.id
  WHERE s.status = 'open'
    AND s.is_active = 1
`;

const values = [];

if (category && category !== "전체") {
  query += " AND p.category = ?";
  values.push(category);
}

if (type && type !== "전체") {
  query += " AND p.type = ?";
  values.push(type);
}

    if (hasRange) {
      // 기간 겹침
      query +=
        " AND s.start_date <= ? AND (s.end_date IS NULL OR s.end_date >= ?)";
      values.push(end, start);
    }

    // ⚠️ LIMIT는 드라이버/버전에 따라 플레이스홀더가 거부될 수 있어, 검증된 정수를 문자열에 직접 삽입
    query += ` ORDER BY s.${sortField} ${sortOrder} LIMIT ${limitNum}`;

    // 디버그 로그 (실제 실행되는 SQL/바인딩 확인용)
    console.log("[DBG:/public] sql =", query.trim());
    console.log("[DBG:/public] values =", values);

    req.mark("db:start");
    const [rows] = await pool.execute(query, values);
    req.mark("db:end");
    
    // ✅ 일정별 태그 묶어서 조회 → rows에 tags 붙이기
    if (rows.length) {
      const ids = rows.map(r => r.id);
      const ph = ids.map(() => "?").join(",");
      const [tagRows] = await pool.execute(
        `SELECT st.schedule_id, t.name
           FROM schedule_tags st
           JOIN tags t ON st.tag_id = t.id
          WHERE st.schedule_id IN (${ph})`,
        ids
      );
      const tagMap = new Map();
      for (const r of tagRows) {
        const list = tagMap.get(r.schedule_id) || [];
        list.push(r.name);
        tagMap.set(r.schedule_id, list);
      }
      for (const r of rows) r.tags = tagMap.get(r.id) || [];
    }
    
    // ✅ 디버그 로그 추가
    console.log("[DBG row sample]", rows[0]);
    
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, schedules: rows });
    
  } catch (err) {
    console.error("공개 일정 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});
// ✅ 캘린더용 회차 단위 목록
router.get("/public/sessions", serverTiming, async (req, res) => {
  let { type, category, start_date, end_date, limit } = req.query; // ✅ category 추가
  req.mark("parse");

  type = (type ?? "").trim();
  const hasRange = !!(start_date && end_date);

  // LIMIT 정수 보정
  let limitNum = Number.parseInt(limit ?? "500", 10);
  if (!Number.isFinite(limitNum)) limitNum = 500;
  limitNum = Math.min(Math.max(limitNum, 1), 2000);

  const start = (start_date || "").slice(0, 10);
  const end   = (end_date   || "").slice(0, 10);

  try {
    let sql = `
  SELECT
    ss.id                 AS session_id,
    s.id                  AS schedule_id,
    s.title               AS title,
    p.type                AS type,
    p.title               AS product_title,
    p.category            AS category,
    COALESCE(s.thumbnail_url, p.thumbnail_url, s.image_url, p.image_url) AS image_url,
    ss.start_date, ss.end_date, ss.start_time, ss.end_time,
    s.location, s.instructor
  FROM schedule_sessions ss
  JOIN schedules s ON ss.schedule_id = s.id
  JOIN products  p ON s.product_id   = p.id
  WHERE s.status   = 'open'
    AND s.is_active = 1
`;
const vals = [];

if (category && category !== "전체") {
  sql += ` AND p.category = ?`;
  vals.push(category);
}

if (type && type !== "전체") {
  sql += ` AND p.type = ?`;
  vals.push(type);
}


    // 기간 겹침(필수 권장)
    if (hasRange) {
      sql += ` AND ss.start_date <= ? AND ss.end_date >= ?`;
      vals.push(end, start);
    }

    sql += ` ORDER BY ss.start_date ASC, ss.start_time ASC LIMIT ${limitNum}`;

    console.log("[DBG:/public/sessions] sql =", sql.trim());
    console.log("[DBG:/public/sessions] vals =", vals);

    req.mark("db:start");
const [rows] = await pool.execute(sql, vals);
req.mark("db:end");

// ✅ rows 확인 로그만 추가
console.log("[DBG row sample]", rows[0]);

res.set("Cache-Control", "public, max-age=60");
return res.json({ success: true, sessions: rows });
  } catch (err) {
    console.error("공개 회차 목록 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 후기 작성 가능 여부
router.get("/:id/reviews/check-eligible", async (req, res) => {
  const scheduleId = req.params.id;

  // 로그인 상태에서만 userId 확인 (authMiddleware 없이)
  const userId = req.user?.id || null;

  if (!userId) {
    return res.json({ success: true, eligible: false });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT 1
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
          AND oi.schedule_id = ?
          AND o.order_status = 'paid'
        LIMIT 1`,
      [userId, scheduleId]
    );

    const eligible = rows.length > 0;
    return res.json({ success: true, eligible });
  } catch (err) {
    console.error("후기 작성 가능 여부 확인 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 공개용 일정 단건 조회 (라이트 응답)
router.get("/:id(\\d+)", serverTiming, async (req, res) => {
  req.mark("parse");
  const { id } = req.params;

  try {
    req.mark("db:start");
    const [rows] = await pool.execute(
      `SELECT 
  s.id,
  s.product_id,
  s.title,
  s.start_date,
  s.end_date,
  s.location,
  s.instructor,
  s.status,
  s.is_active,
  s.created_at,
  s.updated_at,
  s.image_url,
  p.image_url      AS product_image,
  p.title          AS product_title,
  p.price          AS product_price,
  p.type           AS type,
  p.purchase_type  AS purchase_type   -- ✅ 추가
FROM schedules s
LEFT JOIN products p ON s.product_id = p.id
WHERE s.id = ?
  AND s.status = 'open'
  AND s.is_active = 1
`,
      [id]
    );
    req.mark("db:end");

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "일정 없음" });
    }

    req.mark("db2:start");
    const [sess] = await pool.execute(
      `SELECT id, start_date, end_date, start_time, end_time, total_spots, remaining_spots
       FROM schedule_sessions
       WHERE schedule_id = ?
       ORDER BY start_date, start_time`,
      [id]
    );
    req.mark("db2:end");

    // ✅ 이미지 fallback 적용: schedule.image_url 없으면 product_image 사용
    const row = rows[0];

// ✅ 태그 조회 후 배열로 변환
const [tagRows] = await pool.execute(
  `SELECT t.name
     FROM schedule_tags st
     JOIN tags t ON st.tag_id = t.id
    WHERE st.schedule_id = ?`,
  [id]
);
const tags = tagRows.map(r => r.name);

const schedule = {
  ...row,
  image_url: row.image_url || row.product_image,
  schedule_image: row.image_url || row.product_image,
  sessions: sess,
  tags, // ✅ 추가
};

res.set("Cache-Control", "public, max-age=60");
return res.json({ success: true, schedule });

  } catch (err) {
    console.error("❌ 공개 일정 단건 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});


// ✅ 상세 HTML만 반환하는 전용 라우트
router.get("/:id/detail", serverTiming, async (req, res) => {
  req.mark("parse");
  const { id } = req.params;

  try {
    req.mark("db:start");
    const [rows] = await pool.execute(
      `SELECT detail
       FROM schedules
       WHERE id = ?
         AND status = 'open'
         AND is_active = 1`,
      [id]
    );
    req.mark("db:end");

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "일정 없음" });
    }

    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, detail: rows[0].detail });

  } catch (err) {
    console.error("❌ 공개 일정 detail 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 캘린더 전용 라이트 응답: 필요한 필드만 반환 (session_id, schedule_id, title, type, start_date, end_date)
router.get("/public/calendar", serverTiming, async (req, res) => {
  let { type, category, start_date, end_date, limit } = req.query; // ✅ category 추가
  req.mark("parse");

  type = (type ?? "").trim();
  const hasRange = !!(start_date && end_date);

  // LIMIT 정수 보정
  let limitNum = Number.parseInt(limit ?? "1000", 10);
  if (!Number.isFinite(limitNum)) limitNum = 1000;
  limitNum = Math.min(Math.max(limitNum, 1), 5000);

  const start = (start_date || "").slice(0, 10);
  const end   = (end_date   || "").slice(0, 10);

  try {
    let sql = `
  SELECT
    ss.id  AS session_id,
    s.id   AS schedule_id,
    s.title,
    p.type AS type,
    p.category AS category,
    ss.start_date,
    ss.end_date
  FROM schedule_sessions ss
  JOIN schedules s ON ss.schedule_id = s.id
  JOIN products  p ON s.product_id   = p.id
  WHERE s.status   = 'open'
    AND s.is_active = 1
`;
const vals = [];

if (category && category !== "전체") {
  sql += ` AND p.category = ?`;
  vals.push(category);
}

if (type && type !== "전체") {
  sql += ` AND p.type = ?`;
  vals.push(type);
}

    if (hasRange) {
      // 기간 겹침
      sql += ` AND ss.start_date <= ? AND ss.end_date >= ?`;
      vals.push(end, start);
    }

    sql += ` ORDER BY ss.start_date ASC, ss.end_date ASC, ss.id ASC LIMIT ${limitNum}`;

    console.log("[DBG:/public/calendar] sql =", sql.trim());
    console.log("[DBG:/public/calendar] vals =", vals);

    req.mark("db:start");
    const [rows] = await pool.execute(sql, vals);
    req.mark("db:end");

    // 라이트 필드만 그대로 반환
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, sessions: rows });
  } catch (err) {
    console.error("공개 캘린더 라이트 목록 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});


module.exports = router;
