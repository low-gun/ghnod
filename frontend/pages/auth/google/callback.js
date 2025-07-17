import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    const handleGoogleLogin = async () => {
      try {
        const res = await api.get("/auth/google/callback" + window.location.search);
        const { accessToken, user } = res.data;

        if (accessToken && user) {
          login(user, accessToken); // sessionStorage에도 저장됨
          router.replace("/");
        } else {
          router.replace("/login?error=token-missing");
        }
      } catch (err) {
        console.error("소셜 로그인 실패:", err);
        router.replace("/login?error=google-fail");
      }
    };

    handleGoogleLogin();
  }, []);

  return <p>로그인 처리 중입니다...</p>;
}
