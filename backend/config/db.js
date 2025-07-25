require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

// ✅ 필수 환경변수 누락 검사
const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ 환경변수 누락: ${key}`);
    process.exit(1);
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isProduction
    ? {
        rejectUnauthorized: true,
        ca: fs.readFileSync(
          path.join(__dirname, "../certs/DigiCertGlobalRootCA.crt")
        ),
      }
    : undefined,
});

// ✅ 연결 테스트 로그
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL 연결 실패!");
    console.error("📌 연결 설정:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      ssl: isProduction ? "enabled" : "disabled",
    });
    console.error("📌 상세 오류:", err);
  } else {
    console.log("✅ MySQL 연결 성공!");
    connection.release();
  }
});

module.exports = pool.promise();
