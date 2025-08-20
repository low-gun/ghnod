const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../../middlewares/authMiddleware");
const adminController = require("../../controllers/adminController");

// 전체 상품 목록 조회 (Node.js 기반 정렬/필터/페이징)
router.get("/", authenticateToken, adminOnly, async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    sort = "created_at",
    order = "desc",
    type, // 상품 분류용 (탭 필터)
    searchField, // 검색 대상 컬럼명
    search,
    startDate,
    endDate,
  } = req.query;

  try {
    const [rows] = await pool.execute("SELECT * FROM products");

    let filtered = rows;

    // 🗂️ 상품 분류 필터 (탭에서 선택된 유형)
    if (!type || type === "전체") {
      // 전체 탭 or 기본 상태 → 전체 유지
      filtered = rows;
    } else {
      // 특정 유형 선택 시 필터링
      filtered = filtered.filter((p) => p.type === type);
    }

    // 🔍 검색 필터 (지정된 필드에서 검색어 포함 여부)
    if (searchField && search) {
      filtered = filtered.filter((p) => {
        const value = p[searchField];
        if (typeof value === "string") {
          return value.toLowerCase().includes(search.toLowerCase());
        } else if (typeof value === "number") {
          return value === Number(search);
        }
        return true;
      });
    }

    // 📅 날짜 필터
    if (startDate) {
      filtered = filtered.filter(
        (p) => new Date(p.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      const [y, m, d] = String(endDate).split("-").map(Number);
      const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
      filtered = filtered.filter((p) => new Date(p.created_at) <= endOfDay);
    }

    // 🔁 정렬
    // 🔁 정렬 (숫자/날짜 보강)
    const toTime = (v) => (v ? new Date(v).getTime() : NaN);
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];

      // 날짜 컬럼 처리
      if (sort === "created_at" || sort === "updated_at") {
        const at = toTime(aVal);
        const bt = toTime(bVal);
        if (!Number.isNaN(at) && !Number.isNaN(bt)) {
          return order === "asc" ? at - bt : bt - at;
        }
      }

      // 숫자 컬럼 처리
      if (sort === "id" || sort === "price") {
        const an = Number(aVal);
        const bn = Number(bVal);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) {
          return order === "asc" ? an - bn : bn - an;
        }
      }

      // 문자열 기본
      const as = (aVal ?? "").toString();
      const bs = (bVal ?? "").toString();
      return order === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });

    // 📄 페이징 (all=true면 전체, 아니면 slice)
    const all = String(req.query.all) === "true";
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.max(parseInt(pageSize, 10) || 20, 1);
    const start = (pageNum - 1) * pageSizeNum;
    const paged = all ? sorted : sorted.slice(start, start + pageSizeNum);

    res.json({
      success: true,
      products: paged,
      totalCount: filtered.length,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (err) {
    console.error("❌ 상품 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
// 등록된 상품 유형 목록
router.get("/types", authenticateToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT type 
         FROM products 
        WHERE type IS NOT NULL AND type <> '' 
        ORDER BY type`
    );
    const types = rows.map((r) => r.type);
    return res.json({ success: true, types });
  } catch (err) {
    console.error("❌ 상품 유형 조회 오류:", err);
    return res.status(500).json({ success: false, message: "유형 조회 실패" });
  }
});
// 상품 현황 요약(총개수 + 유형별 개수)
router.get("/stats", authenticateToken, adminOnly, async (req, res) => {
  try {
    const [[{ totalCount }]] = await pool.query(
      `SELECT COUNT(*) AS totalCount FROM products`
    );
    const [rows] = await pool.query(
      `SELECT type, COUNT(*) AS count
         FROM products
        WHERE type IS NOT NULL AND type <> ''
        GROUP BY type
        ORDER BY type`
    );
    return res.json({
      success: true,
      totalCount,
      byType: rows.map((r) => ({ type: r.type, count: Number(r.count) })),
    });
  } catch (err) {
    console.error("❌ 상품 현황 통계 오류:", err);
    return res.status(500).json({ success: false, message: "통계 조회 실패" });
  }
});

// 상품 활성화/비활성화 토글
router.patch("/:id/active", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      "UPDATE products SET is_active = NOT is_active WHERE id = ?",
      [id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("활성 상태 토글 오류:", err);
    return res.status(500).json({ success: false, message: "상태 변경 실패" });
  }
});

// 선택 상품 삭제
router.delete(
  "/",
  authenticateToken,
  adminOnly,
  adminController.deleteProducts
);

// 상품별 일정 조회
router.get("/:id/schedules", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, start_date, end_date, status
       FROM schedules
       WHERE product_id = ?
       ORDER BY start_date ASC`,
      [id]
    );
    res.json({ success: true, schedules: rows });
  } catch (err) {
    console.error("❌ 일정 조회 오류:", err);
    res.status(500).json({ success: false, message: "일정 조회 실패" });
  }
});
router.get("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(`SELECT * FROM products WHERE id = ?`, [
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "상품 없음" });
    }

    res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error("상품 단건 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, type, image_url, description, detail, price, is_active } =
    req.body;

  if (!title || !type) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }
  // ✅ 바로 여기 로그 추가
  console.log("📥 req.body.type =", type);
  console.log("📥 typeof =", typeof type);
  console.log("📥 length =", type?.length);
  console.log("📥 전체 req.body =", req.body);
  try {
    // 0/1 안전 변환
    const activeVal =
      typeof is_active === "boolean"
        ? is_active
          ? 1
          : 0
        : Number(is_active ?? 1)
          ? 1
          : 0;

    await pool.execute(
      `UPDATE products SET title=?, type=?, image_url=?, description=?, detail=?, price=?, is_active=?, updated_at=NOW() WHERE id=?`,
      [
        title,
        type,
        image_url,
        description,
        detail,
        Number(price ?? 0),
        activeVal,
        id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("상품 수정 오류:", err);
    res.status(500).json({ success: false, message: "수정 실패" });
  }
});
router.post("/", authenticateToken, adminOnly, async (req, res) => {
  const { title, type, image_url, description, detail, price, is_active } =
    req.body;
  console.log("📥 [POST] type =", type);
  console.log("📥 typeof =", typeof type);
  console.log("📥 length =", type?.length);
  console.log("📥 전체 req.body =", req.body);

  if (!title || !type) {
    return res.status(400).json({ success: false, message: "필수 항목 누락" });
  }

  try {
    await pool.execute(
      `INSERT INTO products (title, type, image_url, description, detail, price, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, type, image_url, description, detail, price || 0, is_active ?? 1]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("상품 등록 오류:", err);
    res.status(500).json({ success: false, message: "등록 실패" });
  }
});
module.exports = router;
