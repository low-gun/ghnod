import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    api.post("/auth/google/callback", { code })  // 반드시 POST!
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
        router.replace("/login?error=google-fail");
      });
  }, []);

  return <p>구글 로그인 처리 중입니다...</p>;
}
