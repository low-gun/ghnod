import { useEffect, useState } from "react";
import api from "@/lib/api"; // ✅ axios 인스턴스 경로

export default function TabProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false); // productId 없을 때도 로딩 false로 처리
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
  }, [productId]);

  return (
    <section
      id="review"
      style={{ padding: "40px 0", borderBottom: "1px solid #eee" }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        상품후기
      </h2>

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
        <ul style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {reviews.map((r) => (
            <li
              key={r.id}
              style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}
            >
              <strong>{r.username}</strong> &nbsp;⭐ {r.rating}/5
              <p style={{ marginTop: 8 }}>{r.comment}</p>
              <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
