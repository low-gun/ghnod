// pages/diagnosis/hogan.js
import TextContent from "../../components/layout/contents/TextContent";

export default function HoganPage() {
  // 본문 단락 내용 (원하는 만큼 추가)
  const paragraphs = [
    "Hogan 진단은 개인의 역량과 강점을 분석하고, 직무와 조직에 적합한 성향을 파악하는 데 도움이 됩니다.",
    "심층적 성격 검사를 통해 조직 fit을 살펴볼 수 있으며, 이를 바탕으로 리더십 개발이나 인재 선발 등에 활용할 수 있습니다.",
  ];

  // 하위 메뉴 탭 목록 (label, href)
  const subTabs = [
    { label: "Hogan", href: "/diagnosis/hogan" },
    { label: "TAI리더십", href: "/diagnosis/tai" },
    { label: "조직건강도", href: "/diagnosis/orghealth" },
    { label: "RNP", href: "/diagnosis/rnp" },
    { label: "팀효과성", href: "/diagnosis/teamEffect" },
  ];

  return (
    <TextContent
      title="Hogan 진단"
      subtitle="조직 적합성을 높이는 개인 역량 분석"
      paragraphs={paragraphs}
      imageSrc="/images/hogan.jpg" // 예: 퍼블릭 폴더에 이미지가 있다면
      tabs={subTabs} // 탭 전달
    />
  );
}
