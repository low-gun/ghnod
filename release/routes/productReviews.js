const express = require("express");
const router = express.Router();
const controller = require("../controllers/productReviewController");
const auth = require("../middlewares/authMiddleware"); // ✅ 경로 OK

router.get("/products/:id/reviews", controller.getReviewsByProduct);

router.post(
  "/products/:id/reviews",
  auth.authenticateToken,
  controller.createReview
);

router.put(
  "/products/:productId/reviews/:reviewId",
  auth.authenticateToken,
  controller.updateReview
);

router.delete(
  "/products/:id/reviews/:reviewId",
  auth.authenticateToken, // ✅ 중복된 import 제거
  controller.deleteReview // ✅ controller에서 export
);

module.exports = router;
