const express = require("express");
const router = express.Router();
const controller = require("../controllers/productReviewController");
const auth = require("../middlewares/authMiddleware");
const { upload, uploadToBlob } = require("../middlewares/uploadBlob"); // ✅ 여기서 불러온 걸로만 사용

// 후기 목록 조회
router.get("/products/:id/reviews", controller.getReviewsByProduct);

// 후기 작성 가능 여부 확인
router.get(
  "/products/:id/reviews/check-eligible",
  auth.authenticateToken,
  controller.checkReviewEligibility
);

// 후기 등록 (이미지 최대 10장 첨부 가능)
router.post(
  "/products/:id/reviews",
  auth.authenticateToken,
  upload.array("images", 10),
  uploadToBlob,
  controller.createReview
);

// 후기 수정
router.put(
  "/products/:productId/reviews/:reviewId",
  auth.authenticateToken,
  controller.updateReview
);

// 후기 삭제
router.delete(
  "/products/:id/reviews/:reviewId",
  auth.authenticateToken,
  controller.deleteReview
);

module.exports = router;
