import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
 <Head>
  <link rel="icon" href="/favicon.ico" />
  <meta name="theme-color" content="#ffffff" />

  {/* 네이버 소유권 확인 */}
  <meta name="naver-site-verification" content="af88184daaa76d1b3f39f3811a604129cffc" />

  {/* SEO 기본 메타 */}
  <meta name="description" content="ORP컨설팅 - 진단, 교육, 컨설팅, 조직개발, Hogan, 숙의토론, 공개교육, 팀빌딩" />
  <meta name="keywords" content="ORP컨설팅, 교육, 컨설팅, 공개교육, 팀빌딩, 숙의토론, 공론화, Hogan, Hogan진단" />
  <meta name="author" content="주식회사 오알피컨설팅" />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="ORP컨설팅" />
  <meta property="og:description" content="진단, 교육, 컨설팅, 조직개발, Hogan, 숙의토론, 공개교육, 팀빌딩" />
  <meta property="og:image" content="/logo_blue.png" />
  <meta property="og:url" content="https://orpconsulting.co.kr" />
</Head>


      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
