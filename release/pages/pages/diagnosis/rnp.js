import DiagnosisSubTabs from "@/components/diagnosis/DiagnosisSubTabs";

export default function RnpPage() {
  const paragraphs = [
    "RNP 진단은 개인 및 팀의 역량을 Role & Position 측면에서 분석하여, 가장 적합한 역할을 찾도록 돕습니다.",
    "이를 통해 조직 내에서 구성원 간 시너지를 높이고 적재적소에 인력을 배치할 수 있습니다.",
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
        RNP 진단
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        개인 역할 적합도 분석을 통한 성과 극대화
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
