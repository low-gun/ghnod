const isDev = process.env.NODE_ENV !== "production"; // 개발 환경 체크

const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // standalone 빌드 옵션
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL, // 프론트엔드에서 사용하는 환경변수
    API_BASE_URL: process.env.API_BASE_URL, // 백엔드에서 사용하는 환경변수
  },
  experimental: {
    isrMemoryCacheSize: 0, // ISR 메모리 캐시 사이즈 설정
  },
  async headers() {
    return [
      {
        source: "/(.*)", // 모든 요청에 대해
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate", // 캐시 무효화
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (isDev) {
      // 개발 환경에서는 API를 로컬로 프록시
      return [
        {
          source: "/api/:path*", // 요청 경로에 맞춰
          destination: "http://localhost:5001/api/:path*", // 로컬 개발 서버의 주소로 프록시
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
