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
        <div style={headerStyle}>
          <h2 style={titleStyle}>개인정보처리방침</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={contentStyle}>
          <div
            style={{
              fontSize: "15px",
              color: "#333",
              lineHeight: "1.7",
              whiteSpace: "pre-line",
              fontFamily: "inherit",
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
  // 패딩은 좌우/하단만, 상단은 헤더에서 처리
  padding: "0 24px 24px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
};
const closeButtonStyle = {
  position: "absolute", // 헤더 내부 기준으로 고정
  top: "50%",
  right: "16px",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#999",
};
const headerStyle = {
  position: "sticky",
  top: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // 타이틀 중앙정렬
  padding: "16px 24px",
  borderBottom: "1px solid #eee",
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "bold",
  margin: 0, // 헤더 내부에서 여백은 headerStyle padding으로 통일
  textAlign: "center",
};

const contentStyle = {
  fontSize: "14px",
  color: "#333",
  flex: 1, // 남은 영역을 차지
  overflowY: "auto", // 내용만 스크롤
  paddingTop: "16px", // 헤더와 본문 간격
};
