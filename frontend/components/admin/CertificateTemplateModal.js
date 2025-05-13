import React, { useState, useEffect } from "react";
import api from "@/lib/api";
const PREVIEW_PADDING = 24;
export default function CertificateTemplateModal({
  visible,
  onClose,
  onSave,
  initialValue,
  initialBackgroundUrl,
}) {
  const [certificateHtml, setCertificateHtml] = useState(initialValue || "");
  const [backgroundUrl, setBackgroundUrl] = useState(
    initialBackgroundUrl || ""
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [orientation, setOrientation] = useState("portrait");
  const [scale, setScale] = useState(1); // ⭐️ 추가
  const [releaseDate, setReleaseDate] = useState("");
  const [isActive, setIsActive] = useState(true); // 기본 활성화
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  useEffect(() => {
    const recalc = () => {
      const containerWidth = 900;
      const baseWidth = orientation === "portrait" ? 794 : 1123;
      const baseHeight = orientation === "portrait" ? 1123 : 794;

      const widthScale = containerWidth / baseWidth;
      const heightScale =
        (window.innerHeight * 0.7 - PREVIEW_PADDING * 2) / baseHeight;

      setScale(Math.min(widthScale, heightScale));
    };

    recalc(); // 초기 계산
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [orientation]);
  if (!visible) return null;

  const handleUploadBackground = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/admin/certificates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // 업로드 성공했을 때
      if (res.data.success) {
        const BASE_UPLOAD_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
          "http://localhost:5001";
        const finalUrl = `${BASE_UPLOAD_URL}${res.data.url}`; // ✅ 포트 5001 붙여서 완성
        setBackgroundUrl(finalUrl);
        alert("배경이미지 업로드 완료!");
      } else {
        alert("업로드 실패");
      }
    } catch (err) {
      console.error("❌ 배경이미지 업로드 오류:", err);
      alert("업로드 중 오류 발생");
    }
  };

  const handleSave = () => {
    if (!certificateHtml.trim()) {
      alert("HTML 코드를 입력하세요.");
      return;
    }
    onSave({
      html: certificateHtml,
      backgroundUrl,
      release_date: releaseDate,
      is_active: isActive,
    });
  };

  const previewPageStyle = (scale, orientation) => {
    const baseWidth = orientation === "portrait" ? 794 : 1123;
    const baseHeight = orientation === "portrait" ? 1123 : 794;

    return {
      width: baseWidth * scale,
      height: baseHeight * scale,
      background: backgroundUrl
        ? `url('${backgroundUrl}') no-repeat center/cover`
        : "#fff",
      boxShadow: "0 0 10px rgba(0,0,0,0.3)",
      padding: 0,
      boxSizing: "border-box",
      overflow: "hidden",
    };
  };
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  // return 위쪽 아무 곳에 추가
  const scaledHtml = React.useMemo(() => {
    // 숫자가 몇 px 이든 전부 제거
    return certificateHtml.replace(/padding:\s*\d+(\.\d+)?px;?/gi, "");
  }, [certificateHtml]);
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle} aria-label="닫기">
          ×
        </button>

        <h2 style={{ marginBottom: "16px" }}>
          수료증 템플릿 {initialValue ? "수정" : "등록"}
        </h2>

        {/* 방향/업로드 선택 */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setOrientation("portrait")}
            style={{
              ...orientationButtonStyle,
              backgroundColor: orientation === "portrait" ? "#0070f3" : "#ccc",
              color: orientation === "portrait" ? "#fff" : "#000",
            }}
          >
            세로형
          </button>
          <button
            onClick={() => setOrientation("landscape")}
            style={{
              ...orientationButtonStyle,
              backgroundColor: orientation === "landscape" ? "#0070f3" : "#ccc",
              color: orientation === "landscape" ? "#fff" : "#000",
            }}
          >
            가로형
          </button>

          {/* 업로드 버튼 */}
          <label style={{ marginLeft: "auto", fontSize: "14px" }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUploadBackground}
            />
            <span
              style={{
                padding: "8px 12px",
                backgroundColor: "#10b981",
                color: "#fff",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              배경 업로드
            </span>
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "10px",
            alignItems: "center",
          }}
        >
          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold" }}>
              다운로드 시작일:
            </label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              style={{
                marginLeft: "8px",
                padding: "6px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            <label style={{ fontSize: "14px", marginRight: "8px" }}>
              활성화:
            </label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "20px", height: "20px" }}
            />
          </div>
        </div>
        {/* 입력/미리보기 */}
        {!previewMode ? (
          <textarea
            value={certificateHtml}
            onChange={(e) => setCertificateHtml(e.target.value)}
            placeholder="여기에 수료증 HTML 코드를 입력하세요"
            style={textareaStyle}
          />
        ) : (
          <div style={previewContainerStyle}>
            <div
              style={previewPageStyle(scale, orientation)}
              dangerouslySetInnerHTML={{ __html: scaledHtml }}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={secondaryButtonStyle}
          >
            {previewMode ? "코드 수정" : "미리보기"}
          </button>

          <button onClick={handleSave} style={primaryButtonStyle}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ✨ 스타일
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  position: "relative",
  width: "960px",
  maxHeight: "90vh",
  height: "90vh", // ✅ 강제 높이
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  overflow: "hidden", // ✅ 스크롤 제거
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "transparent",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
};

const orientationButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const textareaStyle = {
  width: "100%",
  height: "400px",
  padding: "12px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontFamily: "monospace",
  resize: "vertical",
};

const previewContainerStyle = {
  flex: 1,
  background: "#f9f9f9",
  marginTop: 16,
  paddingTop: PREVIEW_PADDING,
  paddingBottom: PREVIEW_PADDING,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
};

const primaryButtonStyle = {
  padding: "10px 20px",
  marginLeft: "10px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#ccc",
  color: "#000",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
