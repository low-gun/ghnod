import ConsultingSubTabs from "@/components/consulting/ConsultingSubTabs";
import Head from "next/head";

export default function WorkshopPage() {
  const paragraphs = [
    "워크숍(Workshop)은 조직 내 문제 해결, 아이디어 발굴, 팀 빌딩 등을 위해 구성원들이 직접 참여하고 협업하는 과정을 의미합니다.",
    "적절한 퍼실리테이션 기법과 체계적인 프로세스가 결합되면, 단순 회의 이상의 강력한 학습 및 변화 추진 툴이 됩니다.",
  ];

  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "공론화", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
    <>
      <Head>
        <title>워크숍(Workshop) | ORP컨설팅</title>
        <meta
          name="description"
          content="ORP컨설팅의 워크숍 컨설팅 - 조직 내 문제 해결, 아이디어 발굴, 팀 빌딩을 위한 체계적인 협업 프로세스"
        />
        <meta property="og:title" content="워크숍(Workshop) | ORP컨설팅" />
        <meta
          property="og:description"
          content="ORP컨설팅 워크숍 - 퍼실리테이션 기법과 협업 방식을 통해 조직의 문제 해결과 성장을 촉진합니다."
        />
        <meta property="og:image" content="/images/workshop.webp" />
        <meta property="og:url" content="https://orpconsulting.co.kr/consulting/workshop" />
      </Head>

      <div style={{ padding: 32 }}>
        <ConsultingSubTabs tabs={subTabs} />

        <h1
          style={{
            marginTop: 32,
            marginBottom: 8,
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: "bold",
          }}
        >
          워크숍(Workshop)
        </h1>

        <h2
          style={{
            marginBottom: 24,
            color: "#666",
            fontSize: "clamp(16px, 3vw, 22px)",
          }}
        >
          조직 문제 해결과 협업을 촉진하는 강력한 방식
        </h2>

        {paragraphs.map((para, idx) => (
          <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
            {para}
          </p>
        ))}
      </div>
    </>
  );
}
