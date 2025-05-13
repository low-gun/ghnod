import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartReady, setCartReady] = useState(false);

  const refreshCart = async () => {
    try {
      let guestToken = localStorage.getItem("guest_token");

      if (!guestToken) {
        guestToken = crypto.randomUUID();
        localStorage.setItem("guest_token", guestToken);
      }

      const res = await api.get("/cart/items", {
        headers: {
          "x-guest-token": guestToken,
        },
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

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, cartReady, setCartReady, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);

// ✅ 앱 마운트 시 1회 실행될 CartInitializer 컴포넌트
export const CartInitializer = () => {
  const { refreshCart } = useCartContext();

  useEffect(() => {
    refreshCart(); // ✅ 외부 재사용 가능
  }, []);

  return null;
};
