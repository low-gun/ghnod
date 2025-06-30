// pages/consulting/workshop.js
import TextContent from "../../components/layout/contents/TextContent";

export default function WorkshopPage() {
  // 본문 단락 내용
  const paragraphs = [
    "워크숍(Workshop)은 조직 내 문제 해결, 아이디어 발굴, 팀 빌딩 등을 위해 구성원들이 직접 참여하고 협업하는 과정을 의미합니다.",
    "적절한 퍼실리테이션 기법과 체계적인 프로세스가 결합되면, 단순 회의 이상의 강력한 학습 및 변화 추진 툴이 됩니다.",
  ];

  // 하위 메뉴 탭 (consulting 하위)
  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "숙의토론", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
    <TextContent
      title="워크숍(Workshop)"
      subtitle="조직 문제 해결과 협업을 촉진하는 강력한 방식"
      paragraphs={paragraphs}
      imageSrc="/images/workshop.jpg" // 예시 (public/images 폴더 내)
      tabs={subTabs}
    />
  );
}
