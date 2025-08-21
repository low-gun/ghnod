// pages/_app.js
import Head from "next/head"; // ✅ 추가
import { useRouter } from "next/router";
import { useEffect, useRef } from "react"; // ✅ useRef 추가
import Script from "next/script";
import MainLayout from "../components/layout/MainLayout";
import "../styles/globals.css";
import { CartProvider, useCartContext } from "../context/CartContext";
import UserProvider from "../context/UserContext";
import api from "@/lib/api";
import GlobalLoadingBar from "@/components/common/GlobalLoadingBar";
import GlobalConfirmModal from "@/components/common/GlobalConfirmModal";
import GlobalAlert from "@/components/common/GlobalAlert";
import useGlobalLoading from "@/stores/globalLoading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/adminTable.css"; // ✅ 추가

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
const isAdmin = router.pathname.startsWith("/admin"); // ✅ 추가
const showLoading = useGlobalLoading((state) => state.showLoading);

  const hideLoading = useGlobalLoading((state) => state.hideLoading);
  const startRef = useRef(0);      // ✅ 변경
const timeoutRef = useRef(null); // ✅ 변경

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
      startRef.current = Date.now(); // ✅ 변경
      showLoading();
    
      if (timeoutRef.current) clearTimeout(timeoutRef.current); // ✅ 중복 타이머 방지
      timeoutRef.current = setTimeout(() => {
        hideLoading();
        console.warn("⏱ 로딩이 30초 이상 지속되어 자동 종료되었습니다.");
      }, 30000);
    };
    
    const handleEnd = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current); // ✅ 변경
      const elapsed = Date.now() - startRef.current;            // ✅ 변경
      const delay = Math.max(300 - elapsed, 0);
      setTimeout(hideLoading, delay);
    };
    

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleEnd);
    router.events.on("routeChangeError", handleEnd);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current); // ✅ 변경
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleEnd);
      router.events.off("routeChangeError", handleEnd);
    };
  }, [router]);

  const LayoutWrapper = router.pathname.startsWith("/admin")
    ? ({ children }) => <>{children}</>
    : ({ children }) => <MainLayout>{children}</MainLayout>;

  return (
    <>
      {/* ✅ 전역 viewport 설정 */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>

      {/* ✅ Kakao JavaScript SDK 로드 및 초기화 보장 */}
      {!isAdmin && (
  <Script
    id="kakao-sdk"
    src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
    strategy="afterInteractive" // ✅ 변경
    onLoad={() => {
      console.log("[Kakao] script tag loaded, checking window.Kakao...");
      const checkKakao = setInterval(() => {
        if (window.Kakao) {
          console.log("[Kakao] object found");
          if (!window.Kakao.isInitialized()) {
            if (!process.env.NEXT_PUBLIC_KAKAO_JS_KEY) {
              console.warn("[Kakao] NEXT_PUBLIC_KAKAO_JS_KEY missing");
            }
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
            console.log("[Kakao] initialized:", window.Kakao.isInitialized());
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
