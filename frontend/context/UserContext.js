import { createContext, useState, useEffect, useContext } from "react";
import api, { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import { getClientSessionId } from "@/lib/session";
import { useRouter } from "next/router";
import { clearSessionAndNotifyAndRedirect } from "@/utils/session";

// ✅ 전역 세션 만료 중복 실행 방지 플래그
let globalSessionExpiredUserCtx = false;

// 1. UserContext 생성
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    // UserProvider mount/unmount 로그 제거
    return () => {};
  }, []);

  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
// 안전한 경로 유틸 (외부 URL 차단)
const getSafePath = (p) => {
  try {
    if (!p || typeof p !== "string") return "/";
    if (p.startsWith("http://") || p.startsWith("https://")) return "/";
    return p.startsWith("/") ? p : `/${p}`;
  } catch { return "/"; }
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
    // ✅ refresh-token 시도를 건너뛸 경로(콜백/로그인/로그아웃 콜백)
    const skipRefresh = [
      "/login",
      "/logout/callback",
      "/auth/google/callback",
      "/auth/kakao/callback",
      "/auth/naver/callback",
    ];
    if (skipRefresh.some((p) => router.pathname.startsWith(p))) {
      // 최초 렌더에서 user가 undefined면 최소 null로 초기화
      setUser((u) => (u === undefined ? null : u));
      return;
    }
  
    const storedToken = sessionStorage.getItem("accessToken");
    const cookieToken = getCookie("accessToken");
  
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
      // ✅ refreshToken 쿠키 없으면 호출 자체를 스킵
      const hasRefresh =
        typeof document !== "undefined" &&
        document.cookie.includes("refreshToken=");
  
      if (!hasRefresh) {
        setUser(null);
        return;
      }
  
      const sessionId = getClientSessionId();
      api
        .post(
          "/auth/refresh-token",
          { clientSessionId: sessionId },
          { withCredentials: true }
        )
        .then((res) => {
          const newAccessToken = res.data.accessToken;
          setAccessToken(newAccessToken);
          applyAccessTokenToAxios(newAccessToken);
          sessionStorage.setItem("accessToken", newAccessToken);
          const storedUser = localStorage.getItem("user");
          if (storedUser) setUser(JSON.parse(storedUser));
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
    if (user !== undefined) return;
    api
      .get("/user")
      .then((res) => {
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
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
    // user 상태 변경 시 실행할 추가 로직이 있으면 여기에 작성
  }, [user]);

  // 로그인 시 호출
  const login = (userData, token, cartItems = []) => {
    setUser(userData);
    setAccessToken(token);
    applyAccessTokenToAxios(token);
    migrateGuestCart(token);

    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("accessToken", token);
  };

  // 로그아웃 시 호출
  // 로그아웃 시 호출
const logout = async () => {
  const clientSessionId = getClientSessionId();
  if (!clientSessionId) {
    console.warn("❗ 로그아웃 중단: clientSessionId 없음");
    return;
  }

  // 1) 현재 위치 기억
  let backTo = "/";
  try {
    const here = typeof window !== "undefined"
      ? (window.location.pathname + window.location.search)
      : "/";
    backTo = getSafePath(here);
    sessionStorage.setItem("AFTER_LOGOUT_GO", backTo);
  } catch {}

  // 2) 서버 로그아웃
  try {
    await api.post("/auth/logout", { clientSessionId });
  } catch (err) {
    console.warn("❌ 서버 로그아웃 실패:", err.message);
  }

  // 3) 클라이언트 세션 정리
  setUser(null);
  setAccessToken(null);
  applyAccessTokenToAxios(null);
  delete api.defaults.headers.common["Authorization"];

  localStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");

  const newGuestToken = crypto.randomUUID();
  localStorage.setItem("guest_token", newGuestToken);

  // 4) 이동: 저장된 페이지로(기본은 현재 페이지), 없으면 back, 최후 / 
  try {
    const saved = sessionStorage.getItem("AFTER_LOGOUT_GO");
    sessionStorage.removeItem("AFTER_LOGOUT_GO");
    const go = getSafePath(saved || backTo || "/");

    if (go && go !== "/login") {
      router.replace(go);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
  } catch {}
  router.replace("/");
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
