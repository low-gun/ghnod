// frontend/pages/terms.js
import { termsText } from "@/components/policy/policyText"; // 네가 만든 경로 기준

export default function TermsPage() {
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
        이용약관
      </h1>
      {/* 여기에 약관 전문 출력 */}
      <pre
        style={{
          whiteSpace: "pre-line",
          fontFamily: "inherit",
          fontSize: "inherit",
          color: "inherit",
        }}
      >
        {termsText}
      </pre>
    </div>
  );
}
