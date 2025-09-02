// backend/routes/public/inquiry.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken } = require("../../middlewares/authMiddleware");

// 상품별 문의 목록 조회
router.get("/products/:productId/inquiries", async (req, res) => {
  const { productId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT id, title, message, answer, is_private, user_id, created_at
       FROM inquiries
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [productId]
    );

    res.json({ success: true, inquiries: rows });
  } catch (err) {
    console.error("문의 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 상품 문의 등록 (회원만 가능)
router.post("/products/:productId/inquiries", async (req, res) => {
  const { productId } = req.params;
  const { user_id, title, message, is_private } = req.body;

  // 비회원 작성 차단
  if (!user_id) {
    return res.status(401).json({
      success: false,
      message: "로그인 후 문의를 작성하실 수 있습니다.",
    });
  }

  if (!title?.trim() || !message?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "제목과 내용을 입력해주세요." });
  }

  try {
    await pool.execute(
      `INSERT INTO inquiries 
       (product_id, user_id, title, message, is_private)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, user_id, title, message, is_private ? 1 : 0]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("문의 등록 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 상품 문의 삭제 (작성자 또는 관리자만)
router.delete(
  "/products/:productId/inquiries/:id",
  authenticateToken,
  async (req, res) => {
    const { productId, id } = req.params;
    const loginUser = req.user; // authenticateToken에서 주입됨

    try {
      // 존재 및 소유자 확인
      const [rows] = await pool.execute(
        `SELECT id, user_id
         FROM inquiries
         WHERE id = ? AND product_id = ?`,
        [id, productId]
      );
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "해당 문의를 찾을 수 없습니다." });
      }

      const ownerId = Number(rows[0].user_id);
      const isAdmin = loginUser?.role === "admin";
      const isOwner = Number(loginUser?.id) === ownerId;

      if (!isAdmin && !isOwner) {
        return res
          .status(403)
          .json({ success: false, message: "삭제 권한이 없습니다." });
      }

      // 삭제
      const [result] = await pool.execute(
        `DELETE FROM inquiries
         WHERE id = ? AND product_id = ?`,
        [id, productId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "삭제할 문의가 없습니다." });
      }

      return res.json({ success: true, deletedId: Number(id) });
    } catch (err) {
      console.error("문의 삭제 오류:", err);
      return res.status(500).json({ success: false, message: "서버 오류" });
    }
  }
);

module.exports = router;
