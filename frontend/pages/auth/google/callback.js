import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();
  const didRequest = useRef(false);

  useEffect(() => {
    // 딱 1회만 실행
    if (didRequest.current) return;
    didRequest.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    console.log("[callback] 쿼리 code:", code);

    // URL 쿼리스트링 제거 (중복 요청 방지)
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!code) {
      console.log("[callback] code 없음 → /login?error=no_code 이동");
      router.replace("/login?error=no_code");
      return;
    }

    api.post("/auth/google/callback", { code })
      .then(res => {
        console.log("[callback] 서버 응답 res.data:", res.data);
        const { accessToken, user, tempToken } = res.data;

        if (accessToken && user) {
          console.log("[callback] 로그인 성공, user:", user, "accessToken:", accessToken);
        
          // 여기서 accessToken 값 반드시 확인!
          console.log("[callback.js] login 호출 직전 accessToken:", accessToken);
        
          login(user, accessToken);
          router.replace("/");
          return;
        }
        
        if (tempToken) {
          console.log("[callback] 신규 소셜유저, tempToken:", tempToken);
          router.replace(`/register/social?token=${tempToken}`);
          return;
        }
        console.log("[callback] 토큰 없음 → /login?error=token-missing 이동");
        router.replace("/login?error=token-missing");
      })
      .catch((err) => {
        console.error("[callback] catch 에러:", err);
        router.replace("/login?error=google-fail");
      });
  }, []); // 반드시 빈 배열!

  return <p>구글 로그인 처리 중입니다...</p>;
}
