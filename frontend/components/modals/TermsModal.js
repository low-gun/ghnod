import React, { useEffect } from "react";

export default function TermsModal({ visible, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>
          ×
        </button>
        <h2 style={titleStyle}>이용약관</h2>
        <div style={contentStyle}>
          {termsSections.map((section, i) => (
            <div key={i} style={{ marginBottom: "24px" }}>
              <h3 style={sectionTitleStyle}>{section.title}</h3>
              <p style={paragraphStyle}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 스타일 정의 ---
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  borderRadius: "10px",
  width: "90%",
  maxWidth: "700px",
  maxHeight: "80vh",
  padding: "32px 24px",
  position: "relative",
  overflowY: "auto",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
};

const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "16px",
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#888",
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "24px",
  textAlign: "center",
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "8px",
  color: "#111",
};

const paragraphStyle = {
  fontSize: "14px",
  color: "#333",
  lineHeight: "1.7",
  whiteSpace: "pre-line",
};

const contentStyle = {
  paddingRight: "8px",
};

// --- 약관 내용 ---
const termsSections = [
  {
    title: "제1조 (목적)",
    content:
      '이 약관은 주식회사 오알피연구소(이하 "회사")가 제공하는 ORPi 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무, 책임 및 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: "제2조 (용어의 정의)",
    content:
      '1. "서비스"란 회사가 제공하는 대면 기반의 진단, 공개교육, 팔로우업, 코치 인증과정 등 교육 관련 서비스 및 이에 부수하는 콘텐츠, 상품 등을 의미합니다.\n2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.\n3. "회원"이란 회사에 개인정보를 제공하고 회원으로 등록하여 서비스를 지속적으로 이용할 수 있는 자를 말합니다.',
  },
  {
    title: "제3조 (약관의 효력 및 변경)",
    content:
      "1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 효력이 발생합니다.\n2. 회사는 본 약관을 개정할 수 있으며, 변경된 약관은 웹사이트 게시 또는 이메일 등으로 고지합니다.\n3. 변경된 약관에 동의하지 않을 경우 이용자는 서비스 이용을 중단할 수 있습니다.",
  },
  {
    title: "제4조 (회원가입 및 정보수집)",
    content:
      "1. 회원가입 시 수집 항목: 이름, 연락처, 이메일, 비밀번호, 소속, 부서, 직책, 마케팅 수신 동의 여부\n2. 회원은 자신의 정보가 변경되면 즉시 수정해야 하며, 회사는 정보 미수정으로 인한 불이익에 책임지지 않습니다.",
  },
  {
    title: "제5조 (서비스의 제공)",
    content:
      "1. 회사는 다음과 같은 서비스를 제공합니다:\n - 진단 및 컨설팅\n - 공개교육\n - 팔로우업 프로그램\n - 코치 인증과정\n2. 모든 서비스는 상품 단위로 대면 제공됩니다.",
  },
  {
    title: "제6조 (서비스 신청 및 결제)",
    content:
      "1. 이용자는 회사가 정한 절차에 따라 서비스 이용을 신청할 수 있습니다.\n2. 결제 수단: 신용카드, 계좌이체, 간편결제\n3. 회사는 요청 시 전자세금계산서를 발행합니다.",
  },
  {
    title: "제7조 (취소 및 환불)",
    content:
      "1. 서비스의 취소 및 환불은 원칙적으로 불가하며, 예외는 전자상거래법 등 대한민국 법령을 따릅니다.\n2. 회사는 관련 법령에 따라 환불을 진행할 수 있습니다.",
  },
  {
    title: "제8조 (회원의 의무)",
    content:
      "1. 회원은 계정 정보를 스스로 관리할 책임이 있으며, 제3자에게 공유해서는 안 됩니다.\n2. 회원은 서비스 이용 시 타인의 권리를 침해하거나 법령에 위반하는 행위를 해서는 안 됩니다.",
  },
  {
    title: "제9조 (회사의 의무)",
    content:
      "1. 회사는 안정적인 서비스 제공을 위해 최선을 다합니다.\n2. 회사는 개인정보 보호를 위해 필요한 조치를 이행합니다.",
  },
  {
    title: "제10조 (면책조항)",
    content:
      "1. 회사는 천재지변, 불가항력 등으로 인한 서비스 중단에 대해 책임지지 않습니다.\n2. 회사는 사전 고지 후 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.",
  },
  {
    title: "제11조 (분쟁 해결 및 준거법)",
    content:
      "1. 분쟁 발생 시 회사와 이용자는 협의하여 해결하도록 노력합니다.\n2. 협의가 불가능한 경우 회사 본사 소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.\n3. 본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.",
  },
];
