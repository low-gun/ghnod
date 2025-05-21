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
  inMemoryAccessToken = token;

  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    sessionStorage.setItem("accessToken", token); // ✅ 세션 저장
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
    sessionStorage.removeItem("accessToken"); // ✅ 세션 제거
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

// ✅ 요청 인터셉터 – accessToken + guest_token 자동 설정
axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization && inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }

  if (typeof window !== "undefined") {
    const guestToken = localStorage.getItem("guest_token");
    const user = localStorage.getItem("user");

    if (guestToken && !user) {
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
      !originalRequest._retry
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
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
