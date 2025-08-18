import { useContext } from "react";
import { useRouter } from "next/router";
import { UserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function LogoutButton({ collapsed = false }) {
  const { logout, user } = useContext(UserContext);
  const router = useRouter();

  const KAKAO_LOGOUT_URL = `https://kauth.kakao.com/oauth/logout?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&logout_redirect_uri=https://ghnod.vercel.app/logout/callback`;
  const NAVER_LOGOUT_URL = `https://nid.naver.com/nidlogin.logout?returl=https://ghnod.vercel.app/logout/callback`;
  const { showAlert } = useGlobalAlert(); // ✅ 추가

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
        body: JSON.stringify({
          clientSessionId: sessionStorage.getItem("clientSessionId"),
        }),
      });

      logout();
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("clientSessionId");
      localStorage.removeItem("autoLogin");

      showAlert("로그아웃 되었습니다.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      showAlert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        minHeight: "44px",
        padding: "10px 12px",
        background: "transparent",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        color: "#fff",
        transition: "background 0.15s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m16 17 5-5-5-5"></path>
        <path d="M21 12H9"></path>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      </svg>
      {!collapsed && <span style={{ marginLeft: "2px" }}>로그아웃</span>}
    </button>
  );
}
