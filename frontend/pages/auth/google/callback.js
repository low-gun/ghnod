import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    // SSR/StrictMode 대응: 브라우저에서만 동작
    if (typeof window === "undefined") return;

    // 중복 요청 완전 방지 (전역 락)
    if (window.__google_callback_requested) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // code 없으면 종료
    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    // 전역 락
    window.__google_callback_requested = true;

    // code로 요청 직전에 쿼리스트링 제거
    window.history.replaceState({}, document.title, window.location.pathname);

    api.post("/auth/google/callback", { code })
      .then(res => {
        const { accessToken, user, tempToken } = res.data;

        if (accessToken && user) {
          login(user, accessToken);
          router.replace("/");
          return;
        }

        if (tempToken) {
          router.replace(`/register/social?token=${tempToken}`);
          return;
        }

        router.replace("/login?error=token-missing");
      })
      .catch((err) => {
        router.replace("/login?error=google-fail");
      });
  }, [router]);

  return <p>구글 로그인 처리 중입니다...</p>;
}
