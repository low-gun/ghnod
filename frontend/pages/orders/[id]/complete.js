import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function OrderCompletePage() {
  const router = useRouter();
  const { id: orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const fetchData = async () => {
      try {
        const [orderRes, itemRes, userRes] = await Promise.all([
          api.get("/orders"),
          api.get(`/orders/${orderId}/items`),
          api.get("/user"),
        ]);

        if (!itemRes.data.order)
          throw new Error("주문 상세 정보를 찾을 수 없습니다.");

        setOrder(itemRes.data.order);
        setItems(itemRes.data.items || []);
        setUser(userRes.data);
        // ✅ 여기 추가
        await api.put(`/orders/${orderId}`);
        // ✅ 주문 완료 후 장바구니 초기화 (cart_items 기준)
        // ✅ 로그인 상태일 때만 clear 호출 (게스트 유저 제외)
        if (user?.id) {
          try {
            await api.delete("/cart/items/clear");
            console.log("🧹 cart_items 초기화 완료");
          } catch (err) {
            console.warn("❌ cart clear 실패:", err);
          }
        }
      } catch (err) {
        console.error("❌ 주문 완료 페이지 오류:", err);
        setErrorMsg("주문 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // ✅ 1. 뒤로가기 방지 (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // 일부 브라우저에서는 이 설정이 경고를 보여줌
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (isLoading)
    return <p style={{ padding: 40 }}>⏳ 주문 정보를 불러오는 중입니다...</p>;
  if (errorMsg) return <p style={{ padding: 40, color: "red" }}>{errorMsg}</p>;

  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalAfterDiscount = order.total_amount;
  const couponDiscount = Number(order?.coupon_discount ?? 0);
  console.log("🎯 [OrderCompletePage] 최종 쿠폰 할인액:", couponDiscount); // ✅ 여기에
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>
        ✅ 결제가 완료되었습니다
      </h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 12,
          padding: 24,
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <p style={{ fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>
          🧾 주문번호 #{orderId}
        </p>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
          주문일시: {new Date(order.created_at).toLocaleString()}
        </p>

        <p style={{ marginBottom: 8 }}>
          <strong>주문자:</strong> {user?.username || user?.email}
        </p>

        <hr style={{ margin: "20px 0" }} />

        <h4 style={{ fontSize: 16, marginBottom: 8 }}>📦 주문 상품</h4>
        <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
          {items.map((item) => {
            console.log("🧾 주문 항목:", item); // ✅ 여기!

            return (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    color: "#0070f3",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    if (item.schedule_id) {
                      router.push(`/schedules/${item.schedule_id}`);
                    }
                  }}
                >
                  {item.title} x {item.quantity}
                </span>
                <span>
                  {formatPrice(
                    (item.discount_price ?? item.unit_price) * item.quantity
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div style={{ fontSize: 15 }}>
          <div style={rowStyle()}>
            <span>총 상품금액</span>
            <span>{formatPrice(totalBeforeDiscount)}</span>
          </div>
          <div style={rowStyle()}>
            <span>쿠폰 할인</span>
            <span>- {formatPrice(couponDiscount)}</span>
          </div>
          <div style={rowStyle()}>
            <span>포인트 사용</span>
            <span>- {formatPrice(user?.used_point || 0)}</span>
          </div>
          <div style={rowStyle("bold", "#111", 18, true)}>
            <span>결제 금액</span>
            <span>{formatPrice(totalAfterDiscount)}</span>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: "#555" }}>
        💬 결제 정보는 이메일로도 안내됩니다.
      </p>
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          backgroundColor: "#333",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🛍 다시 쇼핑하기
      </button>
    </div>
  );
}

const rowStyle = (
  fontWeight = "normal",
  color = "#333",
  fontSize = 15,
  marginTop = false
) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: marginTop ? 12 : 4,
  fontWeight,
  color,
  fontSize,
});

const formatPrice = (num) => `${Number(num).toLocaleString("ko-KR")}원`;
