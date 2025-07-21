import { useRef, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext";
import { useCartContext } from "../context/CartContext";
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import ChangePasswordModal from "@/components/mypage/ChangePasswordModal";
import { getClientSessionId } from "@/lib/session";
import { toast } from "react-toastify";
import { ChevronLeft } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import SocialLoginButtons from "@/components/SocialLoginButtons.dynamic";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
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
  const isMobile = useIsMobile();

  // 🚩 [1] router, user 판별 완료 전엔 렌더 차단
  if (!router.isReady || user === undefined) return null;

  // 🚩 [2] 로그인된 상태면 리다이렉트 (딱 1번만)
  useEffect(() => {
    if (user?.id && !alreadyRedirected.current) {
      const target = user.role === "admin" ? "/admin" : "/";
      if (router.pathname === "/login" && router.pathname !== target) {
        alreadyRedirected.current = true;
        router.replace(target); // push 말고 replace
      }
    }
  }, [user, router]);

  // 🚩 [3] 로그인 상태에서는 절대 로그인폼 렌더 안함(렌더 차단)
  if (user?.id) return null;

  // 🚩 [4] 미로그인 상태(또는 로그인 실패/완료 후)에만 폼 렌더
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
        clientSessionId: getClientSessionId(),
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

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "77vh",
      background: "#fff",
      margin: 0,
    }}>
      <div style={{
        width: isMobile ? "100%" : "360px",
        padding: isMobile ? "32px 24px" : "40px",
        borderRadius: isMobile ? "0px" : "8px",
        background: "#fff",
        boxShadow: isMobile ? "none" : "0 4px 12px rgba(0,0,0,0.1)",
        textAlign: "center",
        boxSizing: "border-box",
      }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              position: "absolute",
              left: 0,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "#666",
              fontWeight: "bold",
            }}
            aria-label="이전 페이지로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: "24px", margin: 0 }}>로그인</h1>
        </div>
        <form
          onSubmit={handleLogin}
          autoComplete="off"
          style={{ textAlign: "left" }}
        >
          <input
            type="text"
            name="fake_email"
            autoComplete="username"
            style={{ display: "none" }}
          />
          <input
            type="password"
            name="fake_password"
            autoComplete="current-password"
            style={{ display: "none" }}
          />
          <input
            type="email"
            name="nope_email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "15px",
            }}
          />
          <input
            type="password"
            name="nope_password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "15px",
            }}
          />
          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#0070f3",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "bold",
            cursor: "pointer",
          }}>
            로그인
          </button>
          <p style={{ marginTop: "10px", fontSize: "14px", textAlign: "left" }}>
            아직 회원이 아니신가요?{" "}
            <a
              href="/register"
              style={{ color: "#0070f3", textDecoration: "underline" }}
            >
              회원가입
            </a>
          </p>
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                textAlign: "center",
                fontSize: "14px",
                marginBottom: "10px",
              }}
            >
              소셜 계정으로 로그인
            </div>
            <SocialLoginButtons />
          </div>
        </form>
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
