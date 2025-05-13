require("dotenv").config();
const mysql = require("mysql2");

// ✅ MySQL 연결 (프라미스 방식으로 설정)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ MySQL 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
  } else {
    console.log("✅ MySQL 연결 성공!");
    connection.release();
  }
});

// ✅ Promise 방식으로 명확히 내보내기
module.exports = pool.promise();
