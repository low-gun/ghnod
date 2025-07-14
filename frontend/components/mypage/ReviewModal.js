import React, { useState, useEffect } from "react";
import api from "@/lib/api";

export default function ReviewModal({
  visible,
  onClose,
  productId,
  reviewId,
  initialData,
  onSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(initialData?.rating || 0);
      setComment(initialData?.comment || "");
    }
  }, [visible, initialData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return alert("내용을 입력해주세요.");
    try {
      setLoading(true);
      if (reviewId) {
        await api.put(`/products/${productId}/reviews/${reviewId}`, {
          rating,
          comment,
        });
      } else {
        await api.post(`/products/${productId}/reviews`, { rating, comment });
      }
      alert(`후기가 ${reviewId ? "수정" : "등록"}되었습니다!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("후기 작성 실패:", err);
      alert("후기 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reviewId) return;
    if (!window.confirm("후기를 삭제하시겠습니까?")) return;

    try {
      setLoading(true);
      await api.delete(`/products/${productId}/reviews/${reviewId}`);
      alert("후기가 삭제되었습니다.");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("❌ 후기 삭제 실패:", err);
      alert("후기 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          ×
        </button>

        {/* 리뷰 이미지 썸네일 여러 장 지원 */}
{Array.isArray(initialData?.images) && initialData.images.length > 0 && (
  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
    {initialData.images.map((img, idx) => (
      <img
        key={idx}
        src={img.thumbnail}
        alt={`리뷰 이미지 썸네일 ${idx + 1}`}
        style={thumbnailStyle}
      />
    ))}
  </div>
)}

        {/* 강의명 */}
        {initialData?.title && (
          <div style={titleTextStyle}>{initialData.title}</div>
        )}

        {/* 별점 UI */}
        <div style={{ marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              onClick={() => setRating(n)}
              style={{
                fontSize: 28,
                cursor: "pointer",
                color: n <= rating ? "#f39c12" : "#ddd",
                marginRight: 4,
                userSelect: "none", // ✅ 드래그 방지
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* 후기 입력란 */}
        <div style={{ marginBottom: 8 }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            style={{ ...inputStyle, width: "100%", resize: "none" }}
            placeholder="수강후기를 작성해주세요."
          />
        </div>

        {/* 작성일시 / 수정일시 */}
        {initialData?.created_at && (
          <div style={metaTextStyle}>
            작성일시: {new Date(initialData.created_at).toLocaleString("ko-KR")}
          </div>
        )}
        {initialData?.updated_at &&
          initialData.updated_at !== initialData.created_at && (
            <div style={metaTextStyle}>
              수정일시:{" "}
              {new Date(initialData.updated_at).toLocaleString("ko-KR")}
            </div>
          )}

        {/* 버튼들 */}
        <div style={buttonRowStyle}>
          {reviewId && (
            <button
              onClick={handleDelete}
              disabled={loading}
              style={buttonStyle("#ccc", "#333")}
            >
              삭제
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={buttonStyle("#0070f3", "#fff")}
          >
            {reviewId ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 스타일 정의
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  position: "relative",
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "24px",
  width: "400px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
};

const thumbnailStyle = {
  width: "100%",
  height: "160px",
  objectFit: "cover",
  borderRadius: "8px",
  marginBottom: "12px",
};

const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
};

const titleTextStyle = {
  marginBottom: 12,
  fontWeight: "bold",
  fontSize: "16px",
};

const metaTextStyle = {
  fontSize: "12px",
  color: "#888",
  marginBottom: 4,
};

const inputStyle = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const buttonStyle = (bg, color) => ({
  padding: "8px 14px",
  backgroundColor: bg,
  color,
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
});

const buttonRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};
