// backend/controllers/adminSchedulesController.js
const pool = require("../config/db");
const { normalizeDetailHtml } = require("../services/normalizeDetailHtml"); 

/* ===== 공통 유틸 ===== */
function toKstDate(y, m, d, hh, mm, ss, ms) {
  return new Date(
    new Date(Date.UTC(y, m - 1, d, hh, mm, ss, ms)).toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  );
}
function boundaryFromYmd(ymd, endOfDay = false) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return endOfDay
    ? toKstDate(y, m, d, 23, 59, 59, 999)
    : toKstDate(y, m, d, 0, 0, 0, 0);
}
const nowKST = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

/* ===== 세션 정규화: date 또는 start/end 모두 수용 ===== */
function normalizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  const valid = sessions.filter((s) => {
    const hasRange = s?.start_date && s?.end_date;
    const hasSingle = s?.date;
    return (hasRange || hasSingle) && s?.start_time && s?.end_time;
  });

  const toIntOrNull = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string" && v.trim() === "") return null; // ""는 null 처리
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return valid.map((s, idx) => {
    const sd = s.start_date || s.date;
    const ed = s.end_date || s.date;
    const ts = toIntOrNull(s.total_spots);  // ← 강제 0 금지
    return {
      start_date: sd,
      end_date: ed,
      start_time: s.start_time,
      end_time: s.end_time,
      total_spots: ts,           // null 허용
      session_date: sd,
      _idx: idx,
    };
  });
}

const toDT = (d, t) => `${d} ${t}:00`;

/* ===== 목록 ===== */
exports.listSchedules = async (req, res) => {
  const {
    page = 1, pageSize = 20, sortKey = "start_date", sortDir = "desc",
    tabType: qTabType, searchField, searchQuery,
    start_date: qStartDate, end_date: qEndDate,
    in_progress, is_active, type: legacyType, include_sessions,
  } = req.query;

  const sort = String(sortKey || "start_date");
  const order =
    String(sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const search = searchQuery;
  const tabType = qTabType ?? legacyType;

  try {
    const [rows] = await pool.execute(`
      SELECT
        s.id,
        s.product_id,
        s.title,
        s.start_date,
        s.end_date,
        s.location,
        s.instructor,
        s.total_spots,
        s.price,
        s.is_active,
        s.created_at,
        s.updated_at,
        s.image_url           AS image_url,
        s.thumbnail_url       AS thumbnail,
        p.title               AS product_title,
        p.type                AS product_type,
        p.category            AS product_category,
        p.image_url           AS product_image
      FROM schedules s
      LEFT JOIN products p ON s.product_id = p.id
    `);
    
    let filtered = rows;
    if (String(include_sessions) === "1") {
      // 1) 회차 수/첫날/마지막날
      const [agg] = await pool.execute(`
        SELECT
          ss.schedule_id,
          MIN(ss.start_date) AS first_date,
          MAX(ss.end_date)   AS last_date,
          COUNT(*)           AS sessions_count
        FROM schedule_sessions ss
        GROUP BY ss.schedule_id
      `);
      const aggMap = new Map(agg.map((r) => [r.schedule_id, r]));
    
      // 2) 목록 대상 id만 추려서 해당 스케줄들의 세션 배열 조회
      const ids = filtered.map((s) => s.id);
      let detailMap = new Map();
      let sessionsMap = new Map();
      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        const [rowsSess] = await pool.query(
          `
          SELECT id, schedule_id, start_date, end_date, total_spots, remaining_spots
FROM schedule_sessions
WHERE schedule_id IN (${placeholders})
ORDER BY start_date, start_time

          `,
          ids
        );
        // sessions_detail (기간만)
        detailMap = rowsSess.reduce((m, r) => {
          const list = m.get(r.schedule_id) || [];
          list.push({
            start_date: r.start_date,
            end_date:   r.end_date ?? r.start_date,
          });
          m.set(r.schedule_id, list);
          return m;
        }, new Map());
    
        // sessions (정원/잔여 포함)
        // 2-A) 세션별 예약 집계 추가
const [sessReserved] = await pool.query(
  `
  SELECT oi.schedule_session_id, SUM(oi.quantity) AS reserved_count
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.order_status = 'paid'
  GROUP BY oi.schedule_session_id
  `
);
const sessReservedMap = new Map(
  sessReserved.map(r => [r.schedule_session_id, Number(r.reserved_count) || 0])
);

// 2-B) 세션 배열 구성
sessionsMap = rowsSess.reduce((m, r) => {
  const list = m.get(r.schedule_id) || [];
  const reserved = sessReservedMap.get(r.id) || 0;   // ✅ r.id = session id
  const total = Number(r.total_spots) || 0;
  list.push({
    id: r.id,  // 세션 id 반드시 내려줘야 프론트에서 selectedSessionId 매칭 가능
    start_date: r.start_date,
    end_date:   r.end_date ?? r.start_date,
    total_spots: total,
    reserved_spots: reserved,
    remaining_spots: Math.max(total - reserved, 0),
    order_count: reserved   // ✅ 프론트에서 공통으로 쓰도록 추가
  });
  m.set(r.schedule_id, list);
  return m;
}, new Map());


      }
    
      // 3) 필드 병합
      filtered = filtered.map((s) => {
        const a = aggMap.get(s.id);
        return {
          ...s,
          first_date:     a?.first_date || null,
          last_date:      a?.last_date  || null,
          sessions_count: a?.sessions_count ? Number(a.sessions_count) : 0,
          sessions_detail: detailMap.get(s.id) || [],   // ✅ 기간 툴팁용
          sessions: sessionsMap.get(s.id) || [],        // ✅ 모집인원 툴팁용 (정원/잔여 포함)
        };
      });
    }
    

    // ✅ 예약수/잔여좌석 집계 (항상 부여)
    const [reservedAgg] = await pool.execute(`
      SELECT oi.schedule_id, SUM(oi.quantity) AS reserved_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.order_status = 'paid'
      GROUP BY oi.schedule_id
    `);
    const rmap = new Map(reservedAgg.map(r => [r.schedule_id, Number(r.reserved_count) || 0]));
    filtered = filtered.map((s) => {
      const reserved = rmap.get(s.id) || 0;
      const total = Number(s.total_spots) || 0;
      const remaining = Math.max(total - reserved, 0);
      return { 
        ...s, 
        reserved_spots: reserved, 
        remaining_spots: remaining,
        // ✅ 일정 이미지가 없으면 상품 이미지를 fallback으로 사용
        schedule_image: s.schedule_image || s.product_image,
        image_url: s.image_url || s.product_image,   // ✅ 프론트가 image_url만 볼 때 대비

      };
    });
    
    // 필터들
    if (tabType && tabType !== "전체") {
      filtered = filtered.filter((s) => s.product_type === tabType);
    }

    if (qStartDate || qEndDate) {
      const from = qStartDate ? boundaryFromYmd(qStartDate, false) : null;
      const to   = qEndDate   ? boundaryFromYmd(qEndDate, true)   : null;
      filtered = filtered.filter((s) => {
        const sd = s?.start_date ? new Date(s.start_date) : null;
        if (!sd) return false;
        if (from && sd < from) return false;
        if (to && sd > to) return false;
        return true;
      });
    }

    if (String(in_progress) === "1") {
      const now = nowKST();
      filtered = filtered.filter((s) => {
        const sd = s?.start_date ? new Date(s.start_date) : null;
        const ed = s?.end_date ? new Date(s.end_date) : sd;
        if (!sd) return false;
        return sd <= now && now <= ed;
      });
    }

    if (is_active !== undefined && is_active !== "") {
      const want = Number(is_active) === 1 ? 1 : 0;
      filtered = filtered.filter((s) => Number(s.is_active) === want);
    }

    if (searchField === "is_active") {
      if (search !== "") {
        filtered = filtered.filter((s) => String(s.is_active) === String(search));
      }
    } else if (searchField && search) {
      filtered = filtered.filter((s) => {
        const value =
          searchField === "product_title"
            ? s.product_title
            : searchField === "product_type"
            ? s.product_type
            : s[searchField];
        if (typeof value === "string") {
          return value.toLowerCase().includes(String(search).toLowerCase());
        } else if (typeof value === "number") {
          return value === Number(search);
        }
        return true;
      });
    }

    // ✅ 정렬: seats_remaining → remaining_spots 매핑
    const sorted = [...filtered].sort((a, b) => {
      const pick = (row) => {
        if (sort === "product_title")   return row.product_title;
        if (sort === "product_type")    return row.product_type;
        if (sort === "seats_remaining") return Number(row.remaining_spots ?? 0);
        return row[sort];
      };

      const av = pick(a);
      const bv = pick(b);

      // 숫자 우선
      if (typeof av === "number" && typeof bv === "number") {
        return order === "asc" ? av - bv : bv - av;
      }

      // 날짜 파싱 비교
      const aTime = av instanceof Date ? av.getTime() : (av ? Date.parse(av) : NaN);
      const bTime = bv instanceof Date ? bv.getTime() : (bv ? Date.parse(bv) : NaN);
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
        return order === "asc" ? aTime - bTime : bTime - aTime;
      }

      // 문자열 비교
      const as = (av ?? "").toString();
      const bs = (bv ?? "").toString();
      return order === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.max(parseInt(pageSize, 10) || 20, 1);
    const start = (pageNum - 1) * pageSizeNum;
    const paged = sorted.slice(start, start + pageSizeNum);
    console.log(
      "[DEBUG schedules list]",
      paged.slice(0, 2).map(s => ({
        id: s.id,
        title: s.title,
        thumbnail: s.thumbnail ? s.thumbnail.slice(0, 80) : null,
        image_url: s.image_url ? s.image_url.slice(0, 80) : null,
        product_image: s.product_image ? s.product_image.slice(0, 80) : null,
      }))
    );
    res.json({
      success: true,
      schedules: paged,
      totalCount: filtered.length,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (err) {
    console.error("❌ 일정 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};


/* ===== 유형 목록 ===== */
exports.listScheduleTypes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT p.type
      FROM schedules s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE p.type IS NOT NULL AND p.type <> ''
      ORDER BY p.type
    `);
    const types = rows.map((r) => r.type).filter(Boolean);
    res.json({ success: true, types });
  } catch (err) {
    console.error("❌ 유형 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "유형 조회 실패" });
  }
};

/* ===== 단건 조회 ===== */
exports.getScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, p.title AS product_title, p.type AS product_type, p.image_url AS product_image
         FROM schedules s
         LEFT JOIN products p ON s.product_id = p.id
        WHERE s.id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "일정 없음" });
    }
    const [sess] = await pool.execute(
      `SELECT ss.id, ss.start_date, ss.end_date, ss.start_time, ss.end_time,
              ss.total_spots, ss.remaining_spots,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.schedule_session_id = ss.id) AS order_count
         FROM schedule_sessions ss
        WHERE ss.schedule_id = ?
        ORDER BY ss.start_date, ss.start_time`,
      [id]
    );
    
       // ✅ 임시 로그로 실제 내려가는 값 확인
       console.log("[DEBUG getScheduleById]", {
        id,
        schedule_image: rows[0]?.image_url?.slice(0, 80),
        product_image: rows[0]?.product_image?.slice(0, 80),
      });
  
      // ✅ fallback: 일정 이미지 없으면 상품 이미지 사용
      const scheduleRow = {
        ...rows[0],
        schedule_image: rows[0]?.image_url || rows[0]?.product_image,
        image_url: rows[0]?.image_url || rows[0]?.product_image,
      };
  
      return res.json({ success: true, schedule: { ...scheduleRow, sessions: sess } });
  

    
  } catch (err) {
    console.error("일정 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/* ===== 등록 ===== */
exports.createSchedule = async (req, res) => {
  const {
    product_id, title, start_date, end_date,
    location, instructor, description, total_spots,
    price, detail, image_url, sessions,
  } = req.body;

  // 이미지 URL 결정: 업로드 우선, data:image 차단
  const uploadedUrl =
  Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
    ? req.uploadedImageUrls[0].original
    : null;

const isDataUrl = typeof image_url === "string" && /^data:image\//i.test(image_url);
if (!uploadedUrl && isDataUrl) {
  // 🔎 무엇이 들어왔는지 서버 로그로 남김
  console.error("❌ dataURL 차단:", {
    length: image_url.length,
    head: String(image_url).slice(0, 32)
  });
  return res.status(400).json({
    success: false,
    code: "DATA_IMAGE",
    message: "data:image URL 차단",
    hint: "프론트에서 /upload/image로 업로드 후 반환된 공개 URL을 image_url로 보내세요."
  });
}

const resolvedImageUrl = uploadedUrl || (image_url || null);



  const normSessions = normalizeSessions(sessions);
  let startDt = start_date;
  let endDt   = end_date;
  if (normSessions.length) {
    const starts = normSessions.map((s) => toDT(s.start_date, s.start_time)).sort();
    const ends   = normSessions.map((s) => toDT(s.end_date,   s.end_time)).sort();
    startDt = starts[0];
    endDt   = ends[ends.length - 1];
  }

  // 🔎 디버깅: 값 보정 + 누락 사유 구체화
  const priceNum = (price === '' || price === undefined) ? null : Number(price);
  const missing = [];
  if (!product_id) missing.push('product_id');
  if (!title) missing.push('title');
  if (!startDt) missing.push('start_date');
  if (!endDt) missing.push('end_date');
  if (priceNum == null || Number.isNaN(priceNum)) missing.push('price');

  if (missing.length) {
    console.error('❌ createSchedule 누락 필드:', missing, {
      bodyKeys: Object.keys(req.body || {}),
      startDt, endDt,
      hasSessions: Array.isArray(sessions) ? sessions.length : 'no',
      image_url_type: image_url ? (String(image_url).slice(0,10)) : null,
      uploadedImageUrls: Array.isArray(req.uploadedImageUrls) ? req.uploadedImageUrls.length : 0,
    });
    return res.status(400).json({
      success: false,
      message: '필수 항목 누락',
      details: missing
    });
  }


  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { normalizeDetailHtml } = require("../services/normalizeDetailHtml");

const normDetail = await normalizeDetailHtml(detail || "");
const [r] = await conn.execute(
  `INSERT INTO schedules
     (product_id, title, start_date, end_date, location, instructor,
      description, total_spots, price, detail, image_url, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
   [product_id, title, startDt, endDt, location, instructor,
    description, total_spots, price, normDetail, resolvedImageUrl]      
);
    const newId = r.insertId;

    if (normSessions.length) {
        for (const s of normSessions) {
          console.log("🟢 inserting session", s); // ✅ 로그 추가
          const ts = s.total_spots; // normalizeSessions에서 이미 숫자 또는 null
await conn.execute(
  `INSERT INTO schedule_sessions
     (schedule_id, session_date, start_date, end_date, start_time, end_time, total_spots, remaining_spots)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    newId,
    s.session_date || s.start_date,
    s.start_date,
    s.end_date,
    s.start_time,
    s.end_time,
    ts,         // 숫자 또는 null
    ts,         // 남은좌석도 동일 기준
  ]
);

        }
      }
      

    await conn.commit();
    return res.json({ success: true, id: newId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 일정 등록 오류:", err?.stack || err);
    return res.status(500).json({ success: false, message: "등록 실패", error: err?.message });
  } finally {
    conn.release();
  }
};
 
/* ===== 수정 ===== */
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const {
    product_id, title, start_date, end_date,
    location, instructor, description, total_spots,
    price, detail, image_url, sessions,
  } = req.body;

  // 이미지 URL 결정: 업로드 우선, data:image 차단
  const uploadedUrl =
    Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
      ? req.uploadedImageUrls[0].original
      : null;
  if (!uploadedUrl && image_url && /^data:image\//i.test(image_url)) {
    return res.status(400).json({
      success: false,
      message: "data:image URL은 허용하지 않습니다. 파일 업로드를 사용하세요.",
    });
  }
  const resolvedImageUrl = uploadedUrl || (image_url || null);


  const normSessions = normalizeSessions(sessions);
  let startDt = start_date;
  let endDt   = end_date;
  if (normSessions.length) {
    const starts = normSessions.map((s) => toDT(s.start_date, s.start_time)).sort();
    const ends   = normSessions.map((s) => toDT(s.end_date,   s.end_time)).sort();
    startDt = starts[0];
    endDt   = ends[ends.length - 1];
  }

  if (!product_id || !title || !startDt || !endDt || price == null) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { normalizeDetailHtml } = require("../services/normalizeDetailHtml");

const normDetail = await normalizeDetailHtml(detail || "");
await conn.execute(
  `UPDATE schedules
      SET product_id=?, title=?, start_date=?, end_date=?, location=?, instructor=?,
          description=?, total_spots=?, price=?, detail=?, image_url=?, updated_at=NOW()
    WHERE id=?`,
  [product_id, title, startDt, endDt, location, instructor,
    description, total_spots, price, normDetail, resolvedImageUrl, id]       
);


    await conn.execute(`DELETE FROM schedule_sessions WHERE schedule_id = ?`, [id]);
    if (normSessions.length) {
        for (const s of normSessions) {
          console.log("🟢 updating session", s); // ✅ 로그 추가
          const ts = s.total_spots; // 숫자 또는 null
await conn.execute(
  `INSERT INTO schedule_sessions
     (schedule_id, session_date, start_date, end_date, start_time, end_time, total_spots, remaining_spots)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    id,
    s.session_date || s.start_date,
    s.start_date,
    s.end_date,
    s.start_time,
    s.end_time,
    ts,
    ts
  ]
);
     
        }
      }
      

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ 일정 수정 오류:", err?.stack || err);
    return res.status(500).json({ success: false, message: "수정 실패", error: err?.message });
  }
   finally {
    conn.release();
  }
};
// ===== 부분 수정(PATCH) : 들어온 필드만 동적 UPDATE, sessions 전달 시에만 세션 교체 =====
exports.patchSchedule = async (req, res) => {
  const { id } = req.params;

  // 업로드 이미지 우선, data:image 차단
  const uploadedUrl =
    Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
      ? req.uploadedImageUrls[0].original
      : null;

  const incoming = req.body || {};
  const {
    product_id, title, start_date, end_date,
    location, instructor, description, total_spots,
    price, detail, image_url, sessions,
  } = incoming;
  
  // 이미지 URL 결정 및 data:image 차단
  if (!uploadedUrl && typeof image_url === "string" && /^data:image\//i.test(image_url)) {
    return res.status(400).json({
      success: false,
      message: "data:image URL은 허용하지 않습니다. 파일 업로드를 사용하세요.",
    });
  }
  const resolvedImageUrl =
    uploadedUrl !== null ? uploadedUrl
    : image_url !== undefined ? image_url
    : undefined; // undefined면 SET에 포함 안 함
  
  // 숫자 필드 정규화(빈 문자열 → null, 미전달은 undefined 유지)
  const pricePatched = (price === '' ? null : price);
  
  const { normalizeDetailHtml } = require("../services/normalizeDetailHtml");

const normDetail = await normalizeDetailHtml(detail || "");
const allowed = {
  product_id, title, start_date, end_date,
  location, instructor, description, total_spots,
  price: pricePatched, detail: normDetail,
};

  if (resolvedImageUrl !== undefined) {
    // 빈 문자열 등은 null 저장
    allowed.image_url = resolvedImageUrl || null;
  }
  

  // sessions 정규화 및 start/end 자동 보정(필요 시)
  let normSessions = [];
  if (Array.isArray(sessions)) {
    normSessions = normalizeSessions(sessions);
    if ((!allowed.start_date || !allowed.end_date) && normSessions.length) {
      const starts = normSessions.map((s) => toDT(s.start_date, s.start_time)).sort();
      const ends   = normSessions.map((s) => toDT(s.end_date,   s.end_time)).sort();
      if (!allowed.start_date) allowed.start_date = starts[0];
      if (!allowed.end_date)   allowed.end_date   = ends[ends.length - 1];
    }
  }

  // undefined 키 제거
  const keys = Object.keys(allowed).filter((k) => allowed[k] !== undefined);
  if (keys.length === 0 && !Array.isArray(sessions)) {
    return res.status(400).json({ success: false, message: "변경할 필드가 없습니다." });
  }

  // 동적 UPDATE
  const setClauses = keys.map((k) => `${k} = ?`);
  const values = keys.map((k) => allowed[k]);
  // 항상 updated_at 갱신
  setClauses.push("updated_at = NOW()");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (keys.length > 0) {
      await conn.execute(
        `UPDATE schedules SET ${setClauses.join(", ")} WHERE id = ?`,
        [...values, id]
      );
    }

    // sessions가 전달된 경우에만 세션 테이블 교체
    // sessions가 전달된 경우에만 세션 테이블 교체
if (Array.isArray(sessions) && normSessions.length > 0) {
  // ✅ 전체 삭제 대신 일단 다 지우고 다시 넣는 방식 유지
  // (주문 걸린 세션도 그냥 유지할 수 있도록 DB에서 RESTRICT 해제했으므로 더 이상 500 안 터짐)
  await conn.execute(`DELETE FROM schedule_sessions WHERE schedule_id = ?`, [id]);

  for (const s of normSessions) {
    const ts = s.total_spots;
    await conn.execute(
      `INSERT INTO schedule_sessions
         (schedule_id, session_date, start_date, end_date, start_time, end_time, total_spots, remaining_spots)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ id, s.session_date || s.start_date, s.start_date, s.end_date, s.start_time, s.end_time, ts, ts ]
    );
  }
}
    

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ patchSchedule 오류:", err?.stack || err, {
      allowed,
      keys,
      values
    });
    return res.status(500).json({
      success: false,
      message: "부분 수정 실패",
      error: err?.message
    });
  } finally {
    conn.release();
  }
};

/* ===== 활성/비활성 ===== */
exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== "boolean") {
    return res.status(400).json({ success: false, message: "is_active 값이 필요합니다." });
  }
  try {
    await pool.execute(
      `UPDATE schedules SET is_active = ?, updated_at = NOW() WHERE id = ?`,
      [is_active ? 1 : 0, id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ 상태 변경 오류:", err);
    return res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
};

/* ===== 수강자 ===== */
exports.getStudents = async (req, res) => {
  const scheduleId = req.params.id;
  try {
    const [cartItems] = await pool.execute(
      `SELECT c.user_id, u.username, u.email, c.quantity, 'cart' AS source, c.created_at
         FROM cart_items c
         LEFT JOIN users u ON c.user_id = u.id
        WHERE c.schedule_id = ?`,
      [scheduleId]
    );
    const [orderItems] = await pool.execute(
      `SELECT o.user_id, u.username, u.email, oi.quantity, 'order' AS source, o.created_at
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         LEFT JOIN users u ON o.user_id = u.id
        WHERE oi.schedule_id = ? AND o.order_status = 'paid'`,
      [scheduleId]
    );
    res.json({ success: true, students: [...cartItems, ...orderItems] });
  } catch (err) {
    console.error("❌ 수강자 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/* ===== 일괄 삭제 ===== */
exports.deleteSchedules = async (req, res) => {
  try {
    let ids = [];
    if (Array.isArray(req.body?.ids)) {
      ids = req.body.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    } else if (req.query?.ids) {
      ids = String(req.query.ids)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    }
    if (!ids.length) {
      return res.status(400).json({ success: false, message: "유효한 ids가 필요합니다." });
    }

    const placeholders = ids.map(() => "?").join(",");

    const [orderBlocks] = await pool.query(
      `SELECT schedule_id, COUNT(*) AS order_count
         FROM order_items
        WHERE schedule_id IN (${placeholders})
        GROUP BY schedule_id`,
      ids
    );
    const [certBlocks] = await pool.query(
      `SELECT schedule_id, COUNT(*) AS cert_count
         FROM certificates
        WHERE schedule_id IN (${placeholders})
        GROUP BY schedule_id`,
      ids
    );

    if ((orderBlocks?.length || 0) > 0 || (certBlocks?.length || 0) > 0) {
      return res.status(409).json({
        success: false,
        code: "HAS_DEPENDENCIES",
        message: "연결된 주문/수료증 데이터가 있어 일정을 삭제할 수 없습니다. 관련 데이터를 먼저 정리하세요.",
        details: { orderBlocks, certBlocks },
      });
    }

    await pool.query(
      `DELETE FROM schedule_sessions WHERE schedule_id IN (${placeholders})`,
      ids
    );
    const [result] = await pool.query(
      `DELETE FROM schedules WHERE id IN (${placeholders})`,
      ids
    );
    return res.json({ success: true, deletedCount: result.affectedRows || 0, ids });
  } catch (err) {
    console.error("❌ deleteSchedules 오류:", err);
    return res.status(500).json({ success: false, message: "일정 삭제 실패" });
  }
};
