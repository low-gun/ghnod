// backend/middlewares/upload.js
const multer = require("multer");

// 파일 저장 경로 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 파일을 'uploads/' 폴더에 저장
  },
  filename: (req, file, cb) => {
    // 파일명에 타임스탬프를 추가하여 중복되지 않게 설정
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// 파일 크기 및 유형 제한 (예: 최대 10MB, 특정 파일 유형만 허용)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true); // 허용된 파일만 업로드
  } else {
    cb(new Error("지원하지 않는 파일 형식입니다."), false);
  }
};

// multer 설정
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 최대 파일 크기 10MB
  fileFilter: fileFilter,
});

module.exports = upload;
