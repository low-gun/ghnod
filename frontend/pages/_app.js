import { useRouter } from "next/router";
import { useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import "../styles/globals.css";

import { CartProvider, useCartContext } from "../context/CartContext"; // ✅ CartProvider 바깥으로
import { UserProvider } from "../context/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/lib/api";

function CartInitializer() {
  const { setCartItems, setCartReady } = useCartContext(); // ✅ 추가

  useEffect(() => {
    const fetchCart = async () => {
      let guestToken = localStorage.getItem("guest_token");

      // ✅ 없으면 자동 생성
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
        setCartReady(true); // ✅ 성공/실패와 관계없이 항상 호출
      } catch (err) {
        console.warn("🛒 장바구니 초기화 실패:", err.message);
      }
    };

    fetchCart();
  }, []);

  return null;
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const LayoutWrapper = router.pathname.startsWith("/admin")
    ? ({ children }) => <>{children}</>
    : ({ children }) => <MainLayout>{children}</MainLayout>;

  return (
    <CartProvider>
      {" "}
      {/* ✅ CartProvider 최상단 */}
      <UserProvider>
        <CartInitializer />
        <LayoutWrapper>
          <Component {...pageProps} />
        </LayoutWrapper>
        <ToastContainer position="top-right" autoClose={2000} />
      </UserProvider>
    </CartProvider>
  );
}

export default MyApp;
