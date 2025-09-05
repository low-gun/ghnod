import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const isDev = process.env.NODE_ENV !== "production";
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_OAUTH_BASE_URL: process.env.NEXT_PUBLIC_OAUTH_BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  },

  // ✅ 외부 이미지 도메인 허용 + 포맷 최적화
  images: {
    domains: ["ghnoduploads.blob.core.windows.net"],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    isrMemoryCacheSize: 0,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, must-revalidate" },
        ],
      },
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
          source: "/uploads/:path*",
          destination: "http://localhost:5001/uploads/:path*",
        },
      ];
    }
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

  webpack: (config) => {
    return config;
  },
 
};


export default withBundleAnalyzer(nextConfig);
