const express = require("express");
const router = express.Router();
const pool = require("../../config/db");

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

  // ✅ 비회원 작성 차단
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

module.exports = router;
