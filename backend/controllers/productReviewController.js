// backend/controllers/productReviewController.js
const db = require("../config/db");
const Review = require("../models/review.model");

// ✅ 상품별 후기 조회
exports.getReviewsByProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const [rows] = await db.query(
      // thumbnail_url까지 포함해서 조회
`SELECT r.id AS review_id, r.user_id, u.username AS username, r.rating, r.comment, r.created_at,
ri.image_url, ri.thumbnail_url
FROM reviews r
JOIN users u ON r.user_id = u.id
LEFT JOIN review_images ri ON r.id = ri.review_id
WHERE r.product_id = ?
ORDER BY r.created_at DESC`,
      [productId]
    );

    const reviews = [];
    const reviewMap = new Map();

    for (const row of rows) {
      if (!reviewMap.has(row.review_id)) {
        const review = {
          id: row.review_id,
          user_id: row.user_id,
          username: row.username,
          rating: row.rating,
          comment: row.comment,
          created_at: row.created_at,
          images: [],
        };
        reviewMap.set(row.review_id, review);
        reviews.push(review);
      }

      // 이미지: original/thumbnail 같이 넘기기
if (row.image_url && row.thumbnail_url) {
  reviewMap.get(row.review_id).images.push({
    original: row.image_url,
    thumbnail: row.thumbnail_url,
  });
}
    }

    res.json({ success: true, reviews });
  } catch (err) {
    console.error("리뷰 조회 오류:", err);
    res.status(500).json({ success: false, message: "리뷰를 불러올 수 없습니다." });
  }
};


// ✅ 후기 작성 – 로그인 + 결제한 유저만 허용
exports.createReview = async (req, res) => {
  const userId = req.user?.id;
  const productId = req.params.id;
  const { rating, comment } = req.body;

  try {
    // 구매 여부 확인
    const [check] = await db.query(
      `SELECT 1
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN schedules s ON oi.schedule_id = s.id
       WHERE o.user_id = ? AND s.product_id = ? AND o.order_status = 'paid'
       LIMIT 1`,
      [userId, productId]
    );

    if (check.length === 0) {
      return res.status(403).json({
        success: false,
        message: "구매한 유저만 후기를 작성할 수 있습니다.",
      });
    }

    // 후기 등록
    const result = await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [userId, productId, rating, comment || null]
    );

    const reviewId = result[0].insertId;

    // 이미지 저장
if (Array.isArray(req.uploadedImageUrls)) {
  for (const imgObj of req.uploadedImageUrls) {
    // imgObj = { original, thumbnail }
    await db.query(
      `INSERT INTO review_images (review_id, image_url, thumbnail_url) VALUES (?, ?, ?)`,
      [reviewId, imgObj.original, imgObj.thumbnail]
    );
  }
}

    return res.status(201).json({ success: true, message: "후기가 등록되었습니다." });
  } catch (err) {
    console.error("❌ 후기 작성 오류:", err);
    return res.status(500).json({ success: false, message: "후기 작성 중 오류 발생" });
  }
};

// ✅ 후기 수정
exports.updateReview = async (req, res) => {
  const userId = req.user?.id;
  const reviewId = req.params.reviewId;
  const { rating, comment } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
      [reviewId, userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "수정 권한이 없습니다." });
    }

    await Review.update({
      review_id: reviewId,
      rating,
      comment,
      updated_at: new Date(),
    });

    return res.json({ success: true, message: "후기 수정 완료" });
  } catch (err) {
    console.error("❌ 후기 수정 오류:", err);
    res.status(500).json({ success: false, message: "후기 수정 실패" });
  }
};

// ✅ 후기 삭제
exports.deleteReview = async (req, res) => {
  const userId = req.user?.id;
  const reviewId = req.params.reviewId;

  try {
    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
      [reviewId, userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "삭제 권한 없음" });
    }

    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);

    return res.json({ success: true, message: "후기 삭제 완료" });
  } catch (err) {
    console.error("❌ 후기 삭제 오류:", err);
    res.status(500).json({ success: false, message: "후기 삭제 실패" });
  }
};

// ✅ 후기 작성 가능 여부 확인
exports.checkReviewEligibility = async (req, res) => {
  const userId = req.user?.id;
  const productId = req.params.id;
  console.log("✅ checkReviewEligibility 요청:", { userId, productId });

  try {
    const [rows] = await db.query(
      `SELECT 1
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN schedules s ON oi.schedule_id = s.id
       WHERE o.user_id = ? AND s.product_id = ? AND o.order_status = 'paid'
       LIMIT 1`,
      [userId, productId]
    );

    const eligible = rows.length > 0;
    return res.json({ success: true, eligible });
  } catch (err) {
    console.error("후기 작성 가능 여부 조회 오류:", err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};
