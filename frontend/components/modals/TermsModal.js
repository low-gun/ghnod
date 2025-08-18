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
        <div style={headerStyle}>
          <h2 style={titleStyle}>이용약관</h2>
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
              fontFamily: "inherit", // 또는 "Noto Sans KR, sans-serif"
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
  borderRadius: "8px", // PrivacyModal과 동일
  width: "90%",
  maxWidth: "600px", // PrivacyModal과 동일
  maxHeight: "80vh",
  padding: "0 24px 24px", // 상단 패딩은 헤더가 담당
  position: "relative",
  display: "flex",
  flexDirection: "column", // 본문만 스크롤 위해 컬럼 레이아웃
};

const headerStyle = {
  position: "sticky",
  top: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // 타이틀 중앙
  padding: "16px 24px",
  borderBottom: "1px solid #eee",
};

const closeButtonStyle = {
  position: "absolute", // 헤더 영역 기준 고정
  top: "50%",
  right: "16px",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#999",
};

const titleStyle = {
  fontSize: "20px", // PrivacyModal과 동일
  fontWeight: "bold",
  margin: 0, // 헤더 패딩으로 간격 통일
  textAlign: "center",
};

const contentStyle = {
  fontSize: "14px",
  color: "#333",
  flex: 1, // 남은 높이 채움
  overflowY: "auto", // 본문만 스크롤
  paddingTop: "16px",
};
