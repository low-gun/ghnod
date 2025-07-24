import { useContext } from "react";
import { useRouter } from "next/router";
import { UserContext } from "@/context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // ✅ 잊지 말고 import

export default function LogoutButton({ collapsed = false }) {
  const { logout } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientSessionId: sessionStorage.getItem("clientSessionId"),
        }),
      });

      // ✅ 상태 초기화
      logout(); // context 초기화
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("clientSessionId");
      localStorage.removeItem("autoLogin");       // ← 이 한 줄 추가하면 끝


      // ✅ 사용자에게 피드백
      toast.success("로그아웃 되었습니다.");

      // ✅ 리디렉션 (뒤로가기 방지)
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
