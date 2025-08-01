import useGlobalLoading from "@/stores/globalLoading";
import axios from "axios";
import { clearSessionAndNotifyAndRedirect } from "@/utils/session";

let globalSessionExpired = false;

// ✅ 새로고침 대비 sessionStorage 복구
let inMemoryAccessToken = null;
let expectedRole = null;

if (typeof window !== "undefined") {
  const savedToken = sessionStorage.getItem("accessToken");
  if (savedToken) {
    inMemoryAccessToken = savedToken;
  }
}

// accessToken 설정 함수
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

export const setExpectedRole = (role) => {
  expectedRole = role;
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// 요청 인터셉터 (1회만)
axiosInstance.interceptors.request.use(
  (config) => {
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

      useGlobalLoading.getState().showLoading();
    }
    return config;
  },
  (error) => {
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (1회만)
axiosInstance.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    return response;
  },
  async (error) => {
    if (typeof window !== "undefined") {
      useGlobalLoading.getState().hideLoading();
    }
    const originalRequest = error.config;

    if (
      error.response &&
      [401, 403, 419].includes(error.response.status) &&
      !originalRequest._retry &&
      inMemoryAccessToken
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          "/api/auth/refresh-token",
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
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
