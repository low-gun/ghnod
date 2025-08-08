import { useRouter } from "next/router";
import { useRef, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import "../styles/globals.css";
import { CartProvider, useCartContext } from "../context/CartContext";
import UserProvider from "../context/UserContext";
import api from "@/lib/api";
import GlobalLoadingBar from "@/components/common/GlobalLoadingBar";
import GlobalConfirmModal from "@/components/common/GlobalConfirmModal"; // 추가
import GlobalAlert from "@/components/common/GlobalAlert";
import useGlobalLoading from "@/stores/globalLoading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/customCalendar.css";

function CartInitializer() {
  const { setCartItems, setCartReady } = useCartContext();
  const didInitRef = useRef(false); // ⬅ 개발모드 이펙트 2회 실행 가드

  useEffect(() => {
    if (didInitRef.current) return; // ⬅ 두 번째 실행 차단
    didInitRef.current = true;

    const fetchCart = async () => {
      let guestToken = localStorage.getItem("guest_token");

      if (!guestToken) {
        guestToken = crypto.randomUUID();
        localStorage.setItem("guest_token", guestToken);
      }

      try {
        const res = await api.get("/cart/items", {
          headers: { "x-guest-token": guestToken },
        });

        if (res.data?.success && Array.isArray(res.data.items)) {
          setCartItems(res.data.items);
        }
        // 성공/실패와 무관하게 최소 준비 완료는 1회만 표시
        setCartReady(true);
      } catch (err) {
        console.warn("🛒 장바구니 초기화 실패:", err.message);
        setCartReady(true); // 실패해도 중복 렌더 방지 위해 1회만 ready
      }
    };

    fetchCart();
  }, []);

  return null;
}
const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const showLoading = useGlobalLoading((state) => state.showLoading);
  const hideLoading = useGlobalLoading((state) => state.hideLoading);
  let startTime = 0;
  let maxTimeout = null;

  useEffect(() => {
    console.log(
      "NEXT_PUBLIC_API_BASE_URL:",
      process.env.NEXT_PUBLIC_API_BASE_URL
    );
  }, []);

  useEffect(() => {
    const handleStart = () => {
      startTime = Date.now();
      showLoading();

      maxTimeout = setTimeout(() => {
        hideLoading();
        console.warn("⏱ 로딩이 10초 이상 지속되어 자동 종료되었습니다.");
      }, 30000);
    };

    const handleEnd = () => {
      clearTimeout(maxTimeout);
      const elapsed = Date.now() - startTime;
      const delay = Math.max(300 - elapsed, 0);
      setTimeout(hideLoading, delay);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleEnd);
    router.events.on("routeChangeError", handleEnd);

    return () => {
      clearTimeout(maxTimeout);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleEnd);
      router.events.off("routeChangeError", handleEnd);
    };
  }, [router]);

  const LayoutWrapper = router.pathname.startsWith("/admin")
    ? ({ children }) => <>{children}</>
    : ({ children }) => <MainLayout>{children}</MainLayout>;

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CartInitializer />
        <UserProvider>
          <GlobalLoadingBar />
          <GlobalAlert />
          <GlobalConfirmModal /> {/* 👈 여기에 추가 */}
          <LayoutWrapper>
            <Component {...pageProps} />
          </LayoutWrapper>
        </UserProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
export default MyApp;
