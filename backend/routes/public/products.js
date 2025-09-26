const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const serverTiming = require("../../middlewares/serverTiming");

// ✅ 공개용 상품 목록 조회
router.get("/public", serverTiming, async (req, res) => {
  let { category, type, sort = "created_at", order = "desc", limit } = req.query;

  const allowedSort = ["created_at", "updated_at", "price", "title"];
  const sortField = allowedSort.includes(sort) ? sort : "created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";

  let limitNum = Number.parseInt(limit ?? "200", 10);
  if (!Number.isFinite(limitNum)) limitNum = 200;
  limitNum = Math.min(Math.max(limitNum, 1), 500);

  try {
    let sql = `
      SELECT
        id, title, category, type, purchase_type,
        description, right_description, price,   -- ✅ 추가
        image_url, thumbnail_url,
        created_at, updated_at
      FROM products
      WHERE is_active = 1
        AND (purchase_type = 'inquiry' OR category <> '공개과정')
    `;
    const vals = [];

    if (category) {
      sql += " AND category = ?";
      vals.push(category);
    }
    if (type) {
      sql += " AND type = ?";
      vals.push(type);
    }

    sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ${limitNum}`;
    const [rows] = await pool.execute(sql, vals);

    // ✅ 각 상품별 태그 조인
    for (const row of rows) {
      const [tagRows] = await pool.execute(
        `SELECT t.name 
           FROM product_tags pt 
           JOIN tags t ON pt.tag_id = t.id 
          WHERE pt.product_id = ?`,
        [row.id]
      );
      row.tags = tagRows.map(r => r.name);
    }

    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, products: rows });

  } catch (err) {
    console.error("❌ 공개 상품 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 단건 조회 (상품 + 연결된 일정 포함)
// ✅ 단건 조회 (상품 + 연결된 일정 포함)
router.get("/:id", serverTiming, async (req, res) => {
  const { id } = req.params;
  try {
    // 상품 기본정보
    const [prodRows] = await pool.execute(
      `SELECT id, title, category, type, purchase_type,
              description, right_description, detail, price,
              image_url, thumbnail_url, is_active,
              created_at, updated_at
       FROM products
       WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (!prodRows.length) {
      return res.status(404).json({ success: false, message: "상품 없음" });
    }

    // 연결된 일정들
    const [schRows] = await pool.execute(
      `SELECT s.id, s.title, s.start_date, s.end_date, s.instructor, s.location,
              s.total_spots, s.booked_spots AS reserved_spots, s.price AS product_price,
              s.is_active
       FROM schedules s
       WHERE s.product_id = ? AND s.is_active = 1`,
      [id]
    );
    

       // ✅ 태그 조회
       const [tagRows] = await pool.execute(
        `SELECT t.name 
           FROM product_tags pt 
           JOIN tags t ON pt.tag_id = t.id 
          WHERE pt.product_id = ?`,
        [id]
      );
      const tags = tagRows.map(r => r.name);
  
      res.set("Cache-Control", "public, max-age=60");
      return res.json({
        success: true,
        product: {
          ...prodRows[0],
          schedules: schRows,
          tags,   // ✅ 태그 배열 포함
        },
      });
  
  } catch (err) {
    console.error("❌ 공개 상품 단건 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 상세 HTML만 조회
router.get("/:id/detail", serverTiming, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT detail FROM products WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "상품 없음" });
    }

    res.set("Cache-Control", "public, max-age=60");
    return res.json({ success: true, detail: rows[0].detail || "" });
  } catch (err) {
    console.error("❌ 공개 상품 상세 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
