// ✅ backend/server.js – 정리 완료본
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const passport = require("./config/passport");

// 라우터 불러오기
const adminRoutes = require("./routes/admin"); // 💡 필요 시 /api/admin 이하 공통 처리용
const schedulesRouter = require("./routes/admin/schedules"); // ✅ schedules 명확히 분리
const paymentAPIRoutes = require("./routes/payment");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const mypageRoutes = require("./routes/mypage");
const orderRoutes = require("./routes/order");
const cartRoutes = require("./routes/cart");
const userSchedulesRouter = require("./routes/userSchedules");
const publicSchedulesRouter = require("./routes/public/schedules"); // ✅ 추가
const PORT = process.env.PORT || 5001;
const app = express();
const productReviewsRouter = require("./routes/productReviews");
const trackVisitor = require("./middlewares/trackVisitor");
// 미들웨어 설정
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

// 요청 로깅
app.use((req, res, next) => {
  console.log(`📌 요청: ${req.method} ${req.url}`);
  next();
});

// ✅ 관리자용 API 등록
app.use("/api/admin/schedules", schedulesRouter); // ✔ schedules 단독 등록
app.use("/api/admin/payments", paymentAPIRoutes); // ✔ payments
app.use("/api/admin", adminRoutes); // ✔ 기타 admin 전용 API

// ✅ 일반 사용자 API 등록
app.use("/api/user", userRouter);
app.use("/api/mypage", mypageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
console.log("✅ [server.js] /api/cart 라우터 등록 완료");
app.use("/api/education", userSchedulesRouter);
app.use("/api/auth", authRouter);
app.use("/api/schedules", publicSchedulesRouter); // ✅ 추가
app.use("/api", require("./routes/productReviews")); // ✅ 상품후기 라우터 추가

// ✅ DB 연결 테스트용 endpoint
app.get("/test-db", async (req, res) => {
  console.log("📌 /test-db 요청 도착");
  try {
    const [rows] = await db.query("SELECT '✅ DB 연결 테스트 성공' AS message");
    console.log("📌 DB 응답:", rows);
    res.json(rows[0]);
  } catch (error) {
    console.error("❌ DB 연결 오류:", error);
    res.status(500).json({ error: "DB 연결 실패" });
  }
});

// ✅ uploads 폴더 static 서비스 추가
const path = require("path");

// uploads 경로를 static으로 노출
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// favicon 요청 무시
app.use((req, res, next) => {
  if (req.url === "/favicon.ico") {
    return res.status(204).end();
  }
  next();
});

app.listen(PORT, () => {
  console.log(`✅ [Express] 서버 실행 중: http://localhost:${PORT}`);
});
