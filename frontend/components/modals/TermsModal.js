import React, { useEffect } from "react";
import { termsText } from "../policy/policyText";

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
        <div
          style={{
            ...paragraphStyle,
            fontSize: "15px",
            fontFamily: "inherit", // 또는 "Noto Sans KR, sans-serif"
            whiteSpace: "pre-line",
          }}
        >
          {termsText}
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

const contentStyle = {
  paddingRight: "8px",
};

const paragraphStyle = {
  fontSize: "14px",
  color: "#333",
  lineHeight: "1.7",
  whiteSpace: "pre-line",
};
