import DiagnosisSubTabs from "@/components/diagnosis/DiagnosisSubTabs";
import Head from "next/head";

export default function TeamEffectPage() {
  const paragraphs = [
    "팀효과성 진단은 팀의 목표 달성도, 내부 커뮤니케이션, 협업 수준을 종합적으로 파악합니다.",
    "구성원의 상호 작용 패턴을 분석하고 개선함으로써 팀 퍼포먼스를 한층 높일 수 있습니다.",
  ];

  const subTabs = [
    { label: "Hogan", href: "/diagnosis/hogan" },
    { label: "TAI리더십", href: "/diagnosis/tai" },
    { label: "조직건강도", href: "/diagnosis/orghealth" },
    { label: "RNP", href: "/diagnosis/rnp" },
    { label: "팀효과성", href: "/diagnosis/teamEffect" },
  ];

  return (
    <>
      <Head>
        <title>팀효과성 진단 | ORP컨설팅</title>
        <meta
          name="description"
          content="ORP컨설팅의 팀효과성 진단 - 팀 목표 달성도, 커뮤니케이션, 협업 수준을 종합적으로 분석하여 팀 퍼포먼스를 높입니다."
        />
        <meta property="og:title" content="팀효과성 진단 | ORP컨설팅" />
        <meta
          property="og:description"
          content="팀 상호작용 패턴을 분석하고 개선하여 협업과 성과를 극대화하는 ORP컨설팅의 팀효과성 진단"
        />
        <meta property="og:image" content="/images/teamEffect.webp" />
        <meta property="og:url" content="https://orpconsulting.co.kr/diagnosis/teamEffect" />
      </Head>

      <div style={{ padding: 32 }}>
        <DiagnosisSubTabs tabs={subTabs} />

        <h1
          style={{
            marginTop: 32,
            marginBottom: 8,
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: "bold",
          }}
        >
          팀효과성 진단
        </h1>

        <h2
          style={{
            marginBottom: 24,
            color: "#666",
            fontSize: "clamp(16px, 3vw, 22px)",
          }}
        >
          협업과 커뮤니케이션 향상을 통한 팀 시너지 극대화
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
