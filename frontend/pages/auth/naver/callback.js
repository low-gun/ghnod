// frontend/pages/auth/naver/callback.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function NaverCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();
  const { showAlert } = useGlobalAlert();

  // 안전 경로 유틸
  const getSafePath = (p) => {
    if (!p || typeof p !== "string") return "/";
    if (p.startsWith("http://") || p.startsWith("https://")) return "/";
    return p.startsWith("/") ? p : `/${p}`;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__naver_callback_requested) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      router.replace("/login?error=no_code_or_state");
      return;
    }

    const autoLogin = localStorage.getItem("autoLogin") === "true";

    window.__naver_callback_requested = true;
    // 주소창 정리(쿼리 제거) — Next router의 query는 유지됨
    window.history.replaceState({}, document.title, window.location.pathname);

    api
      .post("/auth/naver/callback", { code, state, autoLogin })
      .then((res) => {
        const { accessToken, user, tempToken } = res.data;

        if (accessToken && user) {
          login(user, accessToken);

          const redirect = getSafePath(router.query.redirect);
          if (redirect && redirect !== "/") {
            router.replace(redirect);
          } else if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.replace("/");
          }
          return;
        }

        if (tempToken) {
          router.replace(`/register/social?token=${tempToken}`);
          return;
        }

        router.replace("/login?error=token-missing");
      })
      .catch((err) => {
        const serverMsg = err?.response?.data?.error;
        if (serverMsg) showAlert(serverMsg);
        router.replace("/login?error=naver-fail");
      });
  }, []); // 의도적으로 빈 deps

  return null;
}
