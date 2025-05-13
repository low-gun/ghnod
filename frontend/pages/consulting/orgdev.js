// pages/consulting/orgdev.js
import TextContent from "../../components/layout/contents/TextContent";

export default function OrgDevPage() {
  // 본문 단락 내용
  const paragraphs = [
    "조직개발(OD)은 조직의 성과와 구성원 만족도를 동시에 향상시키기 위한 계획적이고 장기적인 개입(intervention)을 의미합니다.",
    "구조, 문화, 프로세스, 리더십 등 다양한 측면에서 변화를 유도하며, 체계적인 진단과 실행, 피드백 과정을 통해 조직을 지속적으로 발전시킵니다.",
  ];

  // 하위 메뉴 탭 (consulting 하위)
  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "숙의토론", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
    <TextContent
      title="조직개발(Organization Development)"
      subtitle="조직의 장기적 성장을 이끄는 전략적 접근"
      paragraphs={paragraphs}
      imageSrc="/images/orgdev.jpg" // 예시 (public/images 폴더 내)
      tabs={subTabs}
    />
  );
}
