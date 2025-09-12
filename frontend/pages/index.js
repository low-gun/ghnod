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
        <meta property="og:title" content="ORP컨설팅" />
        <meta
          property="og:description"
          content="조직 성장과 혁신을 위한 교육, 컨설팅, Hogan진단, 숙의토론, 공론화, 팀빌딩 전문 플랫폼"
        />
        <meta property="og:url" content="https://orpconsulting.co.kr" />
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
