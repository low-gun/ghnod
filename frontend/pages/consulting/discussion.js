import ConsultingSubTabs from "@/components/consulting/ConsultingSubTabs";

export default function DiscussionPage() {
  const paragraphs = [
    "숙의토론(Deliberative Discussion)은 조직 내 중요한 이슈나 정책을 깊이 있게 논의하기 위해 체계적인 토론 과정을 도입하는 방법입니다.",
    "각자의 관점과 근거를 제시하고, 상호 존중과 경청을 통해 합의점을 도출함으로써 더 나은 의사결정을 가능하게 만듭니다.",
  ];

  const subTabs = [
    { label: "워크숍", href: "/consulting/workshop" },
    { label: "공론화", href: "/consulting/discussion" },
    { label: "조직개발", href: "/consulting/orgdev" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <ConsultingSubTabs tabs={subTabs} />

      <h1
        style={{
          marginTop: 32,
          marginBottom: 8,
          fontSize: "clamp(20px, 4vw, 28px)",
          fontWeight: "bold",
        }}
      >
        공론화(Deliberative Discussion)
      </h1>

      <h2
        style={{
          marginBottom: 24,
          color: "#666",
          fontSize: "clamp(16px, 3vw, 22px)",
        }}
      >
        심층적 대화를 통한 조직 내 정책/아이디어 숙의 과정
      </h2>

      {paragraphs.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </div>
  );
}
