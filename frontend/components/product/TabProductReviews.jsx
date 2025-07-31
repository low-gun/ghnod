import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import ProductReviewModal from "./ProductReviewModal";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 추가

console.log("🔥 ProductReviewModalNew 연결됨");

export default function TabProductReviews({ productId, scheduleId }) {
  const { user } = useUserContext();
  const [isPurchaser, setIsPurchaser] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null); // 열려 있는 메뉴의 후기 ID
  const [editTarget, setEditTarget] = useState(null);
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const { showConfirm } = useGlobalConfirm(); // ✅ 추가
  const handleDelete = async (reviewId) => {
    try {
      const res = await api.delete(
        `/products/${productId}/reviews/${reviewId}`
      );
      if (res.data.success) {
        showAlert("삭제되었습니다.");
        fetchReviews();
      } else {
        showAlert("삭제 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("후기 삭제 오류:", err);
      showAlert("삭제 중 오류가 발생했습니다.");
    }
  };
  const fetchReviews = () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    api
      .get(`/products/${productId}/reviews`)
      .then((res) => {
        setReviews(res.data.reviews || []);
      })
      .catch((err) => {
        console.error("후기 로딩 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".review-menu")) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    z;
  }, []);
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (!user || !scheduleId) return;

    api
      .get(`/education/schedules/${scheduleId}/reviews/check-eligible`)
      .then((res) => {
        if (res.data.success) setIsPurchaser(res.data.eligible);
      });
  }, [user, scheduleId]);
  return (
    <section
      id="review"
      style={{ padding: "40px 0", borderBottom: "1px solid #eee" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: "bold",
            margin: 0,
            flexShrink: 0,
          }}
        >
          상품후기
        </h2>

        {user && isPurchaser && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            후기 작성하기
          </button>
        )}
      </div>

      {loading ? (
        <></>
      ) : reviews.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            backgroundColor: "#fafafa",
            color: "#888",
            fontSize: 14,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 8 }}>등록된 후기가 없습니다.</p>
          <p>첫 후기를 남겨보세요!</p>
        </div>
      ) : (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            listStyle: "none", // ← ✅ 이 줄 추가
            paddingLeft: 0, // ← ✅ 불필요한 들여쓰기도 제거
          }}
        >
          {reviews.map((r) => (
            <li
              key={r.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                backgroundColor: "#fff",
                position: "relative",
              }}
            >
              {/* 제목(작성자) + 날짜 + 메뉴 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{r.username}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    {new Date(r.created_at).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>

                  {user?.id === r.user_id && (
                    <div
                      style={{ position: "relative" }}
                      className="review-menu"
                    >
                      <button
                        onClick={() =>
                          setMenuOpenId(menuOpenId === r.id ? null : r.id)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 20,
                          cursor: "pointer",
                          color: "#666",
                          padding: "0 4px",
                          lineHeight: 1,
                        }}
                      >
                        ⋯
                      </button>

                      {menuOpenId === r.id && (
                        <div
                          className="review-menu"
                          style={{
                            position: "absolute",
                            top: 28,
                            right: 0,
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            zIndex: 10,
                            width: 100,
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditTarget(r);
                              setShowModal(true);
                              setMenuOpenId(null);
                            }}
                            style={menuButtonStyle}
                          >
                            수정하기
                          </button>
                          <button
                            onClick={async () => {
                              const ok =
                                await showConfirm("정말 삭제하시겠습니까?");
                              if (ok) {
                                handleDelete(r.id);
                              }
                              setMenuOpenId(null);
                            }}
                            style={{ ...menuButtonStyle, color: "#e74c3c" }}
                          >
                            삭제하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 별점 */}
              <div style={{ fontSize: 14, color: "#f39c12" }}>
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>

              {/* 내용 */}
              <p style={{ marginTop: 8 }}>{r.comment}</p>
              {/* 리뷰 이미지 썸네일 */}
              {Array.isArray(r.images) && r.images.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {r.images.map((img, idx) => (
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
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <ProductReviewModal
          productId={productId}
          initialData={editTarget}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSubmitSuccess={() => {
            setShowModal(false);
            setEditTarget(null);
            fetchReviews();
          }}
        />
      )}
    </section>
  );
}

const menuButtonStyle = {
  width: "100%",
  padding: "8px 12px",
  background: "none",
  border: "none",
  textAlign: "left",
  fontSize: 14,
  cursor: "pointer",
};
