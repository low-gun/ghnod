import ConsultingSubTabs from "@/components/consulting/ConsultingSubTabs";

export default function OrgDevPage() {
  const paragraphs = [
    "조직개발(OD)은 조직의 성과와 구성원 만족도를 동시에 향상시키기 위한 계획적이고 장기적인 개입(intervention)을 의미합니다.",
    "구조, 문화, 프로세스, 리더십 등 다양한 측면에서 변화를 유도하며, 체계적인 진단과 실행, 피드백 과정을 통해 조직을 지속적으로 발전시킵니다.",
  ];

  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "숙의토론", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
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
        조직개발(Organization Development)
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        조직의 장기적 성장을 이끄는 전략적 접근
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
