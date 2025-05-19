// backend/middlewares/uploadBlob.js
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

// ✅ 연결 문자열이 없으면 앱 실행 시 에러 방지
let containerClient = null;
if (AZURE_STORAGE_CONNECTION_STRING) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
} else {
  console.warn(
    "⚠️ AZURE_STORAGE_CONNECTION_STRING is not set. Blob upload disabled."
  );
}

// ✅ 파일 업로드 미들웨어
const uploadToBlob = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    if (!containerClient) {
      return res.status(503).json({ error: "Blob upload not configured" });
    }

    const blobName = `${Date.now()}-${uuidv4()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    req.file.blobUrl = blockBlobClient.url;
    next();
  } catch (error) {
    console.error("❌ Azure Blob upload error:", error.message);
    res.status(500).json({ error: "Blob upload failed" });
  }
};

module.exports = { upload, uploadToBlob };
