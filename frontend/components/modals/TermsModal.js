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
          <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
            본 약관은 ORPi 서비스 이용과 관련하여 회사와 회원 간의 권리와 의무를
            규정합니다.{"\n\n"}
            제1조 (목적){"\n"}이 약관은 회사가 제공하는 서비스의 이용조건 및
            절차, 이용자와 회사의 권리·의무를 규정합니다.{"\n\n"}
            ...(이하 약관 전문 또는 요약)...
          </p>
        </div>
      </div>
    </div>
  );
}

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
  borderRadius: "8px",
  width: "90%",
  maxWidth: "600px",
  maxHeight: "80vh",
  padding: "24px",
  position: "relative",
  overflowY: "auto",
};

const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "16px",
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#999",
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "16px",
  textAlign: "center",
};

const contentStyle = {
  fontSize: "14px",
  color: "#333",
};
