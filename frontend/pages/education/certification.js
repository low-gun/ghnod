import PageLayout from "@/components/content/PageLayout";

export default function CertificationPage() {
  const paragraphs = [
    "이 페이지에서는 교육 이수자에게 발급되는 수료증 관련 정보를 안내합니다.",
    "교육 과정마다 발급 규정이 다를 수 있으므로, 정확한 내용은 담당자에게 문의해주세요.",
  ];

  const subTabs = [
    { label: "calendar", href: "/education/calendar" },
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ];

  return (
    <PageLayout
      type="certification"
      title="certification"
      subtitle="수료증 발급 안내"
      imageSrc="/images/certification.jpg"
      tabs={subTabs}
      paragraphs={paragraphs}
    />
  );
}
