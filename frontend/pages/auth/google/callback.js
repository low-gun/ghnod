import { useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useUserContext();
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__google_callback_requested) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    window.__google_callback_requested = true;
    window.history.replaceState({}, document.title, window.location.pathname);

    const autoLogin = localStorage.getItem("autoLogin") === "true"; // 값 읽기
    api
      .post("/auth/google/callback", { code, autoLogin })
      .then((res) => {
        const { accessToken, user, tempToken } = res.data;
        console.log("[callback] res.data:", res.data);

        if (accessToken && user) {
          console.log("[callback] 기존 유저, 홈 이동");
          login(user, accessToken);
          if (user.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/");
          }
          return;
        }
        if (tempToken) {
          console.log("[callback] 신규 유저 tempToken:", tempToken);
          router.replace(`/register/social?token=${tempToken}`);
          return;
        }
        console.log("[callback] 토큰 없음, /login 이동");
        router.replace("/login?error=token-missing");
      })
      .catch((err) => {
        const serverMsg = err?.response?.data?.error;
        console.log("[callback] catch 에러:", err, serverMsg);
        if (serverMsg) {
          showAlert(serverMsg);
          router.replace("/login");
          return;
        }
        router.replace("/login?error=google-fail");
      });
  }, []);

  return null; //
}
