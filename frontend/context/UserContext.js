import { createContext, useState, useEffect, useContext, useMemo } from "react";
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import { getClientSessionId } from "@/lib/session";
import { useRouter } from "next/router";
import { useCartContext } from "./CartContext";
import { clearSessionAndNotifyAndRedirect } from "@/utils/session";

// ✅ 전역 세션 만료 중복 실행 방지 플래그
let globalSessionExpiredUserCtx = false;

// 1. UserContext 생성
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    console.log("🔵 [UserProvider] MOUNTED");
    return () => {
      console.log("🔴 [UserProvider] UNMOUNTED");
    };
  }, []);

  const { setCartItems, setCartReady } = useCartContext();

  const [user, setUser] = useState(undefined);
  const [accessToken, setAccessToken] = useState(null);

  // === 공용 유틸 ===
  function isSameUser(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    return (
      a.id === b.id &&
      a.email === b.email &&
      a.username === b.username &&
      a.role === b.role
    );
  }

  const setAccessTokenSafe = (token) => {
    setAccessToken((prev) => (prev === token ? prev : token));
  };

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
      localStorage.removeItem("guest_token");
    } catch (err) {
      console.error("❌ 장바구니 이전 실패:", err);
    }
  };

  // ✅ accessToken 복구 및 자동 요청
  useEffect(() => {
    if (router.pathname === "/login") return;

    const storedToken = sessionStorage.getItem("accessToken");
    const cookieToken = getCookie("accessToken");

    if (storedToken) {
      // 세션 저장소 토큰 우선
      setAccessTokenSafe(storedToken);
      applyAccessTokenToAxios(storedToken);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser((prev) => (isSameUser(prev, parsed) ? prev : parsed));
      }
    } else if (cookieToken) {
      // 쿠키 토큰 복구
      setAccessTokenSafe(cookieToken);
      applyAccessTokenToAxios(cookieToken);
      sessionStorage.setItem("accessToken", cookieToken);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser((prev) => (isSameUser(prev, parsed) ? prev : parsed));
      }
    } else {
      // ❌ 이전 코드: setUser(null) 선호출 → 불필요 리렌더 유발
      // ⬇️ 리프레시 실패가 확정될 때만 null 처리
      const sessionId = getClientSessionId();
      api
        .post(
          "/auth/refresh-token",
          { clientSessionId: sessionId },
          { withCredentials: true }
        )
        .then((res) => {
          const newAccessToken = res.data.accessToken;
          setAccessTokenSafe(newAccessToken);
          applyAccessTokenToAxios(newAccessToken);
          sessionStorage.setItem("accessToken", newAccessToken);
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser((prev) => (isSameUser(prev, parsed) ? prev : parsed));
          }
        })
        .catch((err) => {
          // 리프레시 실패 확정 시에만 null 처리
          setUser((prev) => (prev === null ? prev : null));

          // 401/403/419 발생 시 강제 로그아웃+알림
          if (err.response && [401, 403, 419].includes(err.response.status)) {
            if (!globalSessionExpiredUserCtx) {
              globalSessionExpiredUserCtx = true;
              clearSessionAndNotifyAndRedirect(
                "세션이 만료되었습니다. 다시 로그인해주세요."
              );
            }
            return;
          }
          // 그 외 예전 분기(특정 페이지에서만)
          const protectedRoutes = ["/mypage", "/orders", "/checkout", "/admin"];
          const isProtected = protectedRoutes.some(
            (path) =>
              router.pathname === path || router.pathname.startsWith(path + "/")
          );
          if (isProtected && router.pathname !== "/login") {
            logout();
            router.replace("/login");
          }
        });
    }
  }, [router.pathname]);

  // ✅ accessToken 변경 시 유저 정보 요청
  useEffect(() => {
    if (!accessToken) return;
    if (user !== undefined) return; // 이미 user가 세팅됐으면 중복 요청 방지
    api
      .get("/user")
      .then((res) => {
        if (res.data.success && res.data.user) {
          setUser((prev) =>
            isSameUser(prev, res.data.user) ? prev : res.data.user
          );
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        // 401/403/419 발생 시 강제 로그아웃+알림
        if (err.response && [401, 403, 419].includes(err.response.status)) {
          if (!globalSessionExpiredUserCtx) {
            globalSessionExpiredUserCtx = true;
            clearSessionAndNotifyAndRedirect(
              "세션이 만료되었습니다. 다시 로그인해주세요."
            );
          }
          return;
        }
        // 그 외 예전 분기(특정 페이지에서만)
        const protectedRoutes = ["/mypage", "/orders", "/checkout", "/admin"];
        const isProtected = protectedRoutes.some(
          (path) =>
            router.pathname === path || router.pathname.startsWith(path + "/")
        );
        if (isProtected) {
          logout();
          router.replace("/login");
        }
      });
  }, [accessToken, user]);

  // user 값 변경 콘솔
  useEffect(() => {
    console.log("[UserContext] user 변경:", user);
  }, [user]);

  // 로그인 시 호출
  const login = (userData, token, cartItems = []) => {
    setUser((prev) => (isSameUser(prev, userData) ? prev : userData));
    setAccessTokenSafe(token);
    applyAccessTokenToAxios(token);
    migrateGuestCart(token);

    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("accessToken", token);

    setCartItems(cartItems);
    setCartReady(true);
  };

  // 로그아웃 시 호출
  const logout = async () => {
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

    setUser((prev) => (prev === null ? prev : null));
    setAccessTokenSafe(null);
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

  // Provider value 참조 안정화
  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      accessToken,
      setAccessToken: setAccessTokenSafe,
      login,
      logout,
    }),
    [user, accessToken] // 실제 변경시에만 새 객체
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
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
