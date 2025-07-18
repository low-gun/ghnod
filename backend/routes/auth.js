// backend/routes/auth.js
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const passport = require("passport");
const axios = require("axios");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();
const { parseDeviceInfo } = require("../utils/parseDeviceInfo");
// Google OAuth2 code 처리용 REST API
// backend/routes/auth.js
router.post("/google/callback", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    console.log("[google/callback] code:", code);

    // 1. 토큰 요청
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    console.log("[google/callback] tokenRes.data:", tokenRes.data);
    const { access_token } = tokenRes.data;

    // 2. 프로필 요청
    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    console.log("[google/callback] profileRes.data:", profileRes.data);
    const profile = profileRes.data;
    const email = profile.email;
    const username = profile.name || profile.email.split("@")[0];

    // 3. DB조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log("[google/callback] users.length:", users.length);

    if (users.length > 0) {
      const user = users[0];
      // (1) 삭제/비활성화 계정 방지
      if (user.is_deleted === 1) {
        return res.status(403).json({ error: "비활성화된 계정입니다. 관리자에게 문의하세요." });
      }
      // (2) 권한 누락 방지
      if (!user.role) {
        return res.status(403).json({ error: "권한 없는 계정입니다. 관리자에게 문의하세요." });
      }
      const tokenPayload = { id: user.id, role: user.role };
      const jwtAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
      return res.json({
        success: true,
        accessToken: jwtAccessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // 신규 유저
      const tempPayload = {
        socialProvider: "google",
        googleId: profile.id,
        email,
        name: username,
        photo: profile.picture || "",
      };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
      console.log("[google/callback] 신규유저 tempToken 발급, email:", email);
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("[google/callback] Google OAuth Error:", err);
    if (err.response) {
      console.error("[google/callback] Error response.data:", err.response.data);
    }
    return res.status(500).json({ error: "Google OAuth Error", detail: err.message });
  }
});


// 카카오 code 처리 REST API
router.post("/kakao/callback", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
          client_secret: process.env.KAKAO_CLIENT_SECRET,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const { access_token } = tokenRes.data;

    // 2. 카카오 사용자 정보 조회
    const profileRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const kakao = profileRes.data;
    const email = kakao.kakao_account?.email;
    const username = kakao.properties?.nickname || (email ? email.split("@")[0] : "");

    // 3. 사용자 DB 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length > 0) {
      // 기존 유저
      const user = users[0];
      const tokenPayload = { id: user.id, role: user.role };
      const jwtAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
      return res.json({
        success: true,
        accessToken: jwtAccessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // 신규 유저: 임시 토큰 발급
      const kakaoAccount = kakao.kakao_account || {};
      const tempPayload = {
        socialProvider: "kakao",
        kakaoId: kakao.id,
        email: kakaoAccount.email || "",
        name: kakaoAccount.profile?.nickname || username,
        phone: kakaoAccount.phone_number || "",
        photo: kakaoAccount.profile?.profile_image_url || "",
      };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("Kakao OAuth Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Kakao OAuth Error" });
  }
});

// 네이버 code 처리 REST API
router.post("/naver/callback", async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const tokenRes = await axios.post(
      "https://nid.naver.com/oauth2.0/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          code,
          state,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const { access_token } = tokenRes.data;

    // 2. 네이버 사용자 정보 조회
    const profileRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const naver = profileRes.data.response;
    const email = naver.email;
    const username = naver.nickname || (email ? email.split("@")[0] : "");

    // 3. 사용자 DB 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length > 0) {
      // 기존 유저
      const user = users[0];
      const tokenPayload = { id: user.id, role: user.role };
      const jwtAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
      return res.json({
        success: true,
        accessToken: jwtAccessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // 신규 유저: 임시 토큰 발급
      const tempPayload = {
        socialProvider: "naver",
        naverId: naver.id,
        email: naver.email || "",
        name: naver.nickname || username,
        phone: naver.mobile || naver.phone || "",
        photo: naver.profile_image || "",
      };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("Naver OAuth Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Naver OAuth Error" });
  }
});


// // ====================== 소셜 로그인 (Google) ======================
// router.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// router.get(
//   "/google/callback",
//   (req, res, next) => {
//     if (process.env.NODE_ENV !== "production") {
//       // 로컬 우회 처리
//       const mockUser = { id: 1, username: "로컬유저", email: "localtest@example.com", role: "user" };
//       const tokenPayload = { id: mockUser.id, role: mockUser.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: false, sameSite: "Lax", path: "/", maxAge: 60 * 60 * 1000 });
//       return res.json({ message: "🔓 로컬 Google 로그인 성공 (우회)", accessToken, user: mockUser });
//     }
//     return next();
//   },
//   passport.authenticate("google", { failureRedirect: "https://ghnod.vercel.app/login", session: false }),
//   (req, res) => {
//     if (req.user) {
//       // ✅ accessToken/refreshToken 발급
//       const tokenPayload = { id: req.user.id, role: req.user.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
//       const refreshToken = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: true,
//         sameSite: "None", path: "/", maxAge: 4 * 60 * 60 * 1000 });
//       res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true,
//         sameSite: "None", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
//         return res.json({
//           success: true,
//           accessToken,
//           user: {
//             id: req.user.id,
//             email: req.user.email,
//             username: req.user.username,
//             role: req.user.role,
//           },
//         });
//     } else if (req.authInfo && req.authInfo.tempToken) {
//       // 신규 유저 - 추가 정보 입력
//       return res.redirect(`https://ghnod.vercel.app/register/social?token=${req.authInfo.tempToken}`);
//     } else {
//       return res.redirect("https://ghnod.vercel.app/login?error=social");
//     }
//   }
// );

// // ====================== 소셜 로그인 (Kakao) ======================
// router.get("/kakao", passport.authenticate("kakao"));

// router.get(
//   "/kakao/callback",
//   (req, res, next) => {
//     if (process.env.NODE_ENV !== "production") {
//       // 로컬 우회 처리
//       const mockUser = { id: 2, username: "로컬카카오유저", email: "kakaotest@example.com", role: "user" };
//       const tokenPayload = { id: mockUser.id, role: mockUser.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: true,
//         sameSite: "None", path: "/", maxAge: 60 * 60 * 1000 });
//       return res.json({ message: "🔓 로컬 Kakao 로그인 성공 (우회)", accessToken, user: mockUser });
//     }
//     return next();
//   },
//   passport.authenticate("kakao", { failureRedirect: "https://ghnod.vercel.app/login", session: false }),
//   (req, res) => {
//     if (req.user) {
//       const tokenPayload = { id: req.user.id, role: req.user.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
//       const refreshToken = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: true,
//         sameSite: "None", path: "/", maxAge: 4 * 60 * 60 * 1000 });
//       res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true,
//         sameSite: "None", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
//       return res.redirect("https://ghnod.vercel.app/");
//     } else if (req.authInfo && req.authInfo.tempToken) {
//       return res.redirect(`https://ghnod.vercel.app/register/social?token=${req.authInfo.tempToken}`);
//     } else {
//       return res.redirect("https://ghnod.vercel.app/login?error=social");
//     }
//   }
// );

// // ====================== 소셜 로그인 (Naver) ======================
// router.get("/naver", passport.authenticate("naver", { scope: ["name", "email", "mobile"] }));

// router.get(
//   "/naver/callback",
//   (req, res, next) => {
//     if (process.env.NODE_ENV !== "production") {
//       const mockUser = { id: 3, username: "로컬네이버유저", email: "navertest@example.com", role: "user" };
//       const tokenPayload = { id: mockUser.id, role: mockUser.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: false, sameSite: "Lax", path: "/", maxAge: 60 * 60 * 1000 });
//       return res.json({ message: "🔓 로컬 Naver 로그인 성공 (우회)", accessToken, user: mockUser });
//     }
//     return next();
//   },
//   passport.authenticate("naver", { failureRedirect: "https://ghnod.vercel.app/login", session: false }),
//   (req, res) => {
//     if (req.user) {
//       const tokenPayload = { id: req.user.id, role: req.user.role };
//       const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "4h" });
//       const refreshToken = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
//       res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "None", path: "/", maxAge: 4 * 60 * 60 * 1000 });
//       res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "None", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
//       return res.redirect("https://ghnod.vercel.app/");
//     } else if (req.authInfo && req.authInfo.tempToken) {
//       return res.redirect(`https://ghnod.vercel.app/register/social?token=${req.authInfo.tempToken}`);
//     } else {
//       return res.redirect("https://ghnod.vercel.app/login?error=social");
//     }
//   }
// );

// ====================== 이메일 중복 확인 ======================
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "이메일이 필요합니다." });
  }

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("❌ 이메일 중복 확인 오류:", error);
    return res.status(500).json({ error: "서버 오류로 이메일 확인 실패" });
  }
});
// ====================== 회원가입 ======================
router.post("/register", async (req, res) => {
  console.log("📌 회원가입 요청 데이터:", req.body);

  const {
    username,
    email,
    password,
    phone,
    company,
    department,
    position,
    marketing_agree,
    terms_agree,
    privacy_agree,
  } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ error: "모든 필드를 입력하세요." });
  }

  // ✅ 비밀번호 유효성 검사 추가 (6자 이상, 숫자 포함, 영문 포함, 특수문자 포함)
  const pwTooShort = password.length < 6;
  const pwNoNumber = !/\d/.test(password);
  const pwNoAlpha = !/[a-zA-Z]/.test(password);
  const pwNoSymbol = !/[~!@#$%^&*()_+{}\[\]:;<>,.?\/\\\-]/.test(password);

  if (pwTooShort || pwNoNumber || pwNoAlpha || pwNoSymbol) {
    return res.status(400).json({
      error: "비밀번호는 영문, 숫자, 특수문자를 포함한 6자 이상이어야 합니다.",
    });
  }

  try {
    // 이메일 중복 확인
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "이미 사용 중인 이메일입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT 실행
    await db.query(
      `INSERT INTO users
        (username, email, password, phone, company, department, position, marketing_agree, terms_agree, privacy_agree, role, password_reset_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', false)`,
      [
        username,
        email,
        hashedPassword,
        phone,
        company || "",
        department || "",
        position || "",
        marketing_agree ? 1 : 0,
        terms_agree ? 1 : 0,
        privacy_agree ? 1 : 0,
      ]
    );

    console.log("✅ 회원가입 성공!", email);
    res.status(200).json({ message: "✅ 회원가입 성공!" });
  } catch (error) {
    console.error("❌ 회원가입 오류:", error); // 기존 로그
    console.error("❌ SQL 오류 메시지:", error.sqlMessage); // 추가
    console.error("❌ SQL:", error.sql); // 추가
    console.error("❌ stack:", error.stack); // 선택
    res.status(500).json({ error: "회원가입 실패" });
  }
});

router.post("/register-social", async (req, res) => {
  const { token, username, phone, company, department, position, terms_agree, privacy_agree, marketing_agree } = req.body;
  try {
    // 1. 임시토큰 복호화 (만료 체크/에러처리)
    let payload;
    try {
      payload = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ error: "인증 토큰이 만료되었습니다. 소셜로그인을 다시 시도하세요." });
      }
      return res.status(500).json({ error: "토큰 복호화 실패" });
    }
    const { email, socialProvider, googleId, kakaoId, naverId } = payload;

    // 2. 필수 정보 누락 방지
    if (!username || !phone) {
      return res.status(400).json({ error: "이름과 휴대폰번호는 필수입니다." });
    }

    // 3. 이메일/전화번호 중복 체크
    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email, phone]
    );
    if (exists.length > 0) return res.status(409).json({ error: "이미 가입된 이메일/전화번호입니다." });

    // 4. 더미 비밀번호 생성
    const hashedPassword = await bcrypt.hash("social_oauth_dummy", 10);

    // 5. DB INSERT (소셜 식별자 포함)
    await db.query(
      `INSERT INTO users
        (username, email, phone, password, google_id, kakao_id, naver_id, company, department, position, marketing_agree, terms_agree, privacy_agree, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
      [
        username,
        email,
        phone,
        hashedPassword,
        googleId || null,
        kakaoId || null,
        naverId || null,
        company || "",
        department || "",
        position || "",
        marketing_agree ? 1 : 0,
        terms_agree ? 1 : 0,
        privacy_agree ? 1 : 0,
      ]
    );

    // 6. (선택) 회원가입 후 바로 로그인/토큰 발급

    return res.status(200).json({ success: true, message: "소셜 회원가입 완료" });
  } catch (err) {
    console.error("❌ 소셜회원가입 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/check-phone", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "휴대폰번호가 필요합니다." });
  }

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE phone = ?", [
      phone,
    ]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error("❌ 휴대폰 중복 확인 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});
// ====================== 통합 로그인 ======================
router.post("/login", async (req, res) => {
  console.log("📌 로그인 요청 데이터:", req.body);

  const { email, password, clientSessionId } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "이메일과 비밀번호를 입력하세요." });
  }

  try {
    // DB에서 사용자 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = users[0];

    // ✅ 비활성화 계정 로그인 제한 추가
    if (user.is_deleted === 1) {
      return res.status(403).json({
        success: false,
        message: "비활성화된 계정입니다. 관리자에게 문의하세요.",
      });
    }

    // OAuth 계정 비밀번호 로그인 불가
    // OAuth 계정 비밀번호 로그인 불가 (DEBUG 포함)
    const dummyCheck = await bcrypt.compare(
      "google_oauth_dummy",
      user.password
    );
    console.log(
      "📌 [OAuth 차단 체크] google_oauth_dummy 비교 결과:",
      dummyCheck
    );
    console.log("📌 [OAuth 차단 체크] 입력 비밀번호:", password);
    console.log("📌 [OAuth 차단 체크] DB 해시:", user.password);

    if (dummyCheck) {
      console.warn(
        "❌ 차단됨: user.password가 google_oauth_dummy 해시로 저장됨"
      );
      return res.status(403).json({
        success: false,
        message: "Google OAuth 계정은 비밀번호 로그인을 사용할 수 없습니다.",
      });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    // JWT 발급 (role 포함)
    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });

    // refreshToken 발급
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // (1) refresh_tokens 테이블에 새로 insert (삭제 안 함)
    const userAgent = req.headers["user-agent"];
    const deviceInfo = parseDeviceInfo(userAgent);
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

    // 🔧 기존 세션 토큰 중복 방지
    await db.query(
      `DELETE FROM refresh_tokens WHERE user_id = ? AND client_session_id = ?`,
      [user.id, clientSessionId]
    );

    // 🔐 새로운 refreshToken 저장
    await db.query(
      `INSERT INTO refresh_tokens 
   (user_id, token, client_session_id, device_info, ip_address, expires_at, user_agent) 
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        refreshToken,
        clientSessionId,
        deviceInfo,
        ipAddress,
        expiresAt,
        userAgent,
      ]
    );

    // (2) 기존처럼 refreshToken을 쿠키에 저장
    // 🔐 refreshToken
    const guestToken = req.headers["x-guest-token"] || null;

    // 로그인 중 병합 시
    if (guestToken) {
      const [guestOrders] = await db.query(
        `SELECT id FROM orders WHERE guest_token = ? AND order_status = 'cart'`,
        [guestToken]
      );

      if (guestOrders.length > 0) {
        const guestOrderId = guestOrders[0].id;

        const [userOrders] = await db.query(
          `SELECT id FROM orders WHERE user_id = ? AND order_status = 'cart' ORDER BY updated_at DESC`,
          [user.id]
        );

        const userOrderId = userOrders[0]?.id || null;

        if (userOrderId) {
          // 병합
          // 1. 각 장바구니 아이템 조회
          const [guestItems] = await db.query(
            `SELECT schedule_id, quantity, unit_price, discount_price, subtotal
   FROM order_items
   WHERE order_id = ?`,
            [guestOrderId]
          );

          const [userItems] = await db.query(
            `SELECT schedule_id, quantity
   FROM order_items
   WHERE order_id = ?`,
            [userOrderId]
          );

          // 2. 유저 장바구니를 Map으로 정리 (schedule_id → quantity)
          const userMap = new Map(
            userItems.map((item) => [item.schedule_id, item.quantity])
          );

          // 3. 병합 로직 실행
          for (const guestItem of guestItems) {
            const userQty = userMap.get(guestItem.schedule_id);

            if (userQty != null) {
              // 중복 → 수량 비교 후, 더 큰 쪽으로 UPDATE
              if (guestItem.quantity > userQty) {
                await db.query(
                  `UPDATE order_items
         SET quantity = ?, unit_price = ?, discount_price = ?, subtotal = ?, updated_at = NOW()
         WHERE order_id = ? AND schedule_id = ?`,
                  [
                    guestItem.quantity,
                    guestItem.unit_price,
                    guestItem.discount_price,
                    guestItem.subtotal,
                    userOrderId,
                    guestItem.schedule_id,
                  ]
                );
              }

              // 어쨌든 guest 쪽은 삭제
              await db.query(
                `DELETE FROM order_items
       WHERE order_id = ? AND schedule_id = ?`,
                [guestOrderId, guestItem.schedule_id]
              );
            } else {
              // 중복 아님 → 그냥 INSERT
              await db.query(
                `INSERT INTO order_items
       (order_id, schedule_id, quantity, unit_price, discount_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  userOrderId,
                  guestItem.schedule_id,
                  guestItem.quantity,
                  guestItem.unit_price,
                  guestItem.discount_price,
                  guestItem.subtotal,
                ]
              );
            }
          }

          await db.query(`DELETE FROM orders WHERE id = ?`, [guestOrderId]);
        } else {
          // cart가 없다면 이걸 유저 cart로
          await db.query(
            `UPDATE orders SET user_id = ?, guest_token = NULL WHERE id = ?`,
            [user.id, guestOrderId]
          );
        }

        // ✅ 혹시라도 남아있는 추가 cart들 정리
        const [finalCarts] = await db.query(
          `SELECT id FROM orders WHERE user_id = ? AND order_status = 'cart' ORDER BY updated_at DESC`,
          [user.id]
        );
        const toRemove = finalCarts.slice(1).map((o) => o.id);
        if (toRemove.length > 0) {
          await db.query(
            `DELETE FROM orders WHERE id IN (${toRemove.map(() => "?").join(",")})`,
            toRemove
          );
        }
      }
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    // ✅ 병합 이후, 장바구니 아이템 목록 조회
    const [cartItems] = await db.query(
      `SELECT
    oi.id,
    oi.schedule_id,
    s.title AS schedule_title,
    oi.quantity,
    oi.unit_price,
    oi.discount_price,
    oi.subtotal
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   JOIN schedules s ON oi.schedule_id = s.id
   WHERE o.user_id = ? AND o.order_status = 'cart'`,
      [user.id]
    );

    return res.json({
      success: true,
      message: "로그인 성공",
      role: user.role,
      name: user.username,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        needsPasswordReset: user.password_reset_required,
      },
      cartItems, // ✅ 여기에 담아서 보내기
    });
  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    return res.status(500).json({ success: false, message: "로그인 실패" });
  }
});

// ====================== 토큰 재발급 (Refresh Token) ======================
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const clientSessionId = req.body.clientSessionId; // ✅ 여기 추가

  console.log("✅ 쿠키에서 받은 refreshToken:", refreshToken);
  console.log("✅ clientSessionId:", clientSessionId); // 디버깅용 로그도 OK
  if (!refreshToken) {
    console.warn("🔒 RefreshToken 없음 → 204 No Content");
    return res.status(204).end();
  }

  try {
    // 1) refreshToken이 DB에 있는지 확인
    const [tokens] = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = ? AND client_session_id = ?",
      [refreshToken, clientSessionId]
    );
    if (tokens.length === 0) {
      return res
        .status(403)
        .json({ error: "유효하지 않은 Refresh Token입니다." });
    }

    // 2) Refresh Token 유효성 검증
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 3) DB에서 사용자 정보 재조회 (role 포함)
    const [rows] = await db.query("SELECT id, role FROM users WHERE id = ?", [
      userId,
    ]);
    if (!rows.length) {
      return res.status(404).json({ error: "존재하지 않는 사용자입니다." });
    }
    const user = rows[0];

    // ✅ 관리자면 자동 로그인 금지
    if (user.role === "admin") {
      return res.status(403).json({
        error:
          "관리자는 자동 로그인을 사용할 수 없습니다. 다시 로그인해주세요.",
      });
    }
    // 4) 새로운 Access Token 생성 (id + role)
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5) 쿠키에 새로 발급한 Access Token 저장
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true, // HTTPS 배포 시 true 권장
      sameSite: "None",
      maxAge: 60 * 60 * 1000, // 1시간
    });

    console.log(
      `✅ Access Token 재발급 성공! 사용자(${user.id}) role: ${user.role}`
    );

    // 6) 필요하다면 JSON에도 새 토큰을 포함해 응답 가능
    return res.status(200).json({
      success: true,
      message: "새로운 Access Token 발급 완료!",
      accessToken: newAccessToken,
      role: user.role,
    });
  } catch (error) {
    console.log("❌ Refresh Token 검증 실패:", error.message);
    return res
      .status(403)
      .json({ error: "유효하지 않은 Refresh Token입니다." });
  }
});

// ====================== 로그아웃 ======================
// backend/routes/auth.js
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const clientSessionId = req.body.clientSessionId;

  if (!refreshToken || !clientSessionId) {
    console.warn("🔒 로그아웃 정보 없음 → 204 No Content");
    return res.status(204).end();
  }

  try {
    await db.query(
      "DELETE FROM refresh_tokens WHERE token = ? AND client_session_id = ?",
      [refreshToken, clientSessionId]
    );

    // ✅ 쿠키 제거 시 sameSite와 path를 set-cookie 시점과 동일하게 설정해야 함
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None", // ✅ 로그인 시 설정과 동일하게
      path: "/", // ✅ 반드시 필요
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None", // ✅ 로그인 시 설정과 동일하게
      path: "/", // ✅ 반드시 필요
    });

    return res.status(200).json({ message: "✅ 로그아웃 성공!" });
  } catch (error) {
    console.error("❌ 로그아웃 오류:", error);
    return res.status(500).json({ error: "로그아웃 실패" });
  }
});

/**
 * 예시: 관리자 전용 API (admin-only-users)
 * -> authenticateToken, authenticateAdmin로 보호
 */
router.get(
  "/admin-only-users",
  authenticateToken,
  authenticateAdmin,
  async (req, res) => {
    try {
      const [rows] = await db.query("SELECT id, email, role FROM users");
      res.json({ success: true, users: rows });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  }
);

module.exports = router;
