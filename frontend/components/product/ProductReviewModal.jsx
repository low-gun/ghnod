import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function ProductReviewModal({
  productId,
  initialData = null, // ✅ 수정 모드 지원
  onClose,
  onSubmitSuccess,
}) {
  const { user } = useUserContext();

  // ✅ 초기값 세팅 (작성 vs 수정 모드)
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      return alert("별점과 후기를 입력해주세요.");
    }

    try {
      setLoading(true);
      let res;

      if (initialData?.id) {
        // ✅ 수정 요청
        res = await api.put(
          `/products/${productId}/reviews/${initialData.id}`,
          {
            user_id: user.id,
            rating,
            comment,
          }
        );
      } else {
        // 신규 등록
        res = await api.post(`/products/${productId}/reviews`, {
          user_id: user.id,
          rating,
          comment,
        });
      }

      if (res.data.success) {
        alert("후기가 등록되었습니다.");
        onSubmitSuccess?.();
        onClose();
      } else {
        alert("등록 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("리뷰 등록 오류:", err);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          width: "100%",
          maxWidth: 480,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
          {initialData?.id ? "상품 후기 수정" : "상품 후기 작성"}
        </h3>

        {/* 별점 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, marginBottom: 6, display: "block" }}>
              별점
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  onClick={() => setRating(i)}
                  style={{
                    fontSize: 28,
                    color: i <= rating ? "#f39c12" : "#ddd",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, marginBottom: 6, display: "block" }}>
            후기 내용
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
