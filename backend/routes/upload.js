const express = require("express");
const router = express.Router();
const { upload, uploadToBlob } = require("../middlewares/uploadBlob");

router.post(
  "/image",
  upload.array("files"),     // input name="files"로 여러 장
  uploadToBlob,
  (req, res) => {
    if (!req.uploadedImageUrls || req.uploadedImageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "업로드 실패" });
    }
    res.json({
      success: true,
      urls: req.uploadedImageUrls,  // [{ original, thumbnail }, ...]
    });
  }
);

module.exports = router;
