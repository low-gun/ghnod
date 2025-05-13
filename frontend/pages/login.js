import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { UserContext } from "../context/UserContext";
import { useCartContext } from "../context/CartContext"; // ✅ 여기에 추가
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import ChangePasswordModal from "@/components/mypage/ChangePasswordModal";
import { getClientSessionId } from "@/lib/session";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        login(userData, data.accessToken, []); // cartItems는 비워두고

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
      toast.error("로그인 요청 실패");
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
        <h1 style={titleStyle}>🔑 로그인</h1>
        <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
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
