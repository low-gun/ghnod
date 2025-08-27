// frontend/pages/logout/callback.js
import { useEffect } from "react";
import { useUserContext } from "@/context/UserContext";

export default function LogoutCallback() {
  const { logout } = useUserContext();

  useEffect(() => {
    // UserContext.logout() 안에 서버 호출 + 세션정리 + 이동(이전 페이지 복귀)이 모두 포함됨
    logout?.();
  }, [logout]);

  return null;
}
