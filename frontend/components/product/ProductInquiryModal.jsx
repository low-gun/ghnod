import { useState } from "react";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useEffect } from "react";
export default function ProductInquiryModal({
  productId,
  initialData = null,
  onClose,
  onSubmitSuccess,
}) {
  const { user } = useUserContext();

  const [title, setTitle] = useState(initialData?.title || "");
  const [message, setMessage] = useState(initialData?.message || "");
  const [isPrivate, setIsPrivate] = useState(
    initialData?.is_private === 0 ? false : true
  );

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      return alert("제목과 내용을 입력해주세요.");
    }

    if (!user && (!guestName || !guestPhone)) {
      return alert("이름과 연락처를 입력해주세요.");
    }

    const payload = {
      product_id: productId,
      user_id: user?.id ?? null,
      title,
      message,
      is_private: isPrivate,
      guest_name: user ? null : guestName,
      guest_phone: user ? null : guestPhone,
    };

    try {
      setLoading(true);
      let res;
      if (initialData?.id) {
        // 수정 요청
        res = await api.put(
          `/products/${productId}/inquiries/${initialData.id}`,
          payload
        );
      } else {
        // 신규 등록
        res = await api.post(`/products/${productId}/inquiries`, payload);
      }
      if (res.data.success) {
        alert("문의가 등록되었습니다.");
        onSubmitSuccess();
      } else {
        alert("문의 등록 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("문의 등록 오류:", err);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };
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
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
          {initialData?.id ? "상품 문의 수정" : "상품 문의 작성"}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            내용
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
              resize: "vertical",
            }}
          />
        </div>

        {!user && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 14 }}>이름</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 14 }}>연락처</label>
              <input
                type="text"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                }}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            비공개 문의
          </label>
        </div>

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
