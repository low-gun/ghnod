import Head from "next/head";
import { useUserContext } from "@/context/UserContext";

export default function HomePage() {
  const { user } = useUserContext();

  return (
    <>
      <Head>
        <title>ORP컨설팅 | 교육·컨설팅·공개교육·Hogan진단</title>
        <meta
          name="description"
          content="ORP컨설팅 - 조직 성장과 혁신을 위한 교육, 컨설팅, Hogan진단, 숙의토론, 공론화, 팀빌딩 전문 플랫폼"
        />
        <meta
          name="keywords"
          content="ORP컨설팅, 교육, 컨설팅, 공개교육, Hogan, Hogan진단, 숙의토론, 공론화, 팀빌딩"
        />

        {/* Open Graph */}
        <meta property="og:title" content="ORP컨설팅" />
        <meta
          property="og:description"
          content="조직 성장과 혁신을 위한 교육, 컨설팅, Hogan진단, 숙의토론, 공론화, 팀빌딩 전문 플랫폼"
        />
        <meta property="og:image" content="/main.webp" />
        <meta property="og:url" content="https://orpconsulting.co.kr" />

        {/* Favicon & 모바일 아이콘 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* JSON-LD 구조화 데이터 (Organization) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ORP컨설팅",
            "url": "https://orpconsulting.co.kr",
            "logo": "https://orpconsulting.co.kr/logo_blue.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+82-2-6952-2843",
              "contactType": "customer service",
              "areaServed": "KR"
            }
          })
        }} />
      </Head>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <img
          src="/main.webp"
          alt="진단 워크숍 메인 이미지"
          loading="lazy"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            margin: 0,
            padding: 0,
          }}
        />
      </div>
    </>
  );
}
