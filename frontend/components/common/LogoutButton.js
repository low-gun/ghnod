import { useContext } from "react";
import { useRouter } from "next/router";
import { UserContext } from "@/context/UserContext";

export default function LogoutButton({ collapsed = false }) {
  const { logout, user } = useContext(UserContext);
  const router = useRouter();

  const KAKAO_LOGOUT_URL = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&logout_redirect_uri=https://YOUR_DOMAIN/logout/callback`;
  const NAVER_LOGOUT_URL = `https://nid.naver.com/nidlogin.logout?returl=https://ghnod.vercel.app/logout/callback`;

  const handleLogout = async () => {
    // 소셜로그인 분기
    if (user?.socialProvider === "kakao") {
      window.location.href = KAKAO_LOGOUT_URL;
      return;
    }
    if (user?.socialProvider === "naver") {
      window.location.href = NAVER_LOGOUT_URL;
      return;
    }

    // 일반 로그아웃 처리
    try {
      await fetch("/api/user/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSessionId: sessionStorage.getItem("clientSessionId") }),
      });

      logout();
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("clientSessionId");
      localStorage.removeItem("autoLogin");

      toast.success("로그아웃 되었습니다.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#fff",
      }}
    >
      🔒 {!collapsed && <span style={{ marginLeft: "10px" }}>로그아웃</span>}
    </button>
  );
}
