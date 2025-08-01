import { useRef, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext";
import { useCartContext } from "../context/CartContext";
import api from "@/lib/api";
import ChangePasswordModal from "@/components/mypage/ChangePasswordModal";
import { getClientSessionId } from "@/lib/session";
import { ChevronLeft, LogIn } from "lucide-react";
import SocialLoginButtons from "@/components/SocialLoginButtons.dynamic";
import { setAccessToken } from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const { user, login } = useContext(UserContext);
  const { setCartItems, setCartReady } = useCartContext();
  const alreadyRedirected = useRef(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    if (user?.id && !alreadyRedirected.current) {
      alreadyRedirected.current = true;
      const target = user.role === "admin" ? "/admin" : "/";
      setTimeout(() => {
        if (router.pathname === "/login" && router.pathname !== target) {
          router.replace(target);
        }
      }, 0);
    }
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        clientSessionId: getClientSessionId(),
        autoLogin,
      });
      const data = res.data;

      if (data.success) {
        showAlert("로그인 성공! 환영합니다 😊");

        if (data.user?.needsPasswordReset) {
          setUserId(data.user.id);
          setShowPasswordResetModal(true);
          return;
        }

        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
        };
        setAccessToken(data.accessToken);

        let finalCartItems = [];
        try {
          const cartRes = await api.get("/cart/items");
          if (cartRes.data.success) {
            finalCartItems = cartRes.data.items;
          }
        } catch (err) {}

        login(userData, data.accessToken, finalCartItems);
        setCartItems(finalCartItems);
        setCartReady(true);

        localStorage.removeItem("guest_token");
        delete api.defaults.headers.common["x-guest-token"];
      } else {
        showAlert("로그인 실패: " + data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "로그인 요청 실패";
      showAlert(msg);
    }
  };

  if (typeof window === "undefined" || !router.isReady) return null;
  if (user?.id) return null;

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="title-bar">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.back()}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="title-wrap">
            <LogIn size={32} color="#3577f1" style={{ marginBottom: 4 }} />
            <h2 className="title">로그인</h2>
          </div>
        </div>
        <form
          id="login-form"
          onSubmit={handleLogin}
          autoComplete="off"
          className="login-form"
        >
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            autoFocus
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <div className="login-extra-bar">
            <label className="auto-login-checkbox">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => {
                  setAutoLogin(e.target.checked);
                  localStorage.setItem("autoLogin", e.target.checked);
                }}
              />
              <span>자동로그인</span>
            </label>
            <div className="find-links">
              <a href="/find-email">이메일 찾기</a>
              <span className="bar">|</span>
              <a href="/find-password">비밀번호 찾기</a>
            </div>
          </div>
          <button type="submit" className="login-btn desktop-only">
            로그인
          </button>
        </form>
        <p className="login-footer">
          아직 회원이 아니신가요? <a href="/register">회원가입</a>
        </p>
        <div className="login-social-box desktop-only">
          <div className="social-label">소셜 계정으로 로그인</div>
          <SocialLoginButtons />
        </div>
      </div>

      <div className="login-bottom-bar mobile-only">
        <div className="login-social-box">
          <div className="social-label">소셜 계정으로 로그인</div>
          <SocialLoginButtons />
        </div>
        <button type="submit" className="login-btn" form="login-form">
          로그인
        </button>
      </div>

      {showPasswordResetModal && (
        <ChangePasswordModal
          userId={userId}
          onClose={() => setShowPasswordResetModal(false)}
          isForcedReset={true}
        />
      )}
    </div>
  );
}
