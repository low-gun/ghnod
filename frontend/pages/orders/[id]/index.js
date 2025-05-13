import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";

function formatDateRange(start, end) {
  const s = new Date(start).toLocaleDateString("ko-KR");
  const e = new Date(end).toLocaleDateString("ko-KR");
  return s === e ? s : `${s} ~ ${e}`;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchItems = async () => {
      try {
        const res = await api.get(`/orders/${id}/items`);
        setItems(res.data.items || []);
        setOrder(res.data.order || null);
      } catch (err) {
        console.error("❌ 주문 항목 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [id]);

  if (loading) return <p style={{ padding: 40 }}>불러오는 중...</p>;
  if (!items.length)
    return <p style={{ padding: 40 }}>주문 내역이 없습니다.</p>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        주문 상세내역
      </h2>

      {/* 주문 요약 정보 */}
      {order && (
        <div
          style={{
            marginBottom: 24,
            background: "#f9f9f9",
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 8,
            lineHeight: "1.6",
            fontSize: 15,
          }}
        >
          <div>
            총 상품금액:{" "}
            <strong>
              {formatPrice(
                order.total_amount +
                  (order.used_point || 0) +
                  (order.coupon_discount || 0)
              )}
              원
            </strong>
          </div>
          <div>
            쿠폰 할인:{" "}
            <strong>{formatPrice(order.coupon_discount || 0)}원</strong>
          </div>
          <div>
            포인트 사용: <strong>{formatPrice(order.used_point || 0)}P</strong>
          </div>
          <hr style={{ margin: "12px 0" }} />
          <div style={{ fontWeight: "bold", fontSize: 16 }}>
            결제금액:{" "}
            <span style={{ color: "#0070f3" }}>
              {formatPrice(order.total_amount)}원
            </span>
          </div>
        </div>
      )}

      {/* 항목 카드 리스트 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            {/* ✅ 여기부터 */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                border: "1px solid #ccc",
                borderRadius: 8,
                backgroundColor: "#f9f9f9",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain", // ✅ 잘리지 않게 유지
                  }}
                />
              ) : (
                <span style={{ color: "#999", fontSize: 13 }}>이미지 없음</span>
              )}
            </div>

            <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
              {item.title}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              교육기간: {formatDateRange(item.start_date, item.end_date)}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              수량: {item.quantity}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              단가:{" "}
              {item.discount_price && item.discount_price < item.price ? (
                <>
                  <span
                    style={{ textDecoration: "line-through", marginRight: 8 }}
                  >
                    {formatPrice(item.price)}원
                  </span>
                  <span style={{ color: "#d32f2f" }}>
                    {formatPrice(item.discount_price)}원
                  </span>
                </>
              ) : (
                `${formatPrice(item.unit_price)}원`
              )}
            </div>

            <div style={{ fontSize: 14, color: "#555" }}>
              합계: {formatPrice(item.subtotal)}원
            </div>

            {/* 상세보기 버튼 */}
            {item.type && item.schedule_id && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() =>
                    router.push(`/education/${item.type}/${item.schedule_id}`)
                  }
                  style={{
                    padding: "6px 12px",
                    background: "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  상세보기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
