/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";
const API_BASE = isProd
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : "http://localhost:5001/api";

const UPLOADS_BASE = isProd
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api", "")
  : "http://localhost:5001";

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // ✅ SWC 완전 비활성화
  output: "standalone", // ✅ 추가
  distDir: ".next", // ✅ 명시적으로 빌드 결과 디렉토리 설정

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${UPLOADS_BASE}/uploads/:path*`,
      },
      {
        source: "/api/education/:path*",
        destination: `${API_BASE}/education/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${API_BASE}/admin/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${UPLOADS_BASE}/auth/:path*`, // auth는 api prefix 없음
      },
      {
        source: "/api/test-db",
        destination: `${UPLOADS_BASE}/test-db`,
      },
      {
        source: "/api/user/:path*",
        destination: `${API_BASE}/user/:path*`,
      },
      {
        source: "/api/mypage/:path*",
        destination: `${API_BASE}/mypage/:path*`,
      },
      {
        source: "/api/orders/:path*",
        destination: `${API_BASE}/orders/:path*`,
      },
      {
        source: "/api/orders",
        destination: `${API_BASE}/orders`,
      },
    ];
  },
};

export default nextConfig;
