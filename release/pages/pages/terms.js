// frontend/pages/terms.js
export default function TermsPage() {
  return (
    <div
      style={{
        padding: "32px 16px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#333",
        fontSize: "14px", // 전체 본문 폰트 크기 축소
        lineHeight: "1.7",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem", // h1 줄임
          fontWeight: "700",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        이용약관
      </h1>

      {/* 약관 조항 시작 */}
      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제1조 (목적)
        </h2>
        <p>
          본 약관은 주식회사 오알피연구소(이하 "회사")가 제공하는 ORPi
          서비스(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간의 권리,
          의무, 책임 및 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제2조 (용어의 정의)
        </h2>
        <p>
          1. "서비스"란 회사가 제공하는 대면 기반의 진단, 공개교육, 팔로우업,
          코치 인증과정 등 교육 관련 서비스 및 이에 부수하는 콘텐츠, 상품 등을
          의미합니다.
          <br />
          2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및
          비회원을 말합니다.
          <br />
          3. "회원"이란 회사의 서비스에 개인정보를 제공하고 회원으로 등록한
          자로서, 지속적으로 서비스를 이용할 수 있는 자를 말합니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제3조 (약관의 효력 및 변경)
        </h2>
        <p>
          1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 효력이
          발생합니다.
          <br />
          2. 회사는 본 약관을 개정할 수 있으며, 변경된 약관은 웹사이트에
          게시하거나 이메일 등으로 고지합니다.
          <br />
          3. 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수
          있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제4조 (회원가입 및 정보수집)
        </h2>
        <p>
          1. 회원가입 시 수집 항목: 이름, 연락처, 이메일, 비밀번호, 소속, 부서,
          직책, 마케팅 수신 동의 여부
          <br />
          2. 회원은 자신의 정보가 변경될 경우 즉시 수정해야 하며, 회사는
          미수정으로 인한 불이익에 책임지지 않습니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제5조 (서비스의 제공)
        </h2>
        <p>
          1. 회사는 다음과 같은 서비스를 제공합니다:
          <br />
          - 진단 및 컨설팅
          <br />
          - 공개교육
          <br />
          - 팔로우업 프로그램
          <br />
          - 코치 인증과정 등
          <br />
          2. 모든 서비스는 상품 단위로 대면 제공됩니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제6조 (서비스 신청 및 결제)
        </h2>
        <p>
          1. 이용자는 회사가 정한 절차에 따라 서비스 이용을 신청할 수 있습니다.
          <br />
          2. 결제수단: 신용카드, 계좌이체, 간편결제
          <br />
          3. 회사는 이용자의 요청 시 전자세금계산서를 발행합니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제7조 (취소 및 환불)
        </h2>
        <p>
          1. 취소 및 환불은 「전자상거래법」 등 대한민국 법령을 따릅니다.
          <br />
          2. 회사는 법령에 따른 정당한 사유 발생 시 환불을 처리할 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // 작게
            fontWeight: "600",
            marginBottom: "10px", // 간격 축소
          }}
        >
          제8조 (회원의 의무)
        </h2>
        <p>
          1. 회원은 계정정보를 스스로 관리하며, 타인과 공유해서는 안 됩니다.
          <br />
          2. 회원은 서비스 이용 시 회사 및 제3자의 권리를 침해하거나 관련 법령에
          위반하는 행위를 해서는 안 됩니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제9조 (회사의 의무)
        </h2>
        <p>
          1. 회사는 안정적인 서비스 제공을 위하여 최선을 다합니다.
          <br />
          2. 회사는 개인정보 보호를 위해 기술적·관리적 보호조치를 시행합니다.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.1rem", // h2 줄임
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          제10조 (면책조항)
        </h2>
        <p>
          1. 회사는 천재지변, 불가항력 등으로 인한 서비스 장애에 대해 책임지지
          않습니다.
          <br />
          2. 회사는 사전 고지 후 서비스의 일부 또는 전부를 중단할 수 있습니다.
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "12px",
          }}
        >
          제11조 (분쟁 해결 및 준거법)
        </h2>
        <p>
          1. 회사와 이용자는 분쟁 발생 시 상호 협의하여 해결하도록 노력합니다.
          <br />
          2. 분쟁이 해결되지 않을 경우 회사 본사 소재지를 관할하는 법원을 제1심
          법원으로 합니다.
          <br />
          3. 본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.
        </p>
      </section>
    </div>
  );
}
