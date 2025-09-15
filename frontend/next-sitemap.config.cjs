/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://orpconsulting.co.kr",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "daily",
  priority: 0.7,

  // ❌ 검색 노출 불필요한 경로들
  exclude: [
    "/admin", "/admin/*",
    "/auth", "/auth/*",
    "/logout", "/logout/*",
    "/mypage", "/mypage/*",
    "/cart", "/checkout",
    "/orders", "/orders/*",
    "/payments", "/payments/*",
    "/api/*",
    "/find-email",        // 👈 추가
    "/find-password",     // 👈 추가
    "/login",             // 👈 추가
    "/register/social",   // 👈 추가
  ],

  // ✅ 중요 페이지 우선순위 조정
  transform: async (config, path) => {
    let priority = 0.7;

    if (path === "/") {
      priority = 1.0;
    } else if (
      path.startsWith("/education") ||
      path.startsWith("/consulting") ||
      path.startsWith("/diagnosis")
    ) {
      priority = 0.9;
    } else if (path === "/terms" || path === "/privacy") {
      priority = 0.3;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
