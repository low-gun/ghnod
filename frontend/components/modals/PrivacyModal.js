import React, { useEffect } from "react";

export default function PrivacyModal({ visible, onClose }) {
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
        <h2 style={titleStyle}>개인정보처리방침</h2>
        <div style={contentStyle}>
          <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
            ORPi는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고 이와
            관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같은 방침을
            수립·공개합니다.{"\n\n"}
            제1조 (개인정보의 처리 목적){"\n"}
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는
            다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될
            시에는 사전 동의를 구할 예정입니다.{"\n\n"}
            ...(이하 추가 내용)...
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
