require("dotenv").config();
const mysql = require("mysql2");

// ✅ Azure Flexible Server용 MySQL 연결 테스트
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "ghnod-mysql.mysql.database.azure.com",
  user: process.env.DB_USER || "mysqladmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "ghnod",
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: true, // 인증서 검증 (Azure 기본값)
  },
});

connection.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
  } else {
    console.log("✅ MySQL 연결 성공!");
  }
  connection.end();
});
