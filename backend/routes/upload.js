// 📄 backend/routes/upload.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "파일 없음" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: filePath });
});

module.exports = router;
