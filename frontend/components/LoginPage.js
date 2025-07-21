import { useRef, useState, useContext, useEffect } from "react"; // useRef 추가!
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
  console.log("[LoginPage 진입] 최초 실행, pathname:", window.location.pathname);
  useEffect(() => {
    // 환경 변수 확인용
    console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const { user, login } = useContext(UserContext);
  console.log("[LoginPage] useContext의 user:", user);
  const { setCartItems, setCartReady } = useCartContext();
  const alreadyRedirected = useRef(false);
   // 👇 마운트/언마운트 로그 추가
   useEffect(() => {
    console.log("🟢 [LoginPage] MOUNTED");
    return () => {
      console.log("🟠 [LoginPage] UNMOUNTED");
    };
  }, []);
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log(
      "🟩 [LoginPage] 라우팅 useEffect 진입, alreadyRedirected:",
      alreadyRedirected.current,
      "user.id:", user?.id,
      "pathname:", router.pathname
    );
  
    if (!user?.id) return;
    const target = user.role === "admin" ? "/admin" : "/";
    if (alreadyRedirected.current) return; // 이미 이동했으면 실행 금지!
    if (router.pathname === "/login" && router.pathname !== target) {
      router.push(target);
      alreadyRedirected.current = true; // 이동 플래그 ON
      console.log("[LoginPage 라우팅] 최초 이동 시도:", target);
    }
  }, [user?.id, user?.role, router.pathname]);
  
  
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
        console.log("✅ 로그인 성공 - accessToken:", data.accessToken);
        toast.success("로그인 성공! 환영합니다 😊");
  
        if (data.user?.needsPasswordReset) {
          setUserId(data.user.id);
          setShowPasswordResetModal(true);
          return;
        }
  
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username, // 👈 반드시 username
          role: data.user.role,
          // (필요하면 company, department, phone 등 users 테이블의 컬럼 다 맞춤)
        };
        console.log("✅ [login] userData", userData);
        setAccessToken(data.accessToken);
  
        let finalCartItems = [];
        try {
          const cartRes = await api.get("/cart/items");
          if (cartRes.data.success) {
            finalCartItems = cartRes.data.items;
          }
        } catch (err) {
          console.warn("🛒 로그인 직후 장바구니 fetch 실패:", err.message);
        }
  
        // 👇 여기서 한 번만 실행
        login(userData, data.accessToken, finalCartItems);
        setCartItems(finalCartItems);
        setCartReady(true);
  
        localStorage.removeItem("guest_token");
        delete api.defaults.headers.common["x-guest-token"];
  
        // ❌ 중복 login, setCartItems, setCartReady, setTimeout 모두 제거
  
      } else {
        toast.error("로그인 실패: " + data.message);
      }
    } catch (err) {
      console.error("로그인 중 오류:", err);
      const msg = err.response?.data?.message || "로그인 요청 실패";
      toast.error(msg);
    }
  };
  

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "77vh",
    background: "#fff",
    margin: 0,
  };
  const boxStyle = {
    width: isMobile ? "100%" : "360px",
    padding: isMobile ? "32px 24px" : "40px",
    borderRadius: isMobile ? "0px" : "8px",
    background: "#fff",
    boxShadow: isMobile ? "none" : "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const titleStyle = {
    fontSize: "24px",
    marginBottom: "20px",
  };
  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "15px",
  };
  const buttonStyle = {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#0070f3",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  };
  if (user?.id) return null;
  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
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
          {/* 🧱 fake input 필드로 자동완성 우회 */}
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
            style={inputStyle}
          />
          <input
            type="password"
            name="nope_password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
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
          {/* ✅ 소셜 로그인 버튼 추가 위치 */}
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

      {/* 비밀번호 변경 모달 */}
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
