// pages/consulting/discussion.js
import TextContent from "../../components/layout/contents/TextContent";

export default function DiscussionPage() {
  // 본문 단락 내용
  const paragraphs = [
    "숙의토론(Deliberative Discussion)은 조직 내 중요한 이슈나 정책을 깊이 있게 논의하기 위해 체계적인 토론 과정을 도입하는 방법입니다.",
    "각자의 관점과 근거를 제시하고, 상호 존중과 경청을 통해 합의점을 도출함으로써 더 나은 의사결정을 가능하게 만듭니다.",
  ];

  // 하위 메뉴 탭 (consulting 하위)
  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "숙의토론", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
    <TextContent
      title="숙의토론(Deliberative Discussion)"
      subtitle="심층적 대화를 통한 조직 내 정책/아이디어 숙의 과정"
      paragraphs={paragraphs}
      imageSrc="/images/discussion.jpg" // 예시 (public/images 폴더 내)
      tabs={subTabs}
    />
  );
}
