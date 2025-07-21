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
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
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
      ];
    }
    // **프로덕션용 프록시 추가**
    return [
      {
        source: "/api/:path*",
        destination: "https://ghnod-backend.azurewebsites.net/api/:path*",
      },
    ];
  },
};

export default nextConfig;
