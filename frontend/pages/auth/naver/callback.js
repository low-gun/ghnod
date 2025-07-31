import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function NaverCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__naver_callback_requested) return;
    const { showAlert } = useGlobalAlert(); // ✅ 추가
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      router.replace("/login?error=no_code_or_state");
      return;
    }

    // ✅ autoLogin 값 읽어서 같이 넘김
    const autoLogin = localStorage.getItem("autoLogin") === "true";

    window.__naver_callback_requested = true;
    window.history.replaceState({}, document.title, window.location.pathname);

    api
      .post("/auth/naver/callback", { code, state, autoLogin })
      .then((res) => {
        const { accessToken, user, tempToken } = res.data;
        if (accessToken && user) {
          login(user, accessToken);
          if (user.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/");
          }
        } else if (tempToken) {
          router.replace(`/register/social?token=${tempToken}`);
        } else {
          router.replace("/login?error=token-missing");
        }
      })
      .catch((err) => {
        const serverMsg = err?.response?.data?.error;
        if (serverMsg) {
          showAlert(serverMsg);
        }
        router.replace("/login?error=naver-fail");
      });
  }, []);

  return null; // 처리 중에는 아무것도 표시하지 않음
}
