// ✅ backend/server.js – 통합형 완성본
const path = require("path"); // 이 줄이 dotenv보다 위에 있어야 안전

// ✅ 예기치 않은 에러 캐치
console.log("🟢 server.cjs 진입");
process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});

const envPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, ".env.production")
    : path.resolve(__dirname, ".env.local");


require("dotenv").config({ path: envPath });
console.log("✅ .env 로딩됨:", envPath);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const passport = require("./config/passport");
const next = require("next");

const isDev = process.env.NODE_ENV !== "production";
const nextApp = next({
  dev: isDev,
  dir:
    process.env.NODE_ENV === "production"
      ? path.resolve(".") // 배포 환경: /home/site/wwwroot
      : path.join(__dirname, "../frontend"), // 로컬: backend/server.js → ../frontend/pages
});
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 5001;
const app = express();

console.log("✅ 서버 진입");
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
console.log("✅ CLIENT_URL:", process.env.CLIENT_URL);
console.log("✅ PORT:", PORT);

// ✅ 미들웨어
const trackVisitor = require("./middlewares/trackVisitor");
app.use(trackVisitor);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ CORS 허용 도메인 리스트 추가 (이 줄을 추가)
const allowedOrigins = [
  "https://ghnod.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("📌 CORS 요청 origin:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ 차단된 origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
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
console.log("✅ API 라우터 등록 시작");
app.use("/api/admin/schedules", require("./routes/admin/schedules"));
app.use("/api/admin/products", require("./routes/admin/products")); // ← ✅ 이 줄 추가!
app.use("/api/admin/payments", require("./routes/payment"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));
app.use("/api/mypage", require("./routes/mypage"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/education", require("./routes/userSchedules"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/education/schedules", require("./routes/public/schedules"));
app.use("/api", require("./routes/productReviews"));
app.use("/api/upload", require("./routes/upload")); // ← 이 줄 추가
console.log("✅ API 라우터 등록 완료");
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

app.use("/debug", require("./routes/debug"));
app.use("/api", require("./routes/public/inquiry"));
// ✅ nextApp 준비 및 서버 실행
console.log("✅ nextApp.prepare() 시작");

// ⬇⬇⬇ 여기에 추가
console.log("✅ nextApp 설정 dir:", nextApp.dir);
console.log("✅ 현재 디렉토리:", process.cwd());
console.log("✅ __dirname:", __dirname);

nextApp
  .prepare()
  .then(() => {
    console.log("✅ nextApp 준비 완료");

    app.all("*", (req, res) => {
      return handle(req, res);
    });

    console.log("✅ listen() 호출 전");

    app.listen(PORT, () => {
      console.log(`✅ [Express + Next] 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ nextApp.prepare() 실패:", err);
  });
