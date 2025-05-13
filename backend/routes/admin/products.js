const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../../middlewares/authMiddleware");

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
      filtered = filtered.filter(
        (p) => new Date(p.created_at) <= new Date(endDate)
      );
    }

    // 🔁 정렬
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];

      if (typeof aVal === "string") {
        return order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else if (typeof aVal === "number" || aVal instanceof Date) {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // 📄 페이징
    res.json({
      success: true,
      products: sorted, // 전체 데이터
      totalCount: filtered.length,
    });
  } catch (err) {
    console.error("❌ 상품 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
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

// 선택 상품 삭제
router.delete("/", authenticateToken, adminOnly, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "삭제할 ID가 없습니다." });
  }

  try {
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `DELETE FROM products WHERE id IN (${placeholders})`;
    await pool.execute(sql, ids);

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ 상품 삭제 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
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

  try {
    await pool.execute(
      `UPDATE products SET title=?, type=?, image_url=?, description=?, detail=?, price=?, is_active=?, updated_at=NOW() WHERE id=?`,
      [title, type, image_url, description, detail, price, is_active || 1, id]
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
