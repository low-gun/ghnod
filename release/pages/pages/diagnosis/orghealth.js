import DiagnosisSubTabs from "@/components/diagnosis/DiagnosisSubTabs";

export default function OrgHealthPage() {
  const paragraphs = [
    "조직건강도 진단은 구성원 만족도, 몰입도, 의사소통 흐름 등을 종합적으로 파악합니다.",
    "이를 통해 조직의 강점과 개선점을 도출해, 보다 건강하고 지속 가능한 조직문화를 구축할 수 있습니다.",
  ];

  const subTabs = [
    { label: "Hogan", href: "/diagnosis/hogan" },
    { label: "TAI리더십", href: "/diagnosis/tai" },
    { label: "조직건강도", href: "/diagnosis/orghealth" },
    { label: "RNP", href: "/diagnosis/rnp" },
    { label: "팀효과성", href: "/diagnosis/teamEffect" },
  ];

  return (
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
        조직건강도 진단
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        조직 몰입과 구성원 만족도를 높이는 핵심 지표 분석
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
