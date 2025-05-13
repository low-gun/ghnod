const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");

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

        // DB에서 사용자 조회
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        if (users.length > 0) {
          console.log("✅ 기존 사용자 로그인:", email);
          return done(null, users[0]);
        }

        // ✅ Google OAuth 계정에 더미 비밀번호 추가
        const hashedPassword = await bcrypt.hash("google_oauth_dummy", 10);

        // 신규 사용자 등록
        const sql =
          "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
        const [result] = await db.query(sql, [username, email, hashedPassword]);

        const newUser = { id: result.insertId, username, email };
        console.log("✅ 신규 사용자 등록:", newUser);
        return done(null, newUser);
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
      callbackURL: process.env.KAKAO_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile._json.kakao_account.email;
        const username = profile.displayName || `kakao_${profile.id}`;

        // DB에서 사용자 조회
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        if (users.length > 0) {
          console.log("✅ 기존 사용자 로그인:", email);
          return done(null, users[0]);
        }

        // ✅ Kakao OAuth 계정에 더미 비밀번호 추가
        const hashedPassword = await bcrypt.hash("kakao_oauth_dummy", 10);

        // 신규 사용자 등록
        const sql =
          "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
        const [result] = await db.query(sql, [username, email, hashedPassword]);

        const newUser = { id: result.insertId, username, email };
        console.log("✅ 신규 사용자 등록:", newUser);
        return done(null, newUser);
      } catch (error) {
        console.error("❌ Kakao OAuth 처리 중 오류:", error);
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
