const path = require("path");

console.log("🔎 NODE_ENV =", process.env.NODE_ENV);
console.log(
  "🔎 envPath (before load) =",
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, ".env.production")
    : path.resolve(__dirname, ".env.local")
);
console.log(
  "🔎 AZURE_STORAGE_CONNECTION_STRING (before dotenv) =",
  JSON.stringify(process.env.AZURE_STORAGE_CONNECTION_STRING)
);

// ✅ 예기치 않은 에러 캐치
console.log("🟢 server.js 진입");
process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});

// production 환경에서는 Azure App Service 환경변수만 사용
if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(__dirname, ".env.local");
  require("dotenv").config({ path: envPath, override: false });
  console.log("✅ .env 로딩됨:", envPath);
} else {
  console.log("✅ production 환경: .env 파일 로드 안 함 (Azure 설정값만 사용)");
}

// ✅ Toss 관련 환경변수 로깅
console.log("🔑 TOSS_SECRET_KEY prefix:", process.env.TOSS_SECRET_KEY?.slice(0, 10));
console.log("🔑 TOSS_SECRET_KEY length:", process.env.TOSS_SECRET_KEY?.length);
console.log("🔑 TOSS_CLIENT_KEY prefix:", process.env.TOSS_CLIENT_KEY?.slice(0, 10));
console.log("🔑 TOSS_CLIENT_KEY length:", process.env.TOSS_CLIENT_KEY?.length);

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
const allowedOrigins = [
  "https://orpconsulting.co.kr",
  "https://www.orpconsulting.co.kr", // www 도메인
  "https://api.orpconsulting.co.kr", // api 서브도메인
  "http://localhost:3000",
];

// ✅ CORS 미들웨어 "최상단" 배치
const corsOptions = {
  origin: (origin, callback) => {
    console.log("📌 CORS 요청 origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn("❌ 차단된 origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-guest-token"],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

// ✅ CORS 미들웨어 "최상단" 배치
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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

// ✅ robots.txt 추가 (API 전체 크롤링 차단)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /");
});

// ✅ API 라우터 등록
console.log("✅ API 라우터 등록 시작");
function loadRouter(p) {
  const mod = require(p);
  const router = mod && mod.default ? mod.default : mod;
  const type = typeof router;
  const keys = mod && typeof mod === "object" ? Object.keys(mod) : [];
  if (type !== "function") {
    console.error(
      `❌ 라우터 로딩 실패: ${p} | type=${type} | keys=${keys.join(",")}`
    );
  } else {
    console.log(`✅ 라우터 OK: ${p}`);
  }
  return router;
}

app.use("/api/admin/schedules", loadRouter("./routes/admin/schedules"));
app.use("/api/admin/products", loadRouter("./routes/admin/products"));
app.use("/api/admin", loadRouter("./routes/admin"));
app.use("/api/user", loadRouter("./routes/user"));
app.use("/api/mypage", loadRouter("./routes/mypage"));
app.use("/api/orders", loadRouter("./routes/order"));
app.use("/api/cart", loadRouter("./routes/cart"));
app.use("/api/education/schedules", loadRouter("./routes/public/schedules"));
app.use("/api/education", loadRouter("./routes/userSchedules"));
app.use("/api/auth", loadRouter("./routes/auth"));
app.use("/api", loadRouter("./routes/productReviews"));
app.use("/api/upload", loadRouter("./routes/upload"));
console.log("✅ API 라우터 등록 완료");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/payments", loadRouter("./routes/payments.public"));

// ✅ favicon 무시
app.use((req, res, next) => {
  if (req.url === "/favicon.ico") return res.status(204).end();
  next();
});

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
