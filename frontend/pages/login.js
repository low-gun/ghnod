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
    console.log("✅✅✅ [login.js] 렌더 강제 확인!! 이 로그가 찍히면 컴포넌트 정상 렌더 중");
  
    // ...state, useContext, etc. 생략 (필요 없는 부분 지워도 됨)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [userId, setUserId] = useState(null);
    const router = useRouter();
    const { user, login } = useContext(UserContext);
    const { setCartItems, setCartReady } = useCartContext();
    const isMobile = false; // useIsMobile() 지워도 됨
  
    // ⭐️ 조건부 return만 남김
    if (user?.id) return null;
  
    // 👇 로그인 폼 전체 복원
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
          width: "360px",
          padding: "40px",
          borderRadius: "8px",
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
          boxSizing: "border-box",
        }}>
          <h1 style={{ fontSize: "24px", margin: 0 }}>로그인</h1>
          <form
            onSubmit={e => { e.preventDefault(); alert("submit!"); }}
            autoComplete="off"
            style={{ textAlign: "left" }}
          >
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
          </form>
        </div>
      </div>
    );
  }