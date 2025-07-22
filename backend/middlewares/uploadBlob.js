const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

let upload, uploadToBlob;

if (AZURE_STORAGE_CONNECTION_STRING) {
  // 운영 환경: Azure Blob Storage 업로드
  upload = multer({ storage: multer.memoryStorage() });

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  uploadToBlob = async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }
      console.log("🔵 req.files.length:", req.files.length);
      const uploadedUrls = [];
      const sharp = require("sharp");

      for (const file of req.files) {
        // 1. 원본 업로드
        const originalBlobName = `${Date.now()}-${uuidv4()}-original-${file.originalname}`;
        const originalBlockBlobClient = containerClient.getBlockBlobClient(originalBlobName);
        await originalBlockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        // 2. 썸네일(WebP, 400px)
        const thumbBuffer = await sharp(file.buffer)
          .resize({ width: 400 })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbBlobName = `${Date.now()}-${uuidv4()}-thumb-${file.originalname}.webp`;
        const thumbBlockBlobClient = containerClient.getBlockBlobClient(thumbBlobName);
        await thumbBlockBlobClient.uploadData(thumbBuffer, {
          blobHTTPHeaders: { blobContentType: "image/webp" },
        });

        uploadedUrls.push({
          original: originalBlockBlobClient.url,
          thumbnail: thumbBlockBlobClient.url,
        });
      }
      console.log("🟢 uploadedUrls.length:", uploadedUrls.length);

      req.uploadedImageUrls = uploadedUrls;
      next();
    } catch (error) {
      console.error("❌ Azure Blob upload error:", error.message);
      res.status(500).json({ error: "Blob upload failed" });
    }
  };

} else {
  // 로컬 개발: uploads/images 폴더에 저장
  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, "..", "uploads", "images");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
    },
  });
  upload = multer({ storage: localStorage });

  uploadToBlob = async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      // 파일 경로를 URL처럼 반환 (개발환경)
      req.uploadedImageUrls = req.files.map((file) => ({
        original: `/uploads/images/${file.filename}`,
        thumbnail: `/uploads/images/${file.filename}`, // 로컬은 썸네일 따로 생성 안 함
      }));
      next();
    } catch (error) {
      console.error("❌ Local upload error:", error.message);
      res.status(500).json({ error: "Local upload failed" });
    }
  };
}

module.exports = { upload, uploadToBlob };
