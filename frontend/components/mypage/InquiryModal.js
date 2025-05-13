import React, { useState } from "react";
import api from "@/lib/api";

export default function InquiryModal({ onClose, onSubmitted }) {
  if (typeof onSubmitted !== "function") {
    throw new Error("❌ InquiryModal 사용 시 onSubmitted는 필수입니다.");
  }
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("message", message);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      await api.post("/mypage/inquiries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("문의가 제출되었습니다.");

      if (typeof onSubmitted === "function") {
        onSubmitted(); // ✅ 안전하게 호출
      }

      onClose();
    } catch (err) {
      console.error("문의 제출 실패", err);
      alert("제출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ marginBottom: 20, fontSize: "1.2rem" }}>
          📩 1:1 문의 작성
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={formItem}>
            <label
              style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}
            >
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={formItem}>
            <label>내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={textareaStyle}
            />
          </div>

          <div style={formItem}>
            <label>첨부파일</label>
            <div style={fileRowStyle}>
              <input type="file" onChange={handleFileChange} />
              {attachment && (
                <>
                  <span style={fileNameStyle}>{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    style={deleteIconStyle}
                    title="파일 삭제"
                  >
                    ❌
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={buttonRowStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>
              닫기
            </button>
            <button type="submit" disabled={loading} style={submitButtonStyle}>
              {loading ? "제출 중..." : "제출"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// 스타일
// ──────────────────────────────────────

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "10px",
  width: "90%",
  maxWidth: "500px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  fontFamily: "Noto Sans KR, -apple-system, BlinkMacSystemFont, sans-serif", // ✅ 추가
};

const formItem = {
  marginBottom: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "0.95rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "100px",
};

const fileRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const fileNameStyle = {
  fontSize: "0.85rem",
  color: "#555",
  flexGrow: 1,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const deleteIconStyle = {
  cursor: "pointer",
  color: "#888",
  fontSize: "1rem",
  border: "none",
  background: "transparent",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const submitButtonStyle = {
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "8px 16px",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const cancelButtonStyle = {
  backgroundColor: "#f1f1f1",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "4px",
  padding: "8px 16px",
  fontSize: "0.9rem",
  cursor: "pointer",
};
