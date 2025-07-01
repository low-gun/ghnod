import DiagnosisSubTabs from "@/components/diagnosis/DiagnosisSubTabs";

export default function HoganPage() {
  const paragraphs = [
    "Hogan 진단은 개인의 역량과 강점을 분석하고, 직무와 조직에 적합한 성향을 파악하는 데 도움이 됩니다.",
    "심층적 성격 검사를 통해 조직 fit을 살펴볼 수 있으며, 이를 바탕으로 리더십 개발이나 인재 선발 등에 활용할 수 있습니다.",
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
        Hogan 진단
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        조직 적합성을 높이는 개인 역량 분석
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
