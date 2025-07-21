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
    // 👇 강제 렌더 확인 로그
    console.log("✅✅✅ [login.js] 렌더 강제 확인!! 이 로그가 찍히면 컴포넌트 정상 렌더 중");
  
    // 👇 진짜 강제 렌더 div만 남김(조건, 폼, 분기 다 제거)
    return (
      <div style={{
        fontSize: "32px",
        color: "red",
        background: "white",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        로그인페이지 강제 렌더!!
      </div>
    );
  }