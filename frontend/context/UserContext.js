import { createContext, useState, useEffect } from "react";
import { setAccessToken as applyAccessTokenToAxios } from "@/lib/api";
import { getClientSessionId } from "@/lib/session"; // 경로는 실제 위치에 따라 조정
import { useRouter } from "next/router";
import api from "@/lib/api";
import { useCartContext } from "./CartContext"; // 정확한 경로로
import { useContext } from "react"; // 💡 이건 파일 상단에 import

// 1. UserContext 생성
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const router = useRouter();
  const { setCartItems, setCartReady } = useCartContext();

  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // ✅ 1. guest 장바구니 → 유저로 이전 함수
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

  // ✅ 2. accessToken 복구 또는 refresh-token 자동 요청
  useEffect(() => {
    // 👇 로그인 페이지에서는 refresh-token 시도 안함
    if (router.pathname === "/login") return;
  
    const storedToken = sessionStorage.getItem("accessToken");
    const cookieToken = getCookie("accessToken"); // 👈 추가
    
    if (storedToken) {
      setAccessToken(storedToken);
      applyAccessTokenToAxios(storedToken);
    } else if (cookieToken) {
      // 👈 쿠키에서 accessToken을 찾았으면 바로 저장
      setAccessToken(cookieToken);
      applyAccessTokenToAxios(cookieToken);
      sessionStorage.setItem("accessToken", cookieToken);
    } else {
      const sessionId = getClientSessionId();
      console.log("📌 refresh-token 요청 전 clientSessionId:", sessionId);
  
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
          sessionStorage.setItem("accessToken", newAccessToken); // ✅ 추가
        })
        
        .catch((err) => {
          console.warn("❌ 자동 로그인 실패: 리프레시 토큰 만료 또는 미존재");
          // 보호가 필요한 경로만 명시
const protectedRoutes = [
  "/mypage",
  "/orders",
  "/checkout",
  "/admin",
];

const isProtected = protectedRoutes.some((path) =>
  router.pathname.startsWith(path)
);

if (isProtected && !accessToken) {
  logout();
  router.push("/login");
  return;
}

        });
    }
  
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, [router.pathname]);
  
  // 2️⃣ accessToken이 설정된 후에만 user 정보 요청
  useEffect(() => {
    if (!accessToken) return;

    api
      .get("/user")
      .then((res) => {
        const data = res.data;
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch((error) => {
        console.error("유저 정보를 불러오지 못했습니다.", error);
        logout();
      });
  }, [accessToken]);

  // 3️⃣ 로그인 시 호출
  const login = (userData, token, cartItems = []) => {
    setUser(userData);
    setAccessToken(token);
    applyAccessTokenToAxios(token);

    // ✅ guest 장바구니 → 로그인 유저로 이전 시도
    migrateGuestCart(token); // 🔥 이 줄 추가

    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("accessToken", token);

    setCartItems(cartItems);
    setCartReady(true); // ✅ 장바구니 준비 완료
  };

  // 4️⃣ 로그아웃 시 호출
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

    // ✅ 상태 초기화
    setUser(null);
    setAccessToken(null);
    applyAccessTokenToAxios(null); // axios Authorization 헤더 제거

    // ✅ axiosInstance 기본 헤더도 직접 제거 (보조 안전망)
    delete api.defaults.headers.common["Authorization"];

    // ✅ 저장소 정리
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");

    // ✅ guest_token 새로 발급
    const newGuestToken = crypto.randomUUID();
    localStorage.setItem("guest_token", newGuestToken);

    // ✅ 장바구니 상태 초기화
    setCartItems([]);
    setCartReady(false);

    // ✅ 로그인 페이지 이동
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
// 👇 useEffect 바깥에 추가 (함수 안 or 파일 맨 아래에 둬도 됨)
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};