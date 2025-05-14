// ✅ backend/server.js – 통합형 완성본
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const passport = require("./config/passport");
const path = require("path");
const next = require("next"); // ✅ 추가

const isDev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev: isDev, dir: path.join(__dirname, "../frontend") });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 5001;
const app = express();

// ✅ 미들웨어
const trackVisitor = require("./middlewares/trackVisitor");
app.use(trackVisitor);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(passport.initialize());

// ✅ 요청 로깅
app.use((req, res, next) => {
  console.log(`📌 요청: ${req.method} ${req.url}`);
  next();
});

// ✅ API 라우터 등록
app.use("/api/admin/schedules", require("./routes/admin/schedules"));
app.use("/api/admin/payments", require("./routes/payment"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));
app.use("/api/mypage", require("./routes/mypage"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/education", require("./routes/userSchedules"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/schedules", require("./routes/public/schedules"));
app.use("/api", require("./routes/productReviews"));

// ✅ DB 연결 테스트용
app.get("/test-db", async (req, res) => {
  console.log("📌 /test-db 요청 도착");
  try {
    const [rows] = await db.query("SELECT '✅ DB 연결 테스트 성공' AS message");
    res.json(rows[0]);
  } catch (error) {
    console.error("❌ DB 연결 오류:", error);
    res.status(500).json({ error: "DB 연결 실패" });
  }
});

// ✅ favicon 무시
app.use((req, res, next) => {
  if (req.url === "/favicon.ico") return res.status(204).end();
  next();
});

console.log("✅ 서버 진입");
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
console.log("✅ CLIENT_URL:", process.env.CLIENT_URL);
console.log("✅ PORT:", PORT);

nextApp
  .prepare()
  .then(() => {
    console.log("✅ nextApp 준비 완료");

    app.all("*", (req, res) => {
      return handle(req, res);
    });

    app.listen(PORT, () => {
      console.log(`✅ [Express + Next] 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ nextApp.prepare() 실패:", err);
  });
