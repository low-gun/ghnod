import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProductInquiryModal from "@/components/product/ProductInquiryModal";
import { useRouter } from "next/router";
import { useUserContext } from "@/context/UserContext";

export default function TabProductInquiry({ productId }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { user } = useUserContext();
  const [editTarget, setEditTarget] = useState(null);
  const handleDelete = async (inquiryId) => {
    if (!confirm("정말로 이 문의를 삭제하시겠습니까?")) return;

    try {
      const res = await api.delete(
        `/products/${productId}/inquiries/${inquiryId}`
      );
      if (res.data.success) {
        alert("삭제되었습니다.");
        // 목록 새로고침
        const refreshed = await api.get(`/products/${productId}/inquiries`);
        if (refreshed.data.success) {
          setInquiries(refreshed.data.inquiries);
        }
      } else {
        alert("삭제 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("문의 삭제 오류:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!productId) return;
    api
      .get(`/products/${productId}/inquiries`)
      .then((res) => {
        if (res.data.success) {
          setInquiries(res.data.inquiries);
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <section
      id="inquiry"
      style={{ padding: "40px 0", borderBottom: "1px solid #eee" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
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
          상품문의
        </h2>

        <button
          onClick={() => {
            if (!user) {
              alert("로그인 후 문의를 작성하실 수 있습니다.");
              return router.push("/login");
            }
            setShowModal(true);
          }}
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
          상품 문의하기
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#999" }}>불러오는 중...</p>
      ) : inquiries.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#888",
            backgroundColor: "#fafafa",
            borderRadius: 8,
          }}
        >
          등록된 문의가 없습니다.
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
          {inquiries.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              {/* 제목 + 뱃지 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      backgroundColor: "#0070f3",
                      color: "#fff",
                      padding: "2px 8px",
                      fontSize: 12,
                      borderRadius: 12,
                    }}
                  >
                    질문
                  </span>
                  <strong style={{ fontSize: 15 }}>
                    {item.is_private && user?.id !== item.user_id
                      ? "🔒 비공개 문의입니다"
                      : item.title}
                  </strong>
                </div>

                <span style={{ fontSize: 12, color: "#aaa" }}>
                  {new Date(item.created_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* 본문 */}
              {!(item.is_private && user?.id !== item.user_id) && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#333",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.message}
                </p>
              )}

              {/* 본인 + 답변 전이면 수정/삭제 버튼 */}
              {user?.id === item.user_id && !item.answer && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    onClick={() => {
                      setEditTarget(item);
                      setShowModal(true);
                    }}
                    style={{
                      padding: "4px 10px",
                      fontSize: 13,
                      backgroundColor: "#fff",
                      color: "#333",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 13,
                      backgroundColor: "#fff",
                      color: "#e74c3c",
                      border: "1px solid #e74c3c",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}

              {/* 답변 영역 */}
              {item.answer && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: "#f7f7f7",
                    borderRadius: 6,
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                    color: "#444",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#999",
                        color: "#fff",
                        padding: "2px 8px",
                        fontSize: 12,
                        borderRadius: 12,
                      }}
                    >
                      답변
                    </span>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#999",
                            color: "#fff",
                            padding: "2px 8px",
                            fontSize: 12,
                            borderRadius: 12,
                          }}
                        >
                          답변
                        </span>
                        <strong style={{ color: "#333" }}>관리자</strong>
                      </div>

                      <span style={{ fontSize: 12, color: "#aaa" }}>
                        {new Date(item.answered_at).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {item.answer}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <ProductInquiryModal
          productId={productId}
          initialData={editTarget}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSubmitSuccess={() => {
            setShowModal(false);
            setEditTarget(null);
            api.get(`/products/${productId}/inquiries`).then((res) => {
              if (res.data.success) setInquiries(res.data.inquiries);
            });
          }}
        />
      )}
    </section>
  );
}
