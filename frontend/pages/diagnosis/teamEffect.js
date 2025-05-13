// pages/diagnosis/teamEffect.js
import TextContent from "../../components/layout/contents/TextContent";

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
    <TextContent
      title="팀효과성 진단"
      subtitle="협업과 커뮤니케이션 향상을 통한 팀 시너지 극대화"
      paragraphs={paragraphs}
      imageSrc="/images/teamEffect.jpg" // 예시 이미지 경로
      tabs={subTabs}
    />
  );
}
