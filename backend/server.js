const path = require("path");

// ✅ 예기치 않은 에러 캐치
console.log("🟢 server.js 진입");
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

const PORT = process.env.PORT || 5001;
const app = express();

console.log("✅ 서버 진입");
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
console.log("✅ CLIENT_URL:", process.env.CLIENT_URL);
console.log("✅ PORT:", PORT);

// ✅ CORS 허용 도메인 리스트
const allowedOrigins = ["https://ghnod.vercel.app", "http://localhost:3000"];

// ✅ CORS 미들웨어 "최상단" 배치 + options 핸들러 추가
const corsOptions = {
  origin: (origin, callback) => {
    console.log("📌 CORS 요청 origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn("❌ 차단된 origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅
  allowedHeaders: ["Content-Type", "Authorization", "x-guest-token"], // ✅
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (
      !origin ||
      ["https://ghnod.vercel.app", "http://localhost:3000"].includes(origin)
    ) {
      res.header(
        "Access-Control-Allow-Origin",
        origin || "https://ghnod.vercel.app"
      );
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-guest-token"
      );
      return res.sendStatus(204);
    }
    return res.status(403).send("Not allowed by CORS");
  }
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ 동일 옵션으로 응답
const trackVisitor = require("./middlewares/trackVisitor");
app.use(trackVisitor);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
app.use("/api/admin/products", require("./routes/admin/products"));
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
app.use("/api/upload", require("./routes/upload"));
console.log("✅ API 라우터 등록 완료");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// ✅ (선택) /api가 아닌 나머지 경로는 404 JSON 응답
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API 전용 서버입니다. 프론트는 Vercel에서 확인하세요.",
      path: req.path,
    });
  }
  next();
});

console.log("✅ 모든 미들웨어/라우터 등록 완료");

// ✅ API 서버만 listen
app.listen(PORT, () => {
  console.log(`✅ [Express API] 서버 실행 중: http://localhost:${PORT}`);
});
