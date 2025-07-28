const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const NaverStrategy = require("passport-naver-v2").Strategy;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ✅ Google OAuth 전략 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ✅ 디버깅용 로그 추가 (여기부터)
        console.log("==== [GoogleStrategy 콜백 진입] ====");
        console.log("accessToken:", accessToken);
        console.log("refreshToken:", refreshToken);
        console.log("profile:", JSON.stringify(profile, null, 2));

        const email = profile.emails?.[0]?.value || "";
        const username = profile.displayName;
        // 기존 유저 조회
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length > 0) {
          console.log("✅ 기존 Google 사용자 로그인:", email);
          return done(null, users[0]);
        }

        // 신규: 임시토큰 발급 → 추가정보 입력 리디렉션
        const tempPayload = {
          socialProvider: "google",
          googleId: profile.id,
          email: email,
          name: naver.name || "",   // 실명만, 없으면 빈 문자열 ("")
          phone: profile.phoneNumber || "",
          photo: profile.photos?.[0]?.value || "",
        };
        const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });

        console.log("신규 유저, tempToken 발급:", tempToken);
        return done(null, false, { message: "NEED_ADDITIONAL_INFO", tempToken });
      } catch (error) {
        console.error("❌ Google OAuth 처리 중 오류:", error);
        return done(error, null);
      }
    }
  )
);


// ✅ Kakao OAuth 전략 설정
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // (필요시)
      callbackURL: process.env.KAKAO_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("[Kakao profile 전체]", JSON.stringify(profile, null, 2));
        const email = profile._json.kakao_account.email;
        const username = profile.displayName || `kakao_${profile.id}`;
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length > 0) {
          console.log("✅ 기존 Kakao 사용자 로그인:", email);
          return done(null, users[0]);
        }
        // 신규: 임시토큰 발급 → 추가정보 입력 리디렉션
        const kakaoAccount = profile._json.kakao_account || {};
        const tempPayload = {
          socialProvider: "kakao",
          kakaoId: kakao.id,
          email: kakaoAccount.email || "",
          name: "", // 무조건 빈 문자열(실명 직접 입력)
          phone: kakaoAccount.phone_number || "",
          photo: kakaoAccount.profile?.profile_image_url || "",
          // 닉네임이 필요하면 별도 nickname 필드에 저장
        };
        const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
        return done(null, false, { message: "NEED_ADDITIONAL_INFO", tempToken });
      } catch (error) {
        console.error("❌ Kakao OAuth 처리 중 오류:", error);
        return done(error, null);
      }
    }
  )
);

// ✅ Naver OAuth 전략 설정
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
 // 여기에 로그 추가!
 console.log("==== [Naver 콜백 profile 전체] ====");
 console.dir(profile, { depth: 5 });
 console.log("profile._json?.response:", profile._json?.response);
 console.log("profile.displayName:", profile.displayName);
        const email = profile.email;
        const username = profile.displayName || `naver_${profile.id}`;
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length > 0) {
          console.log("✅ 기존 Naver 사용자 로그인:", email);
          return done(null, users[0]);
        }
        // === 여기 추가 ===
        const rawName = profile._json?.response?.name || "";

        const tempPayload = {
          socialProvider: "naver",
          naverId: naver.id,
          email: naver.email || "",
          name: naver.name || "",  // 실명만, 없으면 빈값
          phone: naver.mobile || naver.phone || "",
          photo: naver.profile_image || "",
        };
        console.log("[Naver tempToken payload]", tempPayload);
        // === 여기까지 ===

        const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
        return done(null, false, { message: "NEED_ADDITIONAL_INFO", tempToken });
      } catch (error) {
        console.error("❌ Naver OAuth 처리 중 오류:", error);
        return done(error, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
