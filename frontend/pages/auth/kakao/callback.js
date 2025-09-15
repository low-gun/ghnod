// frontend/pages/auth/kakao/callback.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";
import Head from "next/head"; // 👈 추가

// 안전 경로 유틸
const getSafePath = (p) => {
  if (!p || typeof p !== "string") return "/";
  if (p.startsWith("http://") || p.startsWith("https://")) return "/";
  if (p.startsWith("//")) return "/"; // 프로토콜 상대 URL 차단
  return p.startsWith("/") ? p : `/${p}`;
};


export default function KakaoCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__kakao_callback_requested) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    const autoLogin = localStorage.getItem("autoLogin") === "true";

    window.__kakao_callback_requested = true;
    // 주소창 정리(쿼리 제거)
    window.history.replaceState({}, document.title, window.location.pathname);

    api
      .post("/auth/kakao/callback", { code, autoLogin })
      .then((res) => {
        const { accessToken, user, tempToken } = res.data;

        if (accessToken && user) {
          login(user, accessToken);
        
          const redirect = getSafePath(router.query.redirect);
          if (redirect && redirect !== "/") {
            router.replace(redirect);
          } else if (user?.role === "admin") {
            router.replace("/admin");
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
        router.replace("/login?error=kakao-fail");
      });
  }, []); // 의도적으로 빈 deps

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {/* 처리 중에는 아무것도 표시하지 않음 */}
    </>
  ); // 처리 중에는 아무것도 표시하지 않음
}
