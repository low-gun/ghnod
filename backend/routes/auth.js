// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const axios = require("axios");
const { sendAlimtalkVerify } = require("../utils/nhnAlimtalk"); // 알림톡+SMS 발송 유틸
const crypto = require("crypto");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();
const { parseDeviceInfo } = require("../utils/parseDeviceInfo");
// [추가] 전화번호 정규화: 숫자만 + 82 → 0 변환 + 11자리 제한
const normalizePhone = (raw = "") => {
  let v = String(raw || "").replace(/\D/g, "");
  if (v.startsWith("82")) v = "0" + v.slice(2);
  return v.slice(0, 11);
};
// Google OAuth2 code 처리용 REST API
router.post("/google/callback", async (req, res) => {
  const { code, autoLogin } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    console.log("[google/callback] code:", code);

    // 1. 토큰 요청
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
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
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    console.log("[google/callback] users.length:", users.length);

    if (users.length > 0) {
      const user = users[0];
      if (user.is_deleted === 1) {
        return res
          .status(403)
          .json({ error: "비활성화된 계정입니다. 관리자에게 문의하세요." });
      }
      if (!user.role) {
        return res
          .status(403)
          .json({ error: "권한 없는 계정입니다. 관리자에게 문의하세요." });
      }
      const tokenPayload = { id: user.id, role: user.role };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "4h",
      });
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: autoLogin ? 7 * 24 * 60 * 60 * 1000 : undefined,
      });
      console.log(
        "쿠키 세팅 시 autoLogin:",
        autoLogin,
        "maxAge:",
        autoLogin ? 7 * 24 * 60 * 60 * 1000 : undefined
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      const tempPayload = {
        socialProvider: "google",
        googleId: profile.id,
        email,
        name: username,
        photo: profile.picture || "",
      };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      console.log("[google/callback] 신규유저 tempToken 발급, email:", email);
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("[google/callback] Google OAuth Error:", err);
    if (err.response) {
      console.error(
        "[google/callback] Error response.data:",
        err.response.data
      );
    }
    return res
      .status(500)
      .json({ error: "Google OAuth Error", detail: err.message });
  }
});

// 카카오 code 처리 REST API
router.post("/kakao/callback", async (req, res) => {
  const { code, autoLogin } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    // 토큰 요청 파라미터 구성
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code,
    });
    
    if (process.env.KAKAO_CLIENT_SECRET) {
      params.append("client_secret", process.env.KAKAO_CLIENT_SECRET);
    }
    
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    
    console.log("[kakao/callback] tokenRes.data:", tokenRes.data);

    const { access_token } = tokenRes.data;

    // 2. 카카오 사용자 정보 조회
    const profileRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("[kakao/callback] profileRes.data:", profileRes.data);
    const kakao = profileRes.data;
    const email = kakao.kakao_account?.email;
    const username =
      kakao.properties?.nickname || (email ? email.split("@")[0] : "");

    // 3. 사용자 DB 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length > 0) {
      // 기존 유저
      const user = users[0];
      const tokenPayload = { id: user.id, role: user.role };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "4h",
      });
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: autoLogin ? 7 * 24 * 60 * 60 * 1000 : undefined,
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        accessToken,
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
        name: kakaoAccount.name || kakaoAccount.profile?.nickname || username,
        phone: kakaoAccount.phone_number || "",
        photo: kakaoAccount.profile?.profile_image_url || "",
      };

      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("Kakao OAuth Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Kakao OAuth Error" });
  }
});

// 네이버 code 처리 REST API
router.post("/naver/callback", async (req, res) => {
  const { code, state, autoLogin } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code,
      state,
    });
    
    const tokenRes = await axios.post(
      "https://nid.naver.com/oauth2.0/token",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    
    console.log("[naver/callback] tokenRes.data:", tokenRes.data);
    
    const { access_token } = tokenRes.data;

    // 2. 네이버 사용자 정보 조회
    const profileRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("[naver/callback] profileRes.data:", profileRes.data);
    const naver = profileRes.data.response;

    const email = naver.email;
    const username = naver.nickname || (email ? email.split("@")[0] : "");

    // 3. 사용자 DB 조회
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length > 0) {
      // 기존 유저
      const user = users[0];
      const tokenPayload = { id: user.id, role: user.role };
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "4h",
      });
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: autoLogin ? 7 * 24 * 60 * 60 * 1000 : undefined,
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        accessToken,
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
        name: naver.name || naver.nickname || username,
        phone: naver.mobile || naver.phone || "",
        photo: naver.profile_image || "",
      };

      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      return res.json({ tempToken });
    }
  } catch (err) {
    console.error("Naver OAuth Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Naver OAuth Error" });
  }
});

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
  const safeLog = {
    email: req.body?.email,
    username: req.body?.username,
    phone: String(req.body?.phone || "").replace(/\d(?=\d{4})/g, "*"), // 뒤4자리만 보이게
    terms_agree: req.body?.terms_agree,
    privacy_agree: req.body?.privacy_agree,
    marketing_agree: req.body?.marketing_agree,
  };
  console.log("[/auth/register] body(check):", safeLog);

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

  // ✅ 비밀번호 유효성 검사 추가
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

// ✅ 휴대폰 중복 확인 추가
const rawPhone = String(phone || "").replace(/\D/g, "");
const [existingPhones] = await db.query(
  "SELECT id FROM users WHERE phone = ?",
  [rawPhone]
);
if (existingPhones.length > 0) {
  return res.status(409).json({ error: "이미 사용 중인 휴대폰번호입니다." });
}

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 휴대폰 인증 여부 확인 (최근 인증 성공 기록 필수)
    const [pv] = await db.query(
      "SELECT verified, expires_at FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [rawPhone]
    );
    if (!pv.length || pv[0].verified !== 1) {
      return res.status(400).json({ error: "휴대폰 인증이 필요합니다." });
    }

    // INSERT 실행
    await db.query(
      `INSERT INTO users
      (username, email, password, phone, company, department, position, marketing_agree, terms_agree, privacy_agree, role, password_reset_required)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', false)`,
      [
        username,
        email,
        hashedPassword,
        rawPhone, // ← 꼭 정규화된 번호 사용
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
    console.error("❌ 회원가입 오류:", { code: error?.code, sqlMessage: error?.sqlMessage });
  
    // ✅ 중복키 오류를 409로 변환
    if (error?.code === "ER_DUP_ENTRY") {
      // 어떤 컬럼인지 메시지로 식별(환경에 맞게 보완 가능)
      const msg = String(error?.sqlMessage || "").toLowerCase();
      if (msg.includes("users.email") || msg.includes("for key 'email'")) {
        return res.status(409).json({ error: "이미 사용 중인 이메일입니다." });
      }
      if (msg.includes("users.phone") || msg.includes("for key 'phone'")) {
        return res.status(409).json({ error: "이미 사용 중인 휴대폰번호입니다." });
      }
      return res.status(409).json({ error: "이미 사용 중인 계정 정보입니다." });
    }
  
    // 그 외 일반 오류
    return res.status(500).json({ error: "회원가입 실패" });
  }
  
});

router.post("/register-social", async (req, res) => {
  const {
    token,
    username,
    phone,
    company,
    department,
    position,
    terms_agree,
    privacy_agree,
    marketing_agree,
  } = req.body;
  try {
    // 1. 임시토큰 복호화
    let payload;
    try {
      payload = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({
          error: "인증 토큰이 만료되었습니다. 소셜로그인을 다시 시도하세요.",
        });
      }
      return res.status(500).json({ error: "토큰 복호화 실패" });
    }
    const { email, socialProvider, googleId, kakaoId, naverId } = payload;

    if (!username || !phone) {
      return res.status(400).json({ error: "이름과 휴대폰번호는 필수입니다." });
    }

    // 3. 이메일/전화번호 중복 체크
    const [userByEmail] = await db.query(
      "SELECT id, social_provider FROM users WHERE email = ?",
      [email]
    );
    const rawPhone = String(phone || "").replace(/\D/g, "");
    const [userByPhone] = await db.query(             // ← 변수명 통일
      "SELECT id, social_provider FROM users WHERE phone = ?",
      [rawPhone]                                      // ← social_provider도 함께 조회
    );
    
    if (userByEmail.length > 0) {
      const provider = userByEmail[0].social_provider || "local";
      return res.status(409).json({ error: "이미 사용 중인 이메일입니다.", errorType: "email", provider });
    }
    if (userByPhone.length > 0) {                     // ← 정상 동작
      const provider = userByPhone[0].social_provider || "local";
      return res.status(409).json({ error: "이미 사용 중인 휴대폰번호입니다.", errorType: "phone", provider });
    }
    

    const hashedPassword = await bcrypt.hash("social_oauth_dummy", 10);

    await db.query(
      `INSERT INTO users
        (username, email, phone, password, google_id, kakao_id, naver_id, company, department, position, marketing_agree, terms_agree, privacy_agree, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
      [
        username,
        email,
        rawPhone,
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

    return res
      .status(200)
      .json({ success: true, message: "소셜 회원가입 완료" });
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
    const rawPhone = String(phone || "").replace(/\D/g, "");
    const [rows] = await db.query("SELECT id FROM users WHERE phone = ?", [
      rawPhone,
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

  const { email, password, clientSessionId, autoLogin } = req.body;
  console.log("autoLogin 파라미터:", autoLogin);
  console.log("autoLogin:", autoLogin);

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "이메일과 비밀번호를 입력하세요." });
  }

  try {
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

    if (user.is_deleted === 1) {
      return res.status(403).json({
        success: false,
        message: "비활성화된 계정입니다. 관리자에게 문의하세요.",
      });
    }

    // OAuth 계정 비밀번호 로그인 불가
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const tokenPayload = { id: user.id, role: user.role };

    const accessTokenExpiresIn = "4h";
    const refreshTokenExpiresIn = autoLogin ? "30d" : "7d";

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: refreshTokenExpiresIn,
    });

    // (1) refresh_tokens 테이블 관리
    const userAgent = req.headers["user-agent"];
    const deviceInfo = parseDeviceInfo(userAgent);
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

    await db.query(
      `DELETE FROM refresh_tokens WHERE user_id = ? AND client_session_id = ?`,
      [user.id, clientSessionId]
    );

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

    const guestToken = req.headers["x-guest-token"] || null;

    // 로그인 중 장바구니 병합
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

          const userMap = new Map(
            userItems.map((item) => [item.schedule_id, item.quantity])
          );

          for (const guestItem of guestItems) {
            const userQty = userMap.get(guestItem.schedule_id);

            if (userQty != null) {
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

              await db.query(
                `DELETE FROM order_items
                 WHERE order_id = ? AND schedule_id = ?`,
                [guestOrderId, guestItem.schedule_id]
              );
            } else {
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
          await db.query(
            `UPDATE orders SET user_id = ?, guest_token = NULL WHERE id = ?`,
            [user.id, guestOrderId]
          );
        }

        const [finalCarts] = await db.query(
          `SELECT id FROM orders WHERE user_id = ? AND order_status = 'cart' ORDER BY updated_at DESC`,
          [user.id]
        );
        const toRemove = finalCarts.slice(1).map((o) => o.id);
        if (toRemove.length > 0) {
          await db.query(
            `DELETE FROM orders WHERE id IN (${toRemove
              .map(() => "?")
              .join(",")})`,
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
      maxAge: autoLogin ? 7 * 24 * 60 * 60 * 1000 : undefined,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

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
      cartItems,
    });
  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    return res.status(500).json({ success: false, message: "로그인 실패" });
  }
});

// ====================== 토큰 재발급 (Refresh Token) ======================
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const clientSessionId = req.body.clientSessionId;

  console.log("✅ 쿠키에서 받은 refreshToken:", refreshToken);
  console.log("✅ clientSessionId:", clientSessionId);
  if (!refreshToken) {
    console.warn("🔒 RefreshToken 없음 → 204 No Content");
    return res.status(204).end();
  }

  try {
    const [tokens] = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = ? AND client_session_id = ?",
      [refreshToken, clientSessionId]
    );
    if (tokens.length === 0) {
      return res
        .status(403)
        .json({ error: "유효하지 않은 Refresh Token입니다." });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await db.query("SELECT id, role FROM users WHERE id = ?", [
      userId,
    ]);
    if (!rows.length) {
      return res.status(404).json({ error: "존재하지 않는 사용자입니다." });
    }
    const user = rows[0];

    if (user.role === "admin") {
      return res.status(403).json({
        error:
          "관리자는 자동 로그인을 사용할 수 없습니다. 다시 로그인해주세요.",
      });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });

    console.log(
      `✅ Access Token 재발급 성공! 사용자(${user.id}) role: ${user.role}`
    );

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

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    return res.status(200).json({ message: "✅ 로그아웃 성공!" });
  } catch (error) {
    console.error("❌ 로그아웃 오류:", error);
    return res.status(500).json({ error: "로그아웃 실패" });
  }
});

/**
 * 예시: 관리자 전용 API (admin-only-users)
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

// ====================== 회원가입: 휴대폰 인증번호 전송 ======================
router.post("/phone/send-code/register", async (req, res) => {
  const { phone } = req.body;
  const rawPhone = normalizePhone(phone);
  if (!rawPhone) {
    return res.status(400).json({ error: "휴대폰번호가 필요합니다." });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendAlimtalkVerify(rawPhone, code); // result.channel 존재

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 기존 레코드 있으면 UPDATE, 없으면 INSERT
    const [exists] = await db.query(
      "SELECT id FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [rawPhone]
    );

    if (exists.length > 0) {
      await db.query(
        "UPDATE phone_verifications SET code_hash=?, verified=0, attempts=0, expires_at=? WHERE id=?",
        [codeHash, expiresAt, exists[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO phone_verifications (phone, code_hash, expires_at) VALUES (?, ?, ?)",
        [rawPhone, codeHash, expiresAt]
      );
    }

    return res.json({
      success: true,
      channel: result.channel, // 👈 핵심
      message: "인증번호를 발송했습니다.",
    });
  } catch (err) {
    return res.status(500).json({ error: "인증번호 발송 실패" });
  }
});

// ====================== 계정찾기: 휴대폰 인증번호 전송 ======================
router.post("/phone/send-code/recover", async (req, res) => {
  const { phone, email, username } = req.body;
  const rawPhone = normalizePhone(phone);
  if (!rawPhone) {
    return res.status(400).json({ error: "휴대폰번호가 필요합니다." });
  }

  if (!username && !email) {
    return res.status(400).json({ error: "인증 대상 정보가 필요합니다." });
  }

  if (username) {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE TRIM(LOWER(username)) = TRIM(LOWER(?)) AND phone = ?",
      [username.trim(), rawPhone]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "이름과 휴대폰번호가 일치하지 않습니다." });
    }
  }

  if (email) {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND phone = ?",
      [email.trim(), rawPhone]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "이메일과 휴대폰번호가 일치하지 않습니다." });
    }
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendAlimtalkVerify(rawPhone, code);
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const [exists] = await db.query(
      "SELECT id FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [rawPhone]
    );

    if (exists.length > 0) {
      await db.query(
        "UPDATE phone_verifications SET code_hash=?, verified=0, attempts=0, expires_at=? WHERE id=?",
        [codeHash, expiresAt, exists[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO phone_verifications (phone, code_hash, expires_at) VALUES (?, ?, ?)",
        [rawPhone, codeHash, expiresAt]
      );
    }

    return res.json({ success: true, message: "인증번호를 발송했습니다." });
  } catch (err) {
    return res.status(500).json({ error: "인증번호 발송 실패" });
  }
});

// 휴대폰 인증번호 검증
// ====================== 회원가입: 휴대폰 인증번호 검증 ======================
router.post("/phone/verify-code/register", async (req, res) => {
  const rawPhone = normalizePhone(req.body.phone);
  const code = String(req.body.code || "").trim();

  if (!rawPhone || !code) {
    return res.status(400).json({ error: "휴대폰번호와 인증번호가 필요합니다." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [rawPhone]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "인증 요청이 없습니다." });
    }

    const rec = rows[0];
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "인증번호가 만료되었습니다." });
    }
    if (rec.attempts >= 5) {
      return res.status(429).json({ error: "시도 횟수를 초과했습니다." });
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const isMatch = codeHash === rec.code_hash;

    await db.query(
      "UPDATE phone_verifications SET attempts = attempts + 1, verified = ? WHERE id = ?",
      [isMatch ? 1 : 0, rec.id]
    );

    if (!isMatch) {
      return res.status(400).json({ error: "인증번호가 일치하지 않습니다." });
    }

    return res.json({ success: true, message: "인증 완료" });
  } catch (err) {
    console.error("❌ 회원가입 인증번호 검증 오류:", err.message);
    return res.status(500).json({ error: "인증번호 검증 실패" });
  }
});
// ====================== 계정찾기: 휴대폰 인증번호 검증 ======================
router.post("/phone/verify-code/recover", async (req, res) => {
  const rawPhone = normalizePhone(req.body.phone);
  const code = String(req.body.code || "").trim();
  const { email, username } = req.body;

  if (!rawPhone || !code) {
    return res.status(400).json({ error: "휴대폰번호와 인증번호가 필요합니다." });
  }

  // 이름 + 휴대폰 검증
  if (username) {
    const name = String(username || "").trim();
    const [rows] = await db.query(
      "SELECT id FROM users WHERE TRIM(LOWER(username)) = TRIM(LOWER(?)) AND phone = ?",
      [name, rawPhone]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "이름과 휴대폰번호가 일치하지 않습니다." });
    }
  }

  // 이메일 + 휴대폰 검증
  if (email) {
    const mail = String(email || "").trim();
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND phone = ?",
      [mail, rawPhone]
    );
    if (!rows.length) {
      return res.status(400).json({ error: "이메일과 휴대폰번호가 일치하지 않습니다." });
    }
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [rawPhone]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "인증 요청이 없습니다." });
    }

    const rec = rows[0];
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "인증번호가 만료되었습니다." });
    }
    if (rec.attempts >= 5) {
      return res.status(429).json({ error: "시도 횟수를 초과했습니다." });
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const isMatch = codeHash === rec.code_hash;

    await db.query(
      "UPDATE phone_verifications SET attempts = attempts + 1, verified = ? WHERE id = ?",
      [isMatch ? 1 : 0, rec.id]
    );

    if (!isMatch) {
      return res.status(400).json({ error: "인증번호가 일치하지 않습니다." });
    }

    return res.json({ success: true, message: "인증 완료" });
  } catch (err) {
    console.error("❌ 계정찾기 인증번호 검증 오류:", err.message);
    return res.status(500).json({ error: "인증번호 검증 실패" });
  }
});

// ====================== 이메일 찾기 ======================
router.post("/find-email", async (req, res) => {
  try {
    const name = String(req.body.username || "").trim();
    const phone = normalizePhone(req.body.phone || "");

    if (!name || !phone) {
      return res.status(400).json({ error: "이름과 휴대폰번호가 필요합니다." });
    }

    // 1) 최근 휴대폰 인증 성공 여부 확인 (선택: 10분 내 등 시간 제한을 둘 수도 있음)
    const [pv] = await db.query(
      "SELECT verified, expires_at FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [phone]
    );
    if (!pv.length || pv[0].verified !== 1) {
      return res.status(400).json({ error: "휴대폰 인증이 필요합니다." });
    }

    // 2) 이름/전화 일치하는 계정의 이메일 목록 조회
    const [rows] = await db.query(
      `SELECT email
         FROM users
        WHERE TRIM(LOWER(username)) = TRIM(LOWER(?))
          AND phone = ?
        LIMIT 20`,
      [name, phone]
    );

    const emails = rows.map(r => r.email);
    return res.json({ success: true, emails });
  } catch (err) {
    console.error("❌ /auth/find-email 오류:", err);
    return res.status(500).json({ error: "이메일 조회 실패" });
  }
});

// ====================== 비밀번호 재설정 ======================
router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const phone = normalizePhone(req.body.phone);
    const newPassword = String(req.body.newPassword || "");

    if (!email || !phone || !newPassword) {
      return res.status(400).json({ error: "이메일, 휴대폰번호, 새 비밀번호가 필요합니다." });
    }

    // 비밀번호 정책 간단 검증
    const validLen = newPassword.length >= 6;
    const hasNum = /\d/.test(newPassword);
    const hasAlpha = /[a-zA-Z]/.test(newPassword);
    const hasSym = /[~!@#$%^&*()_+{}\[\]:;<>,.?\/\\\-]/.test(newPassword);
    if (!(validLen && hasNum && hasAlpha && hasSym)) {
      return res.status(400).json({ error: "비밀번호는 영문, 숫자, 특수문자를 포함한 6자 이상이어야 합니다." });
    }

    // 최근 휴대폰 인증 성공 확인
    const [pv] = await db.query(
      "SELECT verified FROM phone_verifications WHERE phone = ? ORDER BY id DESC LIMIT 1",
      [phone]
    );
    if (!pv.length || pv[0].verified !== 1) {
      return res.status(400).json({ error: "휴대폰 인증이 필요합니다." });
    }

    // 사용자 확인
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? AND phone = ?",
      [email, phone]
    );
    if (!users.length) {
      return res.status(404).json({ error: "해당 정보의 사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 업데이트
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password = ?, password_reset_required = 0, updated_at = NOW() WHERE id = ?",
      [hashedPassword, users[0].id]
    );

    return res.json({ success: true, message: "비밀번호가 재설정되었습니다." });
  } catch (err) {
    console.error("❌ /auth/reset-password 오류:", err);
    return res.status(500).json({ error: "비밀번호 재설정 실패" });
  }
});

module.exports = router;
