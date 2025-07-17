// frontend/pages/auth/kakao/callback.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    api.post("/auth/kakao/callback", { code })
      .then(res => {
        const { accessToken, user } = res.data;
        if (accessToken && user) {
          login(user, accessToken);
          router.replace("/");
        } else {
          router.replace("/login?error=token-missing");
        }
      })
      .catch(() => {
        router.replace("/login?error=kakao-fail");
      });
  }, []);

  return <p>카카오 로그인 처리 중입니다...</p>;
}
