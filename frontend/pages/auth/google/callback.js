import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();

  useEffect(() => {
    const fetchGoogleLogin = async () => {
      try {
        const res = await api.get("/auth/google/callback" + window.location.search, {
          withCredentials: true,
        });

        const { accessToken, user } = res.data;

        if (accessToken && user) {
          login(user, accessToken); // sessionStorage에 저장됨
          router.replace("/"); // 원하는 경로로 이동
        } else {
          router.replace("/login?error=token-missing");
        }
      } catch (err) {
        console.error("소셜 로그인 실패:", err);
        router.replace("/login?error=google-fail");
      }
    };

    fetchGoogleLogin();
  }, []);

  return <p>구글 로그인 처리 중입니다...</p>;
}
