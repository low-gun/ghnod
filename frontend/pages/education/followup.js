import PageLayout from "@/components/content/PageLayout";

export default function FollowupPage() {
  const paragraphs = [
    "Followup is crucial to ensure that training outcomes are carried into real-world practice and lead to lasting improvements.",
    "Providing continuous support, resources, and engagement after training can significantly boost knowledge retention and performance.",
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
      type="followup"
      title="Followup"
      subtitle="Continuous Engagement After Training"
      imageSrc="/images/followup.jpg"
      tabs={subTabs}
      paragraphs={paragraphs}
    />
  );
}
