// backend/middlewares/authMiddleware.js

const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * optionalAuthenticate: 토큰이 없어도 에러 없이 진행
 * - 토큰이 유효하면 req.user = decoded
 * - 토큰이 없거나 유효하지 않으면 req.user = null (비로그인)
 */
const optionalAuthenticate = (req, res, next) => {
  const token =
    req.cookies.accessToken ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  console.log("📌 optionalAuthenticate - 받은 accessToken:", token);

  if (!token) {
    // 비로그인 => 계속 진행
    console.log("❌ optionalAuthenticate - 토큰 없음, 비로그인 간주");
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ optionalAuthenticate - 토큰 검증 성공:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(
      "❌ optionalAuthenticate - 토큰 검증 실패, 비로그인 간주:",
      error.message
    );
    req.user = null;
    next();
  }
};

/**
 * authenticateToken: 토큰이 없거나 유효하지 않으면 401/403
 * - 로그인 전용 라우트에서 사용
 */
const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.accessToken ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  console.log("📌 authenticateToken - 받은 accessToken:", token);

  if (!token) {
    console.log("❌ authenticateToken - 토큰 없음, 접근 거부");
    return res
      .status(401)
      .json({ error: "토큰이 없습니다. 접근이 거부되었습니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ authenticateToken - 토큰 검증 성공:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("❌ authenticateToken - 토큰 검증 실패:", error.message);
    return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
  }
};

/**
 * authenticateAdmin: 관리자 권한 체크 (role='admin')
 * - req.user.id를 DB 조회 후 role 확인
 */
const authenticateAdmin = (req, res, next) => {
  if (!req.user) {
    console.log("❌ authenticateAdmin - 로그인 상태 아님");
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  if (req.user.role !== "admin") {
    console.log("❌ authenticateAdmin - 관리자 권한 없음");
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }

  console.log("✅ authenticateAdmin - 관리자 권한 확인됨");
  next();
};

const adminOnly = (req, res, next) => {
  console.log("✅ adminOnly 실행됨");
  console.log("req.user:", req.user); // 🔍 실제 user 객체 로그
  if (req.user?.role === "admin") {
    return next();
  }
  console.log("❌ adminOnly - 관리자 권한 없음");
  return res.status(403).json({ success: false, message: "관리자 권한 필요" });
};

module.exports = {
  optionalAuthenticate,
  authenticateToken,
  authenticateAdmin,
  adminOnly,
};
