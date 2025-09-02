// frontend/lib/api.js
import useGlobalLoading from "@/stores/globalLoading";
import axios from "axios";
import { clearSessionAndNotifyAndRedirect } from "@/utils/session";

let globalSessionExpired = false;

// In-memory accessToken (새로고침 후 sessionStorage에서 복구)
let inMemoryAccessToken = null;
if (typeof window !== "undefined") {
  const savedToken = sessionStorage.getItem("accessToken");
  if (savedToken && savedToken !== "undefined") {
    inMemoryAccessToken = savedToken;
  }
}

// 동시 요청 카운터로 로딩바 제어 (깜빡임 방지)
let activeRequests = 0;
const showGlobalLoading = () => {
  if (typeof window === "undefined") return;
  if (activeRequests === 0) useGlobalLoading.getState().showLoading();
  activeRequests += 1;
};
const hideGlobalLoading = () => {
  if (typeof window === "undefined") return;
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) useGlobalLoading.getState().hideLoading();
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// accessToken 설정/해제
export const setAccessToken = (token) => {
  if (token && token !== "undefined" && token !== null && token !== "") {
    inMemoryAccessToken = token;
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    sessionStorage.setItem("accessToken", token);
  } else {
    inMemoryAccessToken = null;
    delete axiosInstance.defaults.headers.common["Authorization"];
    sessionStorage.removeItem("accessToken");
  }
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // ---- 로딩바 스킵 옵션 ----
    const skipLoading =
      config.headers && config.headers["x-skip-loading"] === "1";
    if (skipLoading) {
      config._skipLoading = true;
      // 서버로 이 커스텀 헤더가 가지 않게 제거
      delete config.headers["x-skip-loading"];
    }

    // ---- 무토큰 옵션 ----
    const noAuth = config.headers && config.headers["x-no-auth"] === "1";
    if (noAuth) {
      delete config.headers["x-no-auth"];
      delete config.headers.Authorization;
    }

    // Authorization 주입 (무토큰이 아닌 경우에만)
    if (!noAuth) {
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
        delete config.headers.Authorization;
      }
    }

    // 게스트 토큰 헤더
    if (typeof window !== "undefined") {
      const guestToken = localStorage.getItem("guest_token");
      const userRaw = localStorage.getItem("user");

      let isGuest = true;
      try {
        const parsed = JSON.parse(userRaw);
        if (parsed && typeof parsed === "object" && parsed.id) {
          isGuest = false;
        }
      } catch {
        isGuest = true;
      }

      if (guestToken) {
        config.headers["x-guest-token"] = guestToken;  // 로그인 여부 관계없이 항상 보냄
      }
      
    }

    // 전역 로딩바 (스킵 아닌 경우만)
    if (!config._skipLoading) showGlobalLoading();

    return config;
  },
  (error) => {
    // 요청 단계에서 실패했을 때도 카운터 복구
    if (!error?.config?._skipLoading) hideGlobalLoading();
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    if (!response.config?._skipLoading) hideGlobalLoading();
    return response;
  },
  async (error) => {
    if (!error?.config?._skipLoading) hideGlobalLoading();

    const originalRequest = error.config;

    // 토큰 만료 → 리프레시 시도
    if (
      error.response &&
      [401, 403, 419].includes(error.response.status) &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axiosInstance.post(
          "/auth/refresh-token",
          {},
          {
            withCredentials: true,
            // 리프레시 요청은 로딩바/토큰 모두 스킵 (쿠키로만 검증)
            headers: { "x-skip-loading": "1", "x-no-auth": "1" },
          }
        );
        setAccessToken(data.accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        // 원래 요청 재시도 (원래의 스킵 플래그 유지)
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (!globalSessionExpired) {
          globalSessionExpired = true;
          clearSessionAndNotifyAndRedirect(
            "세션이 만료되었습니다. 다시 로그인해주세요."
          );
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
