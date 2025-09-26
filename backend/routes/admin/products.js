const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../../middlewares/authMiddleware");
const adminController = require("../../controllers/adminController");
const { upload, uploadToBlob } = require("../../middlewares/uploadBlob");

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
    const [rows] = await pool.execute(`
      SELECT
  id,
  title,
  type,
  category,
  price,
  is_active,
  created_at,
  updated_at,
  image_url,
  thumbnail_url,
  purchase_type   -- ✅ 추가
FROM products
    `);
    
    let filtered = rows;

    // 🗂️ 상품 분류 필터 (카테고리 + 유형)
if (req.query.category && req.query.category !== "전체") {
  filtered = filtered.filter((p) => p.category === req.query.category);
}

if (type && type !== "전체") {
  filtered = filtered.filter((p) => p.type === type);
}

   // 🔍 검색 필터 (searchQuery도 허용)
const searchVal = req.query.search || req.query.searchQuery;
if (searchField && searchVal) {
  filtered = filtered.filter((p) => {
    const value = p[searchField];
    if (typeof value === "string") {
      return value.toLowerCase().includes(searchVal.toLowerCase());
    } else if (typeof value === "number") {
      return value === Number(searchVal);
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

    // 🔁 정렬 (숫자/날짜 보강)
    const toTime = (v) => (v ? new Date(v).getTime() : NaN);
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];

      // 날짜
      if (sort === "created_at" || sort === "updated_at") {
        const at = toTime(aVal);
        const bt = toTime(bVal);
        if (!Number.isNaN(at) && !Number.isNaN(bt)) {
          return order === "asc" ? at - bt : bt - at;
        }
      }

      // 숫자
      if (sort === "id" || sort === "price") {
        const an = Number(aVal);
        const bn = Number(bVal);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) {
          return order === "asc" ? an - bn : bn - an;
        }
      }

      // 문자열
      const as = (aVal ?? "").toString();
      const bs = (bVal ?? "").toString();
      return order === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });

    // 📄 페이징
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
      `SELECT category, type, COUNT(*) AS count
FROM products
WHERE type IS NOT NULL AND type <> ''
GROUP BY category, type
ORDER BY category, type`
    );
    return res.json({
      success: true,
      totalCount,
      byCategoryType: rows.map((r) => ({
        category: r.category,
        type: r.type,
        count: Number(r.count),
      })),
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
router.delete("/", authenticateToken, adminOnly, adminController.deleteProducts);

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

// 상품 단건 조회 (태그 포함)
router.get("/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT p.*,
             GROUP_CONCAT(t.name) AS tags
      FROM products p
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "상품 없음" });
    }

    const product = rows[0];
    product.tags = product.tags ? product.tags.split(",") : []; // 문자열 → 배열 변환

    res.json({ success: true, product });
  } catch (err) {
    console.error("상품 단건 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 상품 수정 (Blob 업로드 경유)
router.put(
  "/:id",
  authenticateToken,
  adminOnly,
  upload.array("images", 1),
  uploadToBlob,
  async (req, res) => {
    const { id } = req.params;
    const { title, type, image_url, description, detail, price, is_active, purchase_type } =
      req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: "필수 항목 누락" });
    }

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

      // 업로드 파일 우선
      const uploadedUrl =
        Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
          ? req.uploadedImageUrls[0].original
          : null;

      // data:image 차단
      const isDataUrl = typeof image_url === "string" && /^data:image\//i.test(image_url);
      if (!uploadedUrl && isDataUrl) {
        return res.status(400).json({
          success: false,
          code: "DATA_IMAGE",
          message: "data:image URL 차단. /upload/image API를 통해 업로드된 URL을 사용하세요.",
        });
      }

      // 최종 결정
      const resolvedImageUrl = uploadedUrl || (image_url || null);

      const ALLOWED_CATEGORIES = ["진단","조직개발","리더십개발","공개과정"];
if (!title || !type || !req.body.category || !ALLOWED_CATEGORIES.includes(req.body.category)) {
  return res.status(400).json({ success: false, message: "잘못된 카테고리 값" });
}

      
await pool.execute(
  `UPDATE products
     SET title=?, type=?, category=?, image_url=?, description=?, right_description=?, detail=?, price=?, is_active=?, purchase_type=?, updated_at=NOW()
   WHERE id=?`,
  [
    title,
    type,
    req.body.category,
    resolvedImageUrl,
    description,
    req.body.right_description || null,
    detail,
    price === "" || price === undefined ? null : Number(price),
    activeVal,
    purchase_type || "buy",
    id,
  ]
);


// ✅ 태그 업데이트
if (Array.isArray(req.body.tags)) {
  // 기존 태그 제거
  await pool.execute("DELETE FROM product_tags WHERE product_id = ?", [id]);

  for (const tagName of req.body.tags) {
    // 태그 마스터 확인 → 없으면 새로 생성
    const [tagRows] = await pool.execute("SELECT id FROM tags WHERE name = ?", [tagName]);
    let tagId = tagRows[0]?.id;
    if (!tagId) {
      const [insertRes] = await pool.execute("INSERT INTO tags (name) VALUES (?)", [tagName]);
      tagId = insertRes.insertId;
    }
    // 연결 테이블에 삽입
    await pool.execute("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [id, tagId]);
  }
}

res.json({ success: true });

    } catch (err) {
      console.error("상품 수정 오류:", err);
      res.status(500).json({ success: false, message: "수정 실패" });
    }
  }
);

// 상품 등록 (Blob 업로드 경유)
router.post(
  "/",
  authenticateToken,
  adminOnly,
  upload.array("images", 1),
  uploadToBlob,
  async (req, res) => {
    const { title, type, image_url, description, detail, price, is_active, purchase_type } =
      req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: "필수 항목 누락" });
    }

    try {
      // 업로드 파일 우선
      const uploadedUrl =
        Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
          ? req.uploadedImageUrls[0].original
          : null;

      // data:image 차단
      const isDataUrl = typeof image_url === "string" && /^data:image\//i.test(image_url);
      if (!uploadedUrl && isDataUrl) {
        return res.status(400).json({
          success: false,
          code: "DATA_IMAGE",
          message: "data:image URL 차단. /upload/image API를 통해 업로드된 URL을 사용하세요.",
        });
      }

      // 최종 결정
      const resolvedImageUrl = uploadedUrl || (image_url || null);

      const ALLOWED_CATEGORIES = ["진단","조직개발","리더십개발","공개과정"];
if (!title || !type || !req.body.category || !ALLOWED_CATEGORIES.includes(req.body.category)) {
  return res.status(400).json({ success: false, message: "잘못된 카테고리 값" });
}
      
const [result] = await pool.execute(
  `INSERT INTO products (title, type, category, image_url, description, right_description, detail, price, is_active, purchase_type, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    title,
    type,
    req.body.category,
    resolvedImageUrl,
    description,
    req.body.right_description || null,
    detail,
    price === "" || price === undefined ? null : Number(price),
    is_active ?? 1,
    purchase_type || "buy",
  ]
);
const productId = result.insertId;

// ✅ 태그 저장
if (Array.isArray(req.body.tags)) {
  for (const tagName of req.body.tags) {
    const [tagRows] = await pool.execute("SELECT id FROM tags WHERE name = ?", [tagName]);
    let tagId = tagRows[0]?.id;
    if (!tagId) {
      const [insertRes] = await pool.execute("INSERT INTO tags (name) VALUES (?)", [tagName]);
      tagId = insertRes.insertId;
    }
    await pool.execute("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, tagId]);
  }
}

res.json({ success: true, id: productId });

    } catch (err) {
      console.error("상품 등록 오류:", err);
      res.status(500).json({ success: false, message: "등록 실패" });
    }
  }
);


// 상품 부분 수정 (변경된 필드만 반영, Blob 업로드 대응)
// 상품 부분 수정 (변경된 필드만 반영, Blob 업로드 대응)
router.patch(
  "/:id",
  authenticateToken,
  adminOnly,
  upload.array("images", 1),
  uploadToBlob,
  async (req, res) => {
    const { id } = req.params;
    const incoming = req.body || {};
    try {
      // 1) 업로드 파일 우선
      const uploadedUrl =
        Array.isArray(req.uploadedImageUrls) && req.uploadedImageUrls[0]?.original
          ? req.uploadedImageUrls[0].original
          : null;

      // 2) data:image 차단 (업로드 없고 body에 dataURL 온 경우)
      const isDataUrl =
        typeof incoming.image_url === "string" && /^data:image\//i.test(incoming.image_url);
      if (!uploadedUrl && isDataUrl) {
        return res.status(400).json({
          success: false,
          code: "DATA_IMAGE",
          message:
            "data:image URL은 허용하지 않습니다. /upload/image API로 업로드된 공개 URL을 사용하세요.",
        });
      }

      // 3) 최종 image_url 결정
      //    - 업로드가 있으면 그 값 사용
      //    - body에 image_url이 존재하면 그 값(빈문자열 포함) 사용
      //    - body에 image_url 키가 없으면 undefined (SET 제외)
      const resolvedImageUrl =
        uploadedUrl !== null
          ? uploadedUrl
          : incoming.image_url !== undefined
          ? incoming.image_url || null // 빈 문자열 등은 null로 저장
          : undefined; // 전달 안 된 경우

      // 4) 숫자/불린 보정
      const pricePatched =
        incoming.price === "" || incoming.price === undefined
          ? undefined // 전달 안 되었으면 SET 제외
          : incoming.price === null
          ? null
          : Number(incoming.price);

      const activePatched =
        incoming.is_active === undefined
          ? undefined
          : (String(incoming.is_active) === "1" ||
             String(incoming.is_active).toLowerCase() === "true")
          ? 1
          : 0;

      // 5) 카테고리 유효성 검사
      if (
        incoming.category &&
        !["진단", "조직개발", "리더십개발", "공개과정"].includes(incoming.category)
      ) {
        return res.status(400).json({ success: false, message: "잘못된 카테고리 값" });
      }

      // 6) 동적 업데이트 대상 구성 (undefined인 키는 제외)
      const allowed = {
        title: incoming.title,
        type: incoming.type,
        category: incoming.category,
        description: incoming.description,
        right_description: incoming.right_description, // ✅ 추가
        detail: incoming.detail,
        purchase_type: incoming.purchase_type,
        price: pricePatched,
        is_active: activePatched,
      };

      if (resolvedImageUrl !== undefined) {
        allowed.image_url = resolvedImageUrl;
      }

      const keys = Object.keys(allowed).filter((k) => allowed[k] !== undefined);

      // 7) products 업데이트 (변경된 필드가 있는 경우)
      if (keys.length > 0) {
        const setClauses = keys.map((k) => `${k} = ?`);
        const values = keys.map((k) => allowed[k]);
        setClauses.push("updated_at = NOW()");
        await pool.execute(
          `UPDATE products SET ${setClauses.join(", ")} WHERE id = ?`,
          [...values, id]
        );
      }

      // 8) ✅ 태그 업데이트 (PUT과 동일한 로직 추가)
      if (Array.isArray(incoming.tags)) {
        // 기존 태그 제거
        await pool.execute("DELETE FROM product_tags WHERE product_id = ?", [id]);

        for (const tagName of incoming.tags) {
          const [tagRows] = await pool.execute("SELECT id FROM tags WHERE name = ?", [tagName]);
          let tagId = tagRows[0]?.id;
          if (!tagId) {
            const [insertRes] = await pool.execute("INSERT INTO tags (name) VALUES (?)", [tagName]);
            tagId = insertRes.insertId;
          }
          await pool.execute(
            "INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)",
            [id, tagId]
          );
        }
      }

      // 9) products도 없고 tags도 없으면 변경 없음 처리
      if (keys.length === 0 && !Array.isArray(incoming.tags)) {
        return res.status(400).json({ success: false, message: "변경할 필드가 없습니다." });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ 상품 부분 수정 오류:", err);
      return res.status(500).json({ success: false, message: "부분 수정 실패" });
    }
  }
);

module.exports = router;
