const express = require("express");
const router = express.Router();
const { upload, uploadToBlob } = require("../middlewares/uploadBlob");

router.post("/", upload.single("file"), uploadToBlob, (req, res) => {
  if (!req.file || !req.file.blobUrl) {
    return res.status(500).json({ success: false, message: "업로드 실패" });
  }

  res.json({
    success: true,
    url: req.file.blobUrl, // 🔥 Azure Blob URL 반환
  });
});

module.exports = router;
