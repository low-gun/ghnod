import { privacyText } from "@/components/policy/policyText";

export default function PrivacyPage() {
  return (
    <div
      style={{
        padding: "32px 16px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#333",
        fontSize: "14px",
        lineHeight: "1.7",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        개인정보처리방침
      </h1>
      <p style={{ whiteSpace: "pre-line" }}>{privacyText}</p>
    </div>
  );
}
