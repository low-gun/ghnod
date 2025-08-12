import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const { user } = useUserContext();

  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      setCartReady(true);
      return;
    }
    try {
      const res = await api.get("/cart/items", {
        params: { excludeBuyNow: "true" }, // 임시 buyNow 숨김
      });
      if (res.data.success) {
        setCartItems(res.data.items);
      }
    } catch (err) {
      console.warn("🛒 장바구니 fetch 실패:", err.message);
    } finally {
      setCartReady(true);
    }
  };

  // ✅ user 변화(로그인/로그아웃) 시 자동 갱신
  useEffect(() => {
    // user === undefined : 아직 판별 전 → 대기
    if (user === undefined) return;
    setCartReady(false);
    refreshCart();
  }, [user]); // <-- 핵심

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, cartReady, setCartReady, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);
