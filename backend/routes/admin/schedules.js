// backend/routes/admin/schedules.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../../middlewares/authMiddleware");
const adminController = require("../../controllers/adminController");

// GET /api/admin/schedules
router.get("/", authenticateToken, adminOnly, async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    sortKey = "start_date",
    sortDir = "desc",
    tabType: qTabType,
    searchField,
    searchQuery,
    start_date: qStartDate,
    end_date: qEndDate,
    in_progress, // 진행중 정확 필터 (start<=today<=end)
    is_active, // 단독 활성/비활성 필터
    type: legacyType, // 탭 유형 alias
  } = req.query;

  const sort = String(sortKey || "start_date");
  const order =
    String(sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const search = searchQuery;
  const tabType = qTabType ?? legacyType; // 'type'도 허용

  try {
    const [rows] = await pool.execute(`
      SELECT
        s.*,
        s.image_url AS schedule_image,
        s.thumbnail_url AS thumbnail,
        p.title  AS product_title,
        p.type   AS product_type,
        p.category AS product_category,
        p.image_url AS product_image
      FROM schedules s
      LEFT JOIN products p ON s.product_id = p.id
    `);

    let filtered = rows;

    // 탭 유형
    if (tabType && tabType !== "전체") {
      filtered = filtered.filter((s) => s.product_type === tabType);
    }

    // 날짜 범위 (start_date 기준) - KST(Asia/Seoul) 경계 적용
    if (qStartDate || qEndDate) {
      const toKstDate = (y, m, d, hh, mm, ss, ms) =>
        new Date(
          new Date(Date.UTC(y, m - 1, d, hh, mm, ss, ms)).toLocaleString(
            "en-US",
            {
              timeZone: "Asia/Seoul",
            }
          )
        );
      const toBoundary = (str, endOfDay = false) => {
        const [y, m, d] = String(str).split("-").map(Number);
        return endOfDay
          ? toKstDate(y, m, d, 23, 59, 59, 999)
          : toKstDate(y, m, d, 0, 0, 0, 0);
      };

      const from = qStartDate ? toBoundary(qStartDate, false) : null;
      const to = qEndDate ? toBoundary(qEndDate, true) : null;

      filtered = filtered.filter((s) => {
        const sd = s?.start_date ? new Date(s.start_date) : null;
        if (!sd) return false;
        if (from && sd < from) return false;
        if (to && sd > to) return false;
        return true;
      });
    }

    // 진행중 필터 - KST 현재시각 적용
    if (String(in_progress) === "1") {
      const nowKST = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
      );
      filtered = filtered.filter((s) => {
        const sd = s?.start_date ? new Date(s.start_date) : null;
        const ed = s?.end_date ? new Date(s.end_date) : sd;
        if (!sd) return false;
        return sd <= nowKST && nowKST <= ed;
      });
    }

    // 단독 활성/비활성 필터 (?is_active=1|0)
    if (is_active !== undefined && is_active !== "") {
      const want = Number(is_active) === 1 ? 1 : 0;
      filtered = filtered.filter((s) => Number(s.is_active) === want);
    }

    // 검색 필드
    if (searchField === "is_active") {
      if (search !== "") {
        filtered = filtered.filter(
          (s) => String(s.is_active) === String(search)
        );
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

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      const pick = (row) =>
        sort === "product_title"
          ? row.product_title
          : sort === "product_type"
            ? row.product_type
            : row[sort];

      const av = pick(a);
      const bv = pick(b);

      // 문자열
      if (typeof av === "string" || typeof bv === "string") {
        const as = (av || "").toString();
        const bs = (bv || "").toString();
        return order === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
      }

      // 날짜/숫자
      const aNum = av instanceof Date ? av.getTime() : Number(av);
      const bNum = bv instanceof Date ? bv.getTime() : Number(bv);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return order === "asc" ? aNum - bNum : bNum - aNum;
      }

      // 날짜 문자열일 수 있음
      const aTime = av ? new Date(av).getTime() : NaN;
      const bTime = bv ? new Date(bv).getTime() : NaN;
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
        return order === "asc" ? aTime - bTime : bTime - aTime;
      }

      return 0;
    });

    // 페이징
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.max(parseInt(pageSize, 10) || 20, 1);
    const start = (pageNum - 1) * pageSizeNum;
    const paged = sorted.slice(start, start + pageSizeNum);

    res.json({
      success: true,
      schedules: paged, // 현재 페이지 데이터
      totalCount: filtered.length, // 전체 개수
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (err) {
    console.error("❌ 일정 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// GET /api/admin/schedules/types
router.get("/types", authenticateToken, adminOnly, async (req, res) => {
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
});

// GET /api/admin/schedules/:id
router.get("/:id", authenticateToken, adminOnly, async (req, res) => {
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
    return res.json({ success: true, schedule: rows[0] });
  } catch (err) {
    console.error("일정 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// POST /api/admin/schedules
router.post("/", authenticateToken, adminOnly, async (req, res) => {
  const {
    product_id,
    title,
    start_date,
    end_date,
    location,
    instructor,
    description,
    total_spots,
    price,
    detail,
    image_url,
  } = req.body;

  if (!product_id || !title || !start_date || !end_date || price == null) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    await pool.execute(
      `INSERT INTO schedules
       (product_id, title, start_date, end_date, location, instructor, description, total_spots, price, detail, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        product_id,
        title,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots,
        price,
        detail,
        image_url,
      ]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("일정 등록 오류:", err);
    return res.status(500).json({ success: false, message: "등록 실패" });
  }
});

// PUT /api/admin/schedules/:id
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    product_id,
    title,
    start_date,
    end_date,
    location,
    instructor,
    description,
    total_spots,
    price,
    detail,
    image_url,
  } = req.body;

  if (!product_id || !title || !start_date || !end_date || price == null) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    await pool.execute(
      `UPDATE schedules
       SET product_id=?, title=?, start_date=?, end_date=?, location=?, instructor=?, description=?, total_spots=?, price=?, detail=?, image_url=?, updated_at=NOW()
       WHERE id=?`,
      [
        product_id,
        title,
        start_date,
        end_date,
        location,
        instructor,
        description,
        total_spots,
        price,
        detail,
        image_url,
        id,
      ]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("일정 수정 오류:", err);
    return res.status(500).json({ success: false, message: "수정 실패" });
  }
});

// PATCH /api/admin/schedules/:id/active
router.patch("/:id/active", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") {
    return res
      .status(400)
      .json({ success: false, message: "is_active 값이 필요합니다." });
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
});

// DELETE /api/admin/schedules  (컨트롤러로 위임: 주문/수료증 의존성 차단 포함)
router.delete(
  "/",
  authenticateToken,
  adminOnly,
  adminController.deleteSchedules
);

// GET /api/admin/schedules/:id/students
router.get("/:id/students", authenticateToken, adminOnly, async (req, res) => {
  const scheduleId = req.params.id;

  try {
    // 카트 포함 미결제자
    const [cartItems] = await pool.execute(
      `SELECT c.user_id, u.username, u.email, c.quantity, 'cart' AS source, c.created_at
       FROM cart_items c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.schedule_id = ?`,
      [scheduleId]
    );

    // 결제 완료자
    const [orderItems] = await pool.execute(
      `SELECT o.user_id, u.username, u.email, oi.quantity, 'order' AS source, o.created_at
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE oi.schedule_id = ? AND o.order_status = 'paid'`,
      [scheduleId]
    );

    res.json({
      success: true,
      students: [...cartItems, ...orderItems],
    });
  } catch (err) {
    console.error("❌ 수강자 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
