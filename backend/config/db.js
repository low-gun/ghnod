require("dotenv").config();
const mysql = require("mysql2");

const isProduction = process.env.NODE_ENV === "production";

const pool = mysql.createPool({
  host:
    process.env.DB_HOST ||
    (isProduction ? "ghnod-mysql.mysql.database.azure.com" : "127.0.0.1"),
  user: process.env.DB_USER || "root", // 로컬은 보통 root
  password: process.env.DB_PASSWORD || "", // 로컬은 비번 없을 수도 있음
  database: process.env.DB_NAME || "ghnod_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  const fs = require("fs");
const path = require("path");

ssl: isProduction
  ? {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, "../uploads/certificates/backgrounds/DigiCertGlobalRootCA.crt.pem"))
    }
  : undefined,

});

// ✅ 연결 테스트 로그
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
  } else {
    console.log("✅ MySQL 연결 성공!");
    connection.release();
  }
});

module.exports = pool.promise();
