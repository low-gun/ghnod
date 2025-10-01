// pages/_app.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Script from "next/script";
import MainLayout from "../components/layout/MainLayout";
import "../styles/globals.css";
import { CartProvider, useCartContext } from "../context/CartContext";
import UserProvider from "../context/UserContext";
import api from "@/lib/api";
import GlobalLoadingBar from "@/components/common/GlobalLoadingBar";
import GlobalConfirmModal from "@/components/common/GlobalConfirmModal";
import GlobalAlert from "@/components/common/GlobalAlert";
import GlobalAgreements from "@/components/common/GlobalAgreements";
import useGlobalLoading from "@/stores/globalLoading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/adminTable.css";

function CartInitializer() {
  const { setCartItems, setCartReady } = useCartContext();

  useEffect(() => {
    const fetchCart = async () => {
      let guestToken = localStorage.getItem("guest_token");

      if (!guestToken) {
        guestToken = crypto.randomUUID();
        localStorage.setItem("guest_token", guestToken);
      }

      try {
        const res = await api.get("/cart/items", {
          headers: {
            "x-guest-token": guestToken,
          },
        });
        if (res.data.success) {
          setCartItems(res.data.items);
        }
        setCartReady(true);
      } catch (err) {
        console.warn("🛒 장바구니 초기화 실패:", err.message);
      }
    };

    fetchCart();
  }, []);

  return null;
}

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");
  const showLoading = useGlobalLoading((state) => state.showLoading);
  const hideLoading = useGlobalLoading((state) => state.hideLoading);
  const startRef = useRef(0);
  const timeoutRef = useRef(null);

  // 어드민 경로일 때 body 클래스 토글
  useEffect(() => {
    document.body.classList.toggle("admin-page", isAdmin);
    return () => document.body.classList.remove("admin-page");
  }, [isAdmin]);

useEffect(() => {
  // 환경변수 체크 로그 제거
}, []);

  useEffect(() => {
    const handleStart = () => {
      startRef.current = Date.now();
      showLoading();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        hideLoading();
        console.warn("⏱ 로딩이 30초 이상 지속되어 자동 종료되었습니다.");
      }, 30000);
    };

    const handleEnd = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const elapsed = Date.now() - startRef.current;
      const delay = Math.max(300 - elapsed, 0);
      setTimeout(hideLoading, delay);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleEnd);
    router.events.on("routeChangeError", handleEnd);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleEnd);
      router.events.off("routeChangeError", handleEnd);
    };
  }, [router, showLoading, hideLoading]);

  // ✅ 라우트 변경 후 스크롤 초기화 + 콘솔
  useEffect(() => {
    const handleRouteChange = (url) => {
      console.log("[ScrollCheck] before=", window.pageYOffset);
      window.scrollTo(0, 0);
document.body.scrollTop = 0; // ✅ body 스크롤도 같이 초기화
document.documentElement.scrollTop = 0; // ✅ 크로스 브라우저 대응
      setTimeout(() => {
        console.log("[ScrollCheck] after=", window.pageYOffset);
      }, 50);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router]);

  const LayoutWrapper = isAdmin
    ? ({ children }) => <>{children}</>
    : ({ children }) => <MainLayout>{children}</MainLayout>;

  // ✅ Kakao SDK 필요 페이지에서만 로드
  const needsKakao =
  !isAdmin &&
  (router.asPath.startsWith("/auth/") ||
   router.asPath.startsWith("/register/social") ||
   router.asPath.startsWith("/diagnosis/") ||
   router.asPath.startsWith("/orgdev/") ||
   router.asPath.startsWith("/leadership/") ||
   router.asPath.startsWith("/opencourse/"));
  return (
    <>
      {/* 전역 viewport 설정 */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>

      {/* Kakao JavaScript SDK: 필요한 페이지에서만 로드 */}
      {needsKakao && (
        <Script
          id="kakao-sdk"
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            const checkKakao = setInterval(() => {
              if (window.Kakao) {
                if (!window.Kakao.isInitialized()) {
                  if (!process.env.NEXT_PUBLIC_KAKAO_JS_KEY) {
                    console.warn("[Kakao] NEXT_PUBLIC_KAKAO_JS_KEY missing");
                  }
                  window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
                }
                clearInterval(checkKakao);
              }
            }, 200);
            setTimeout(() => clearInterval(checkKakao), 5000);
          }}
          onError={(e) => console.error("[Kakao] script load error", e)}
          crossOrigin="anonymous"
        />
      )}

      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <CartProvider>
            <GlobalLoadingBar />
            <GlobalAlert />
            <GlobalConfirmModal />
            <GlobalAgreements />

            {!isAdmin && <CartInitializer />}

            <LayoutWrapper>
              <Component {...pageProps} />
            </LayoutWrapper>
          </CartProvider>
        </UserProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
