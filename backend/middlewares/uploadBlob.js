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

    for (const file of req.files) {
      const blobName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      uploadedUrls.push(blockBlobClient.url);
    }

    req.uploadedImageUrls = uploadedUrls; // ✅ 다음 미들웨어/컨트롤러에서 사용
    next();
  } catch (error) {
    console.error("❌ Azure Blob upload error:", error.message);
    res.status(500).json({ error: "Blob upload failed" });
  }
};

module.exports = { upload, uploadToBlob };
