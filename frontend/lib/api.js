import useGlobalLoading from "@/stores/globalLoading"; // 최상단 import 추가
import axios from "axios";

// ✅ 추가: 새로고침 대비 sessionStorage 복구
let inMemoryAccessToken = null;
let expectedRole = null; // ✅ 사용자 권한(role) 저장

if (typeof window !== "undefined") {
  const savedToken = sessionStorage.getItem("accessToken");
  if (savedToken) {
    inMemoryAccessToken = savedToken;
  }
}

// accessToken 설정 함수
export const setAccessToken = (token) => {
  // token이 undefined, null, 빈 문자열, "undefined" 문자열이면 헤더 삭제
  if (
    token &&
    token !== "undefined" &&
    token !== null &&
    token !== ""
  ) {
    inMemoryAccessToken = token;
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    sessionStorage.setItem("accessToken", token);
  } else {
    inMemoryAccessToken = null;
    delete axiosInstance.defaults.headers.common["Authorization"];
    sessionStorage.removeItem("accessToken");
  }
};

// role 설정 함수
export const setExpectedRole = (role) => {
  expectedRole = role;
};

// ✅ 수정: baseURL fallback 제거
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (
    !config.headers.Authorization &&
    inMemoryAccessToken &&
    inMemoryAccessToken !== "undefined" &&
    inMemoryAccessToken !== null &&
    inMemoryAccessToken !== ""
  ) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  } else if (
    !inMemoryAccessToken ||
    inMemoryAccessToken === "undefined" ||
    inMemoryAccessToken === null ||
    inMemoryAccessToken === ""
  ) {
    // 토큰이 없거나, 비정상 값일 때 Authorization 헤더 제거
    delete config.headers.Authorization;
  }

  if (typeof window !== "undefined") {
    const guestToken = localStorage.getItem("guest_token");
    const userRaw = localStorage.getItem("user");

    let isGuest = true;
    try {
      const parsedUser = JSON.parse(userRaw);
      if (parsedUser && typeof parsedUser === "object" && parsedUser.id) {
        isGuest = false;
      }
    } catch {
      isGuest = true;
    }

    if (guestToken && isGuest) {
      config.headers["x-guest-token"] = guestToken;
    } else {
      delete config.headers["x-guest-token"];
    }
  }

  return config;
});


axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      inMemoryAccessToken
    ) {
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/login"
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // ✅ 수정: /api 붙이고 baseURL 제거 → rewrites() 통해 처리
        const refreshResponse = await axios.post(
          "/api/auth/refresh-token",
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        const newRole = refreshResponse.data.role;

        if (expectedRole && newRole !== expectedRole) {
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          setAccessToken(null);
          window.location.href = "/login";
          return Promise.reject("role mismatch");
        }

        setAccessToken(newAccessToken);

        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ 토큰 재발급 실패:", refreshError);
        setAccessToken(null);

        if (typeof window !== "undefined") {
          const skipAlert =
            originalRequest?.url?.includes("/cart/items") ||
            originalRequest?.url?.includes("/product") ||
            originalRequest?.url?.includes("/education");

          if (!skipAlert) {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ [추가] 모든 요청 직전: 전역 로딩 ON
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().showLoading();
    }
    // (Authorization, guest_token 등 기존 처리)
    return config;
  },
  (error) => {
    // ✅ [추가] 요청 에러 발생시: 전역 로딩 OFF
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // ✅ [추가] 응답 성공시: 전역 로딩 OFF
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    return response;
  },
  async (error) => {
    // ✅ [추가] 응답 에러시: 전역 로딩 OFF
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    // (이하 기존 에러/refresh-token 처리)
    return Promise.reject(error);
  }
);
export default axiosInstance;
