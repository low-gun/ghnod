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
        const email = profile.emails[0].value;
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
          email: profile.emails?.[0]?.value || "",
          name: profile.displayName || profile.name?.givenName || "",
          phone: profile.phoneNumber || "", // 구글은 일반 OAuth로는 phone을 거의 못 받음
          photo: profile.photos?.[0]?.value || "",
        };
        const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
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
          kakaoId: profile.id,
          email: kakaoAccount.email || "",
          name: kakaoAccount.profile?.nickname || profile.displayName || "",
          phone: kakaoAccount.phone_number || "", // 국제포맷(+82...)일 수 있음
          photo: kakaoAccount.profile?.profile_image_url || "",
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
        const email = profile.email;
        const username = profile.displayName || `naver_${profile.id}`;
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length > 0) {
          console.log("✅ 기존 Naver 사용자 로그인:", email);
          return done(null, users[0]);
        }
        // 신규: 임시토큰 발급 → 추가정보 입력 리디렉션
        const tempPayload = {
          socialProvider: "naver",
          naverId: profile.id,
          email: profile.email || "",
          name: profile.displayName || profile.name || "",
          phone: profile.mobile || profile.phone || "", // 네이버는 profile.mobile에 국제/국내포맷
          photo: profile.profileImage || "",
        };
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
