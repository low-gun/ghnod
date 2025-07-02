import DiagnosisSubTabs from "@/components/diagnosis/DiagnosisSubTabs";

export default function TaiPage() {
  const paragraphs = [
    "TAI 리더십 진단은 조직 내 리더들의 역량을 측정하고, 개인의 리더십 스타일이 팀에 미치는 영향을 분석합니다.",
    "이를 통해 효과적인 커뮤니케이션과 팀 성과를 높일 수 있는 전략을 수립할 수 있습니다.",
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
        TAI 리더십
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        효과적인 리더십 스타일 진단 및 개발
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
