import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { useGlobalLoading } from "@/stores/globalLoading"; // ← 전역 로딩 훅 import

export default function LogoutCallback() {
  const router = useRouter();
  const { logout } = useContext(UserContext);
  const setLoading = useGlobalLoading(state => state.setLoading);

  useEffect(() => {
    setLoading(true); // 로딩 시작
    api.post("/auth/logout", {
      clientSessionId: typeof window !== "undefined" ? sessionStorage.getItem("clientSessionId") : undefined,
    })
      .catch(() => {}) // 실패 무시
      .finally(() => {
        logout && logout();
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("clientSessionId");
        localStorage.removeItem("autoLogin");
        setLoading(false); // 로딩 끝
        router.replace("/login");
      });
  }, [logout, router, setLoading]);

  return null; // 아무것도 렌더링하지 않음 (로딩바만 보임)
}
