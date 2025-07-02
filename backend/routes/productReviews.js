const express = require("express");
const router = express.Router();
const controller = require("../controllers/productReviewController");
const auth = require("../middlewares/authMiddleware");

router.get("/products/:id/reviews", controller.getReviewsByProduct);

router.get(
  "/products/:id/reviews/check-eligible", // ✅ 구매 여부 확인용 GET
  auth.authenticateToken,
  controller.checkReviewEligibility
);

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
  auth.authenticateToken,
  controller.deleteReview
);

module.exports = router;
