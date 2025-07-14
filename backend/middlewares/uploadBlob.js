const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

let containerClient = null;
if (AZURE_STORAGE_CONNECTION_STRING) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
} else {
  console.warn("⚠️ AZURE_STORAGE_CONNECTION_STRING is not set. Blob upload disabled.");
}

const uploadToBlob = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(); // 첨부 이미지 없는 경우도 허용
    }

    if (!containerClient) {
      return res.status(503).json({ error: "Blob upload not configured" });
    }

    const uploadedUrls = [];

    const sharp = require("sharp");

for (const file of req.files) {
  // 1) 원본 업로드
  const originalBlobName = `${Date.now()}-${uuidv4()}-original-${file.originalname}`;
  const originalBlockBlobClient = containerClient.getBlockBlobClient(originalBlobName);
  await originalBlockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  // 2) 썸네일(WebP, 400px 가로, 80% 품질)
  const thumbBuffer = await sharp(file.buffer)
    .resize({ width: 400 }) // 썸네일 가로 크기 400px
    .webp({ quality: 80 })  // webp로 변환
    .toBuffer();

  const thumbBlobName = `${Date.now()}-${uuidv4()}-thumb-${file.originalname}.webp`;
  const thumbBlockBlobClient = containerClient.getBlockBlobClient(thumbBlobName);
  await thumbBlockBlobClient.uploadData(thumbBuffer, {
    blobHTTPHeaders: { blobContentType: "image/webp" },
  });

  // URL 저장: { original, thumbnail } 구조로
  uploadedUrls.push({
    original: originalBlockBlobClient.url,
    thumbnail: thumbBlockBlobClient.url,
  });
}


    req.uploadedImageUrls = uploadedUrls; // ✅ 다음 미들웨어/컨트롤러에서 사용
    next();
  } catch (error) {
    console.error("❌ Azure Blob upload error:", error.message);
    res.status(500).json({ error: "Blob upload failed" });
  }
};

module.exports = { upload, uploadToBlob };
