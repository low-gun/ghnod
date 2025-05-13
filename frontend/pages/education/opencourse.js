import PageLayout from "@/components/content/PageLayout";

export default function OpenCoursePage() {
  const paragraphs = [
    "opencourse 페이지에서는 누구나 참여할 수 있는 공개교육 프로그램을 소개합니다.",
    "교육 일정, 신청 방법, 비용 등의 자세한 내용은 개별 공개교육 안내 페이지에서 확인하실 수 있습니다.",
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
      type="opencourse"
      title="opencourse"
      subtitle="공개교육 안내"
      imageSrc="/images/opencourse.jpg"
      tabs={subTabs}
      paragraphs={paragraphs}
    />
  );
}
