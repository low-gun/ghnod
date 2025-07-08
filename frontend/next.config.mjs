// frontend/next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  },
  experimental: {
    isrMemoryCacheSize: 0, // ISR 캐시 메모리 비활성화
  },
  async headers() {
    return [
      {
        source: "/(.*)", // 모든 경로에 대해
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate", // 캐시 완전 차단
          },
        ],
      },
    ];
  },
};

export default nextConfig;
