import React, { useEffect } from "react";
import { privacyText } from "../policy/policyText";

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
  <div
    style={{
      fontSize: "15px",
      color: "#333",
      lineHeight: "1.7",
      whiteSpace: "pre-line",
      fontFamily: "inherit", // 또는 "Noto Sans KR, sans-serif" 등 원하는 웹폰트 지정
    }}
  >
    {privacyText}
  </div>
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
