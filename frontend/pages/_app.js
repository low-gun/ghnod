// pages/_app.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Script from "next/script";
import "../styles/globals.css";
import { CartProvider, useCartContext } from "../context/CartContext";
import UserProvider from "../context/UserContext";
import GlobalLoadingBar from "@/components/common/GlobalLoadingBar";
import GlobalConfirmModal from "@/components/common/GlobalConfirmModal";
import GlobalAlert from "@/components/common/GlobalAlert";
import GlobalAgreements from "@/components/common/GlobalAgreements";
import useGlobalLoading from "@/stores/globalLoading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/adminTable.css";
import dynamic from "next/dynamic";
const MainLayout = dynamic(
  () => import("../components/layout/MainLayout"),
  { ssr: true } // 레이아웃은 SSR 유지, 단 번들은 분리됨
);
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
        const { default: api } = await import("@/lib/api"); // ✅ 필요 시점에만 로드
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
    console.log(
      "NEXT_PUBLIC_API_BASE_URL:",
      process.env.NEXT_PUBLIC_API_BASE_URL
    );
    console.log(
      "[ENV] KAKAO KEY:",
      process.env.NEXT_PUBLIC_KAKAO_JS_KEY ? "present" : "missing"
    );
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

  const LayoutWrapper = isAdmin
    ? ({ children }) => <>{children}</>
    : ({ children }) => <MainLayout>{children}</MainLayout>;

  // ✅ Kakao SDK 필요 페이지에서만 로드
  const needsKakao =
  !isAdmin &&
  (router.pathname.startsWith("/auth/") ||
    router.pathname === "/register/social");

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
