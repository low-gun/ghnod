import { useState } from "react";
import InquiryModal from "@/components/inquiry/InquiryModal";
import { useIsMobile, useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

export default function SocialDialogueOnePage() {
  const [showInquiry, setShowInquiry] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTabletOrBelow();

  // 이미지 파일 이름 배열
  const images = [
    "/images/socialdialogue1.webp",
    "/images/socialdialogue2.webp",
    "/images/socialdialogue3.webp",
    "/images/socialdialogue4.webp",
    "/images/socialdialogue5.webp",
    "/images/socialdialogue6.webp",
  ];

  return (
    <div>
      {/* 이미지 목록 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          textAlign: "center",   // 이 div에만 적용
        }}
      >
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
      <div style={{ marginTop: "40px", textAlign: "center" }}>
  <button
    onClick={() => setShowInquiry(true)}
    style={{
      minWidth: isMobile ? "160px" : isTablet ? "200px" : "240px",
      height: isMobile ? "44px" : isTablet ? "52px" : "60px",
      backgroundColor: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: "50px",
      cursor: "pointer",
      fontSize: isMobile ? "14px" : isTablet ? "16px" : "20px",
      fontWeight: "600",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
