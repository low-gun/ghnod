const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_OAUTH_BASE_URL: process.env.NEXT_PUBLIC_OAUTH_BASE_URL,  // ⭐️ 꼭 명시!
    API_BASE_URL: process.env.API_BASE_URL,
      },
  experimental: {
    isrMemoryCacheSize: 0,
  },
  async headers() {
    return [
      // Next 정적 자산: 강력 캐시
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Next 이미지 최적화(사용 중일 때)
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // 업로드 이미지: 적당히 캐시 (파일명이 uuid/타임스탬프라 안전)
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
        ],
      },
      // 그 외(HTML 등): 캐시 금지
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
  
  async rewrites() {
    if (isDev) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:5001/api/:path*",
        },
        {
          source: "/uploads/:path*", // ✅ 추가!
          destination: "http://localhost:5001/uploads/:path*",
        },
      ];
    }
    // **프로덕션용 프록시 추가**
    return [
      {
        source: "/api/:path*",
        destination: "https://ghnod-backend.azurewebsites.net/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "https://ghnod-backend.azurewebsites.net/uploads/:path*",
      },
    ];
  },
  
};

export default nextConfig;
