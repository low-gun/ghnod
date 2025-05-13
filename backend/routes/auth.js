// backend/routes/auth.js

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const passport = require("passport");
const {
  authenticateToken,
  authenticateAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();
const { parseDeviceInfo } = require("../utils/parseDeviceInfo");
// ====================== 소셜 로그인 (Google) ======================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    console.log("✅ Google 로그인 성공:", req.user);
    const { password, ...userWithoutPassword } = req.user;
    res.json({ message: "✅ Google 로그인 성공!", user: userWithoutPassword });
  }
);

// ====================== 소셜 로그인 (Kakao) ======================
router.get("/kakao", passport.authenticate("kakao"));
router.get(
  "/kakao/callback",
  passport.authenticate("kakao", { failureRedirect: "/login", session: false }),
  (req, res) => {
    console.log("✅ Kakao 로그인 성공:", req.user);
    const { password, ...userWithoutPassword } = req.user;
    res.json({ message: "✅ Kakao 로그인 성공!", user: userWithoutPassword });
  }
);

// ====================== 회원가입 ======================
router.post("/register", async (req, res) => {
  console.log("📌 회원가입 요청 데이터:", req.body);

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "모든 필드를 입력하세요." });
  }

  try {
    // 이메일 중복
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "이미 사용 중인 이메일입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 기본 role: 'user'
    await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')",
      [username, email, hashedPassword]
    );

    console.log("✅ 회원가입 성공!", email);
    res.status(200).json({ message: "✅ 회원가입 성공!" });
  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    res.status(500).json({ error: "회원가입 실패" });
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
    const googleOAuthHash = await bcrypt.hash("google_oauth_dummy", 10);
    if (user.password === googleOAuthHash) {
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
      secure: false,
      sameSite: "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
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
    return res.status(400).json({ error: "Refresh Token이 필요합니다." });
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
      secure: false, // HTTPS 배포 시 true 권장
      sameSite: "Strict",
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

  if (!refreshToken) {
    return res
      .status(400)
      .json({ error: "로그아웃 실패: Refresh Token이 없습니다." });
  }

  if (!clientSessionId) {
    return res
      .status(400)
      .json({ error: "로그아웃 실패: clientSessionId가 없습니다." });
  }

  try {
    await db.query(
      "DELETE FROM refresh_tokens WHERE token = ? AND client_session_id = ?",
      [refreshToken, clientSessionId]
    );

    // ✅ 쿠키 제거 시 sameSite와 path를 set-cookie 시점과 동일하게 설정해야 함
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax", // ✅ 로그인 시 설정과 동일하게
      path: "/", // ✅ 반드시 필요
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax", // ✅ 로그인 시 설정과 동일하게
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
