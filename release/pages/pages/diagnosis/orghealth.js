// pages/diagnosis/orghealth.js
import TextContent from "../../components/layout/contents/TextContent";

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
    <TextContent
      title="조직건강도 진단"
      subtitle="조직 몰입과 구성원 만족도를 높이는 핵심 지표 분석"
      paragraphs={paragraphs}
      imageSrc="/images/orghealth.jpg" // 예시 이미지 경로
      tabs={subTabs}
    />
  );
}
