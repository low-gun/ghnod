require("dotenv").config();
const mysql = require("mysql2");

// ✅ Azure 운영 환경용 MySQL 연결 (인증서 없이 SSL만 활성화)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "ghnod-mysql.mysql.database.azure.com",
  user: process.env.DB_USER || "mysqladmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true, // 인증서 경로 없이도 SSL 사용
  },
});

// ✅ 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
  } else {
    console.log("✅ MySQL 연결 성공!");
    connection.release();
  }
});

// ✅ Promise 방식 내보내기
module.exports = pool.promise();
