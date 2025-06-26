// frontend/pages/terms.js
export default function TermsPage() {
  return (
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "24px" }}>이용약관</h1>
      <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
        본 약관은 ORPi 서비스 이용과 관련하여 회사와 회원 간의 권리와 의무,
        책임사항 등을 규정합니다.{"\n\n"}
        제1조 (목적){"\n"}이 약관은 회사가 제공하는 모든 서비스의 이용조건 및
        절차, 이용자와 회사의 권리·의무 등을 규정함을 목적으로 합니다.{"\n\n"}
        제2조 (정의){"\n"}
        "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을
        말합니다.{"\n\n"}
        ...(이하 약관 내용 추가)...
      </p>
    </div>
  );
}
