import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
 <Head>
  <link rel="icon" href="/favicon.ico" />
  <meta name="theme-color" content="#ffffff" />

  {/* SEO 기본 메타 */}
  <meta name="description" content="GHNOD - 교육, 컨설팅, FTShop을 제공하는 전문 플랫폼" />
  <meta name="keywords" content="교육, 컨설팅, FTShop, GHNOD" />
  <meta name="author" content="주식회사 오알피연구소" />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="GHNOD" />
  <meta property="og:description" content="교육, 컨설팅, FTShop을 제공하는 전문 플랫폼" />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:url" content="https://orpconsulting.co.kr" />
</Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
