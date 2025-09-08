console.log("🔎 NODE_ENV =", process.env.NODE_ENV);
console.log("🔎 AZURE_STORAGE_CONNECTION_STRING =", JSON.stringify(process.env.AZURE_STORAGE_CONNECTION_STRING));

const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

let upload, uploadToBlob;

// ✅ NODE_ENV가 production일 때만 Azure 분기 실행
if (process.env.NODE_ENV === "production" && AZURE_STORAGE_CONNECTION_STRING) {
  console.log("✅ Azure 업로드 분기 실행됨");
  upload = multer({ storage: multer.memoryStorage() });

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  uploadToBlob = async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        console.warn("⚠️ Azure 업로드 요청에 파일이 없음");
        return next();
      }

      const uploadedUrls = [];
      const sharp = require("sharp");

      for (const file of req.files) {
        console.log("📤 업로드 파일:", file.originalname);

        // original
        const originalBuffer = await sharp(file.buffer).webp({ quality: 90 }).toBuffer();
        const originalBlobName = `${Date.now()}-${uuidv4()}-original-${file.originalname}.webp`;
        const originalClient = containerClient.getBlockBlobClient(originalBlobName);
        await originalClient.uploadData(originalBuffer, {
          blobHTTPHeaders: { blobContentType: "image/webp" },
        });

        // thumbnail
        const thumbBuffer = await sharp(file.buffer)
          .resize({ width: 400 })
          .webp({ quality: 80 })
          .toBuffer();
        const thumbBlobName = `${Date.now()}-${uuidv4()}-thumb-${file.originalname}.webp`;
        const thumbClient = containerClient.getBlockBlobClient(thumbBlobName);
        await thumbClient.uploadData(thumbBuffer, {
          blobHTTPHeaders: { blobContentType: "image/webp" },
        });

        // detail
        const detailBuffer = await sharp(file.buffer)
          .resize({ width: 1200 })
          .webp({ quality: 80 })
          .toBuffer();
        const detailBlobName = `${Date.now()}-${uuidv4()}-detail-${file.originalname}.webp`;
        const detailClient = containerClient.getBlockBlobClient(detailBlobName);
        await detailClient.uploadData(detailBuffer, {
          blobHTTPHeaders: { blobContentType: "image/webp" },
        });

        uploadedUrls.push({
          original: originalClient.url,
          thumbnail: thumbClient.url,
          detail: detailClient.url,
        });
      }

      req.uploadedImageUrls = uploadedUrls;
      return next();
    } catch (error) {
      console.error("❌ Azure Blob upload error:", error.message);
      return res.status(500).json({ error: "Blob upload failed" });
    }
  };
} else {
  console.log("✅ 로컬 업로드 분기 실행됨");
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
        console.warn("⚠️ 로컬 업로드 요청에 파일이 없음");
        return next();
      }

      req.uploadedImageUrls = req.files.map((file) => {
        console.log("📥 로컬 업로드 파일:", file.originalname, "→", file.filename);
        const url = `/uploads/images/${file.filename}`;
        return {
          original: url,
          thumbnail: url,
          detail: url,
        };
      });

      return next();
    } catch (error) {
      console.error("❌ Local upload error:", error.message);
      return res.status(500).json({ error: "Local upload failed" });
    }
  };
}

module.exports = { upload, uploadToBlob };
