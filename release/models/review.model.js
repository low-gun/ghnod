const db = require("../config/db");

const Review = {
  findByProductId: async (productId) => {
    const [rows] = await db.query(
      "SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE product_id = ? ORDER BY created_at DESC",
      [productId]
    );
    return rows;
  },
  create: async ({ user_id, product_id, rating, comment }) => {
    await db.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
      [user_id, product_id, rating, comment]
    );
  },
  update: async ({ review_id, rating, comment }) => {
    await db.query(
      "UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?",
      [rating, comment, review_id]
    );
  },
};

module.exports = Review;
