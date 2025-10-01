import { useState } from "react";
import InquiryModal from "@/components/inquiry/InquiryModal";

export default function SocialDialogueOnePage() {
  const [showInquiry, setShowInquiry] = useState(false);

  // 이미지 파일 이름 배열
  const images = [
    "/images/socialdialogue1.png",
    "/images/socialdialogue2.png",
    "/images/socialdialogue3.png",
    "/images/socialdialogue4.png",
    "/images/socialdialogue5.png",
    "/images/socialdialogue6.png",
  ];

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      {/* 이미지 목록 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`socialdialogue${idx + 1}`}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
        ))}
      </div>

      {/* 문의하기 버튼 */}
      <div style={{ marginTop: "40px" }}>
        <button
          onClick={() => setShowInquiry(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          문의하기
        </button>
      </div>

      {/* 문의하기 모달 */}
      {showInquiry && (
        <InquiryModal open={showInquiry} onClose={() => setShowInquiry(false)} />
      )}
    </div>
  );
}
