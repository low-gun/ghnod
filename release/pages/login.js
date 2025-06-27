import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext";
import { useCartContext } from "../context/CartContext"; // ✅ 여기에 추가
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import ChangePasswordModal from "@/components/mypage/ChangePasswordModal";
import { getClientSessionId } from "@/lib/session";
import { toast } from "react-toastify";
import { ChevronLeft } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import SocialLoginButtons from "@/components/SocialLoginButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const { login } = useContext(UserContext);
  const { setCartItems, setCartReady } = useCartContext(); // ✅ cartReady도 같이 꺼냄

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
          name: data.user.username,
          role: data.user.role,
        };

        // ✅ accessToken 세팅 (user 인증 전환)
        applyAccessTokenToAxios(data.accessToken);

        // ✅ 로그인 후 서버 기준으로 장바구니 재요청 (병합 반영됨)
        let finalCartItems = [];
        try {
          const cartRes = await api.get("/cart/items");
          if (cartRes.data.success) {
            finalCartItems = cartRes.data.items;
          }
        } catch (err) {
          console.warn("🛒 로그인 직후 장바구니 fetch 실패:", err.message);
        }

        login(userData, data.accessToken, finalCartItems); // ✅ 정확하게 전달

        // ✅ 전역 상태 반영
        setCartItems(finalCartItems);
        setCartReady(true);

        // ✅ 병합 끝난 이후에 guest_token 제거
        localStorage.removeItem("guest_token");
        delete api.defaults.headers.common["x-guest-token"];

        // ✅ 리다이렉트
        router.replace(data.user.role === "admin" ? "/admin" : "/");
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
    width: "360px",
    padding: "40px",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
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
