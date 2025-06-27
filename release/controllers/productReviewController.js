const db = require("../config/db");
const Review = require("../models/review.model");

// ✅ 상품별 후기 조회
exports.getReviewsByProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const reviews = await Review.findByProductId(productId);
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("리뷰 조회 오류:", err);
    res
      .status(500)
      .json({ success: false, message: "리뷰를 불러올 수 없습니다." });
  }
};

// ✅ 후기 작성 – 로그인 + 결제한 유저만 허용
exports.createReview = async (req, res) => {
  const userId = req.user?.id;
  const productId = req.params.id;
  const { rating, comment } = req.body;

  try {
    // 결제 여부 확인
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

    // 후기 저장
    await Review.create({
      user_id: userId,
      product_id: productId,
      rating,
      comment,
    });

    res.status(201).json({ success: true, message: "후기가 등록되었습니다." });
  } catch (err) {
    console.error("후기 작성 오류:", err);
    res.status(500).json({ success: false, message: "후기 작성 중 오류 발생" });
  }
};
console.log("🔥 컨트롤러 export 확인:", Object.keys(exports));
exports.updateReview = async (req, res) => {
  const userId = req.user?.id;
  const reviewId = req.params.reviewId;
  const { rating, comment } = req.body;

  try {
    // 작성자 검증
    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
      [reviewId, userId]
    );
    if (rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "수정 권한이 없습니다." });
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
exports.deleteReview = async (req, res) => {
  const userId = req.user?.id;
  const reviewId = req.params.reviewId;

  try {
    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
      [reviewId, userId]
    );
    if (rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "삭제 권한 없음" });
    }

    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);

    return res.json({ success: true, message: "후기 삭제 완료" });
  } catch (err) {
    console.error("❌ 후기 삭제 오류:", err);
    res.status(500).json({ success: false, message: "후기 삭제 실패" });
  }
};
