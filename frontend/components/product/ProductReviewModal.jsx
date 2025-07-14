import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export default function ProductReviewModal({
  productId,
  initialData = null,
  onClose,
  onSubmitSuccess,
}) {
  const { user } = useUserContext();

  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || "");
  const [loading, setLoading] = useState(false);

  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.slice(0, 10 - imageFiles.length);
    if (newFiles.length === 0) return;
    setImageFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!rating) return alert("별점을 입력해주세요.");

    try {
      setLoading(true);

      let uploadedImages = [];

if (imageFiles.length > 0) {
  const uploadPromises = imageFiles.map((file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload", form).then((res) => res.data); // { original, thumbnail }
  });

  uploadedImages = await Promise.all(uploadPromises);
}

const payload = {
  user_id: user.id,
  rating,
  comment,
  images: uploadedImages, // [{ original, thumbnail }]
};

      let res;
      if (initialData?.id) {
        res = await api.put(`/products/${productId}/reviews/${initialData.id}`, payload);
      } else {
        res = await api.post(`/products/${productId}/reviews`, payload);
      }

      if (res.data.success) {
        alert("후기가 등록되었습니다.");
        onSubmitSuccess?.();
        onClose();
      } else {
        alert("등록 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("후기 등록 오류:", err);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const escHandler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, []);

  if (!user) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
        {initialData?.id ? "상품후기 수정하기" : "상품후기 작성하기"}
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>별점</label>
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

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>후기 내용</label>
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

        <div style={{ marginBottom: 16 }}>
  <label style={labelStyle}>이미지 첨부 (최대 10장)</label>
  
  {/* 서버 저장 리뷰 이미지 썸네일 보여주기 */}
  {Array.isArray(initialData?.images) && initialData.images.length > 0 && (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      {initialData.images.map((img, idx) => (
        <img
          key={idx}
          src={img.thumbnail}
          alt={`리뷰 이미지 썸네일 ${idx + 1}`}
          style={{
            width: 72,
            height: 72,
            objectFit: "cover",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
      ))}
    </div>
  )}

  {/* 업로드 중인 로컬 이미지 미리보기 */}
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {previewUrls.map((url, idx) => (
      <div key={idx} style={{ position: "relative" }}>
        <img
          src={url}
          alt={`이미지 ${idx + 1}`}
          style={{
            width: 72,
            height: 72,
            objectFit: "cover",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={() => removeImage(idx)}
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: "#f00",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 20,
            height: 20,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    ))}
    {imageFiles.length < 10 && (
      <label style={uploadLabelStyle}>
        +
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
      </label>
    )}
  </div>
</div>


        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={loading} style={cancelButtonStyle}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading} style={submitButtonStyle}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
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
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: 24,
  width: "100%",
  maxWidth: 480,
  borderRadius: 8,
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const labelStyle = {
  fontSize: 14,
  marginBottom: 6,
  display: "block",
};

const uploadLabelStyle = {
  width: 72,
  height: 72,
  border: "2px dashed #ccc",
  borderRadius: 4,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 28,
  color: "#aaa",
  cursor: "pointer",
};

const cancelButtonStyle = {
  padding: "8px 16px",
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};

const submitButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
};
