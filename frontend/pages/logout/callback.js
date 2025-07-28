import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";

export default function LogoutCallback() {
  const router = useRouter();
  const { logout } = useContext(UserContext);

  useEffect(() => {
    api.post("/auth/logout", {
      clientSessionId: typeof window !== "undefined" ? sessionStorage.getItem("clientSessionId") : undefined,
    })
      .catch(() => {}) // 실패 무시
      .finally(() => {
        logout && logout();
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("clientSessionId");
        localStorage.removeItem("autoLogin");
        router.replace("/login");
      });
  }, [logout, router]);

  return null; // 아무것도 렌더링하지 않음
}
