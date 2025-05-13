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

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api",
  withCredentials: true, // ✅ refreshToken 쿠키 자동 전송
});

// ✅ 요청 인터셉터 – accessToken + guest_token 자동 설정
axiosInstance.interceptors.request.use((config) => {
  console.log("📦 요청 URL:", config.baseURL + config.url); // ✅ 이 줄 추가
  console.log("🪪 Authorization 헤더:", config.headers.Authorization); // ✅ 이 줄 추가
  // accessToken이 있으면 헤더에 자동 주입
  if (!config.headers.Authorization && inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }

  // guest_token을 로그인 여부에 따라 조건적으로 붙임
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

// ✅ 응답 인터셉터 – accessToken 만료 시 재발급 처리
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
        const refreshResponse = await axios.post(
          "/auth/refresh-token",
          {},
          {
            baseURL:
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "http://localhost:5001/api",
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
