import { useRef, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext";
import { useCartContext } from "../context/CartContext";
import api from "@/lib/api";
import ChangePasswordModal from "@/components/mypage/ChangePasswordModal";
import { getClientSessionId } from "@/lib/session";
import { toast } from "react-toastify";
import { ChevronLeft, LogIn } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import SocialLoginButtons from "@/components/SocialLoginButtons.dynamic";
import { setAccessToken } from "@/lib/api";

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
        toast.success("로그인 성공! 환영합니다 😊");

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
        toast.error("로그인 실패: " + data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "로그인 요청 실패";
      toast.error(msg);
    }
  };

  if (typeof window === "undefined" || !router.isReady) return null;
  if (user?.id) return null;

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-title-wrap">
          <LogIn size={32} color="#3577f1" style={{ marginBottom: 4 }} />
          <h2 className="login-title">로그인</h2>
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
            onChange={e => setEmail(e.target.value)}
            className="login-input"
            autoFocus
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <div className="login-extra-bar">
            <label className="auto-login-checkbox">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={e => {
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
                <button
    type="submit"
    className="login-btn desktop-only"
  >
          로그인
        </button>
        </form>
        <p className="login-footer">
          아직 회원이 아니신가요?{" "}
          <a href="/register">회원가입</a>
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
  <button
    type="submit"
    className="login-btn"
    form="login-form"
  >
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
      <style jsx>{`
        .login-root {
          min-height: 100vh;
          background: #f8faff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-card {
          width: 100%;
          max-width: 370px;
          background: #fff;
          border-radius: 26px;
          box-shadow: 0 8px 40px 0 rgba(48,100,220,0.13);
          padding: 44px 30px 32px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          animation: fadeup .33s cubic-bezier(.22,.68,.64,1.12);
        }
        .login-title-wrap {
          text-align: center;
          margin-bottom: 25px;
        }
        .login-title {
          font-size: 22px;
          font-weight: 800;
          color: #27354c;
          margin: 0 0 0 0;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-input {
          border: 1.5px solid #e3e9fa;
          border-radius: 12px;
          font-size: 16.5px;
          padding: 13px 16px;
          width: 100%;
          background: #fafdff;
          transition: border 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px 0 rgba(60,100,220,0.03);
        }
        .login-input:focus {
          outline: none;
          border: 1.8px solid #3577f1;
          box-shadow: 0 4px 16px 0 rgba(48,100,220,0.06);
        }
        .login-extra-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -2px;
          margin-bottom: 1px;
        }
        .auto-login-checkbox {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14.3px;
          color: #2b3a5a;
          font-weight: 500;
          user-select: none;
        }
        .auto-login-checkbox input[type="checkbox"] {
          accent-color: #3577f1;
          width: 15px;
          height: 15px;
          margin: 0;
        }
        .find-links {
          display: flex;
          gap: 7px;
          font-size: 14.2px;
        }
        .find-links a {
          color: #3577f1;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.13s;
        }
        .find-links a:hover {
          color: #1647af;
          text-decoration: underline;
        }
        .bar {
          color: #d1d5e1;
        }
        .login-btn {
          margin-top: 6px;
          padding: 13px 0;
          border: none;
          border-radius: 10px;
          background: linear-gradient(90deg, #3577f1 60%, #296fff 100%);
          color: #fff;
          font-size: 17.4px;
          font-weight: 700;
          letter-spacing: -1px;
          cursor: pointer;
          box-shadow: 0 2px 14px 0 rgba(60,120,250,0.08);
          transition: background 0.19s, box-shadow 0.19s;
        }
        .desktop-only.login-btn {
  margin-top: 6px; /* 데스크탑 버튼만 위 여백 */
}
        .login-btn:active {
          background: linear-gradient(90deg, #296fff 80%, #3577f1 100%);
          box-shadow: 0 2px 12px 0 rgba(48,100,220,0.12);
        }
        .login-btn:disabled {
          background: #b7c6e4;
          color: #fff;
          cursor: not-allowed;
        }
        .login-footer {
          margin: 18px 0 0 0;
          font-size: 14.7px;
          color: #66799c;
          text-align: center;
        }
        .login-footer a {
          color: #3577f1;
          font-weight: 400;
          text-decoration: none;
        }
        .login-social-box {
          width: 100%;
          margin-top: 33px;
        }
        .social-label {
          text-align: center;
          font-size: 14.2px;
          margin-bottom: 14px;
          color: #9399ad;
        }
        .desktop-only { display: block; }
        .mobile-only { display: none; }
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(38px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @media (max-width: 500px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .login-root {
            padding: 0;
            min-height: 100vh;
            background: #f8faff;
          }
          .login-card {
            max-width: 100vw;
            background: none;
            border-radius: 0;
            box-shadow: none;
            padding: 0 7vw 0 7vw;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .login-title {
            font-size: 18.5px;
          }
          .login-form {
            gap: 12px;
          }
          .login-input {
            font-size: 15px;
            padding: 11px 12px;
            border-radius: 8px;
          }
          .login-extra-bar {
            flex-direction: row;
            align-items: flex-start;
            gap: 7px;
            margin-bottom: 4px;
          }
          .find-links {
            font-size: 13.2px;
            gap: 5px;
          }
          .login-btn {
            padding: 11px 0;
            font-size: 15.2px;
            border-radius: 8px;
            margin-top: 0;
          }
          .login-footer {
            font-size: 13.5px;
            margin-top: 13px;
          }
          .login-social-box {
            margin-top: 0;
          }
          .social-label {
            font-size: 13px;
            margin-bottom: 10px;
          }
          .login-bottom-bar {
            position: fixed;
            left: 0;
            bottom: 0;
            width: 100vw;
            background: #fff;
            padding: 14px 7vw 18px 7vw;
            box-shadow: 0 -3px 18px 0 rgba(48,100,220,0.08);
            z-index: 100;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
