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
    <div style={{
      maxWidth: 520,
      margin: "0 auto",
      padding: "32px 0"
    }}>
      <div style={{
        borderRadius: 14,
        background: "#fff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.09)",
        padding: "40px 32px 32px 32px",
        marginBottom: 32
      }}>
        {/* 결제 완료 메시지 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 46,
            color: "#27ae60",
            marginBottom: 8
          }}>✔</div>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 6
          }}>결제가 완료되었습니다!</div>
          <div style={{ color: "#888", fontSize: 15 }}>
            주문해주셔서 감사합니다.
          </div>
        </div>
  
        {/* (선택) 주문일시/주문자 정보 */}
        <div style={{
          marginBottom: 16,
          color: "#888",
          fontSize: 13,
          textAlign: "center"
        }}>
          {order && <>주문일시: {new Date(order.created_at).toLocaleString()}<br /></>}
          {user && <span>주문자: {user?.username || user?.email}</span>}
        </div>
  
        {/* 주문 상품 카드형 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>주문 상품</div>
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8f9fa",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 12,
                  gap: 16
                }}
              >
<div style={{
  width: 56,
  height: 56,
  background: "#eee",
  borderRadius: 8,
  overflow: "hidden",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  color: "#bbb",
  wordBreak: "keep-all",        // 추가!
  whiteSpace: "pre-line",       // 추가!
  textAlign: "center",          // 추가!
  padding: "0 2px",             // 추가!
  lineHeight: 1.3,              // 추가! (글자가 박스 내에 잘림 없이)
}}>
  {item.thumbnail_url
    ? <img src={item.thumbnail_url} alt="썸네일" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : <span>썸네일 없음</span>
  }
</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3, color: "#333" }}>
                    {item.title}
                  </div>
                  <div style={{ color: "#888", fontSize: 14, marginBottom: 2 }}>
                    {item.option_str || ""}
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {item.quantity}개
                  </div>
                </div>
                <div style={{ minWidth: 80, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#111" }}>
                  {formatPrice((item.discount_price ?? item.unit_price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* 결제 금액 요약 */}
        <div style={{ fontSize: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ color: "#666" }}>총 상품금액</span>
            <span>{formatPrice(totalBeforeDiscount)}</span>
          </div>
          {couponDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ color: "#666" }}>쿠폰 할인</span>
              <span style={{ color: "#e23e57" }}>- {formatPrice(couponDiscount)}</span>
            </div>
          )}
          {user?.used_point > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ color: "#666" }}>포인트 사용</span>
              <span style={{ color: "#20bfa9" }}>- {formatPrice(user.used_point)}</span>
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontWeight: "bold", fontSize: 18, color: "#222", marginTop: 12
          }}>
            <span>최종 결제금액</span>
            <span>{formatPrice(totalAfterDiscount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
const formatPrice = (num) => `${Number(num).toLocaleString("ko-KR")}원`;
