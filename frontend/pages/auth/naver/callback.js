// frontend/pages/auth/naver/callback.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function NaverCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      router.replace("/login?error=no_code_or_state");
      return;
    }

    api.post("/auth/naver/callback", { code, state })
    .then(res => {
      const { accessToken, user, tempToken } = res.data;
      if (accessToken && user) {
        login(user, accessToken);
        router.replace("/");
      } else if (tempToken) {
        router.replace(`/register/social?token=${tempToken}`);
      } else {
        router.replace("/login?error=token-missing");
      }
    })
    .catch(() => {
      router.replace("/login?error=naver-fail");
    });
  }, []);

  return <p>네이버 로그인 처리 중입니다...</p>;
}
