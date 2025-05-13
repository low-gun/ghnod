// pages/diagnosis/rnp.js
import TextContent from "../../components/layout/contents/TextContent";

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
    <TextContent
      title="RNP 진단"
      subtitle="개인 역할 적합도 분석을 통한 성과 극대화"
      paragraphs={paragraphs}
      imageSrc="/images/rnp.jpg" // 예시 이미지 경로
      tabs={subTabs}
    />
  );
}
