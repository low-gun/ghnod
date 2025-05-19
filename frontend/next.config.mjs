/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // ✅ SWC 완전 비활성화

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5001/uploads/:path*",
      },
      {
        source: "/api/education/:path*",
        destination: "http://localhost:5001/api/education/:path*",
      },
      {
        source: "/api/admin/:path*",
        destination: "http://localhost:5001/api/admin/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:5001/auth/:path*",
      },
      {
        source: "/api/test-db",
        destination: "http://localhost:5001/test-db",
      },
      {
        source: "/api/user/:path*",
        destination: "http://localhost:5001/api/user/:path*",
      },
      {
        source: "/api/mypage/:path*",
        destination: "http://localhost:5001/api/mypage/:path*",
      },
      {
        source: "/api/orders/:path*",
        destination: "http://localhost:5001/api/orders/:path*",
      },
      {
        source: "/api/orders",
        destination: "http://localhost:5001/api/orders",
      },
    ];
  },
};

export default nextConfig;
