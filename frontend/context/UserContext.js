import { createContext, useState, useEffect, useContext } from "react";
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import { getClientSessionId } from "@/lib/session";
import { useRouter } from "next/router";
import { useCartContext } from "./CartContext";

// 1. UserContext 생성
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  console.log("[UserProvider 진입] 최초 실행, pathname:", typeof window !== "undefined" ? window.location.pathname : "SSR");
  const router = useRouter();

  useEffect(() => {
    console.log("🔵 [UserProvider] MOUNTED");
    return () => {
      console.log("🔴 [UserProvider] UNMOUNTED");
    };
  }, []);

  const { setCartItems, setCartReady } = useCartContext();

  const [user, setUser] = useState(undefined); // 최초엔 undefined
  const [accessToken, setAccessToken] = useState(null);

  // ✅ guest 장바구니 → 유저로 이전
  const migrateGuestCart = async (token) => {
    const guestToken = localStorage.getItem("guest_token");
    if (!guestToken || !token) return;
    try {
      await api.post("/cart/migrate", null, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-guest-token": guestToken,
        },
      });
      console.log("✅ 게스트 장바구니 → 유저로 이전 완료");
      localStorage.removeItem("guest_token");
    } catch (err) {
      console.error("❌ 장바구니 이전 실패:", err);
    }
  };

  // ✅ accessToken 복구 및 자동 요청
  useEffect(() => {
    console.log("[UserContext] useEffect 실행, path:", router.pathname);

    if (router.pathname === "/login") return;

    const storedToken = sessionStorage.getItem("accessToken");
    const cookieToken = getCookie("accessToken");

    console.log("[UserContext] sessionStorage accessToken:", storedToken);
    console.log("[UserContext] getCookie accessToken:", cookieToken);

    if (storedToken) {
      setAccessToken(storedToken);
      applyAccessTokenToAxios(storedToken);
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } else if (cookieToken) {
      setAccessToken(cookieToken);
      applyAccessTokenToAxios(cookieToken);
      sessionStorage.setItem("accessToken", cookieToken);
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
      const sessionId = getClientSessionId();
      api.post("/auth/refresh-token", { clientSessionId: sessionId }, { withCredentials: true })
        .then((res) => {
          const newAccessToken = res.data.accessToken;
          console.log("[UserContext] refresh-token 응답 accessToken:", newAccessToken);
          setAccessToken(newAccessToken);
          applyAccessTokenToAxios(newAccessToken);
          sessionStorage.setItem("accessToken", newAccessToken);
          const storedUser = localStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
        })
        .catch((err) => {
          const protectedRoutes = [
            "/mypage", "/orders", "/checkout", "/admin"
          ];
          const isProtected = protectedRoutes.some((path) =>
            router.pathname === path || router.pathname.startsWith(path + "/")
          );
          if (
            isProtected &&
            router.pathname !== "/login"
          ) {
            logout();
            router.replace("/login");
          }
        });
    }
  }, [router.pathname]);

  // ✅ accessToken 변경 시 유저 정보 요청
  useEffect(() => {
    console.log("[UserContext] accessToken 변경:", accessToken);
    if (!accessToken) return;
    if (user !== undefined) return;
    api.get("/user")
      .then(res => {
        console.log("[UserContext] /user 응답:", res.data);
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      })
      .catch(err => {
        const protectedRoutes = [
          "/mypage", "/orders", "/checkout", "/admin"
        ];
        const isProtected = protectedRoutes.some(path =>
          router.pathname === path || router.pathname.startsWith(path + "/")
        );
        if (isProtected) {
          logout();
          router.replace("/login");
        }
      });
  }, [accessToken]);

  // ✅ user 값 변경 콘솔
  useEffect(() => {
    console.log("[UserContext] user 변경:", user);
  }, [user]);

  // 3️⃣ 로그인 시 호출
  const login = (userData, token, cartItems = []) => {
    console.log("[UserContext.login] 호출됨 userData:", userData);
    console.log("[UserContext.login] 받은 token:", token);
    setUser(userData);
    setAccessToken(token);
    applyAccessTokenToAxios(token);
    console.log("[UserContext.login] setAccessToken 후 api.defaults.headers.common['Authorization']:", api.defaults.headers.common["Authorization"]);
    migrateGuestCart(token);

    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("accessToken", token);

    setCartItems(cartItems);
    setCartReady(true);
  };

  // 4️⃣ 로그아웃 시 호출
  const logout = async () => {
    console.log("[UserContext] 로그아웃 함수 진입");
    const clientSessionId = getClientSessionId();

    if (!clientSessionId) {
      console.warn("❗ 로그아웃 중단: clientSessionId 없음");
      return;
    }

    try {
      await api.post("/auth/logout", { clientSessionId });
    } catch (err) {
      console.warn("❌ 서버 로그아웃 실패:", err.message);
    }

    setUser(null);
    setAccessToken(null);
    applyAccessTokenToAxios(null);
    delete api.defaults.headers.common["Authorization"];

    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");

    const newGuestToken = crypto.randomUUID();
    localStorage.setItem("guest_token", newGuestToken);

    setCartItems([]);
    setCartReady(false);

    router.push("/login");
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, accessToken, setAccessToken, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};
export default UserProvider;