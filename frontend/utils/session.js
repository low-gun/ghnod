// utils/session.js
import { useGlobalAlert } from "@/stores/globalAlert";

export function clearSessionAndNotifyAndRedirect(message) {
  // 상태 초기화
  localStorage.removeItem("token");
  sessionStorage.removeItem("accessToken");
  // zustand 등 전역 유저 상태 초기화 필요시 추가

  // 알림 노출(모바일: 바텀시트, PC: 토스트)
  const isMobile = window.innerWidth <= 480; // 간단히 처리
  useGlobalAlert.getState().showAlert(
    message || "세션이 만료되었습니다. 다시 로그인해주세요.",
    isMobile ? "bottomsheet" : "toast"
  );

  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
}
