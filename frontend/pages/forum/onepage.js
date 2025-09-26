import { useState } from "react";
import InquiryModal from "@/components/inquiry/InquiryModal";

export default function ForumOnePage() {
  const [showInquiry, setShowInquiry] = useState(false);

  return (
    <div style={{ padding: "40px" }}>
      <h1>공론화 - 원페이지</h1>
      <p>여기에 원페이지 콘텐츠가 들어갑니다.</p>

      <button
        onClick={() => setShowInquiry(true)}
        style={{
          marginTop: 24,
          padding: "12px 20px",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        문의하기
      </button>

      {showInquiry && (
        <InquiryModal open={showInquiry} onClose={() => setShowInquiry(false)} />
      )}
    </div>
  );
}
