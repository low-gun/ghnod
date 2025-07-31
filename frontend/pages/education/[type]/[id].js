import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useCartContext } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext";
import ProductTabs from "@/components/product/ProductTabs";
import TabProductDetail from "@/components/product/TabProductDetail";
import TabProductReviews from "@/components/product/TabProductReviews";
import TabProductInquiry from "@/components/product/TabProductInquiry";
import TabRefundPolicy from "@/components/product/TabRefundPolicy";
import { ShoppingCart } from "lucide-react";
import { useIsMobile, useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function EducationScheduleDetailPage() {
  const router = useRouter();
  const { cartItems, setCartItems, refreshCart } = useCartContext();
  const { user } = useUserContext();
  const { type, id } = router.query;
  const [schedule, setSchedule] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTabletOrBelow = useIsTabletOrBelow();
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/education/schedules/${id}`)
      .then((res) => {
        if (res.data.success) setSchedule(res.data.schedule);
        else showAlert("일정 정보를 불러오지 못했습니다.");
      })
      .catch(() => showAlert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const unitPrice = useMemo(
    () => Number(schedule?.price ?? schedule?.product_price ?? 0),
    [schedule]
  );

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      showAlert("로그인 후 결제하실 수 있습니다.");
      router.push("/login");
      return;
    }
    if (!schedule) return showAlert("일정 정보를 불러오지 못했습니다.");
    try {
      router.push({
        pathname: "/checkout",
        query: {
          buyNow: encodeURIComponent(
            JSON.stringify({
              schedule_id: schedule.id,
              quantity,
              unit_price: unitPrice,
              discount_price: 0,
            })
          ),
        },
      });
    } catch (err) {
      showAlert("바로구매 중 오류가 발생했습니다.");
    }
  }, [user, schedule, quantity, unitPrice, router]);

  // 장바구니 함수 분리
  const handleAddToCart = useCallback(async () => {
    try {
      const payload = {
        schedule_id: schedule.id,
        quantity,
        unit_price: unitPrice,
        type: "cart",
      };
      const guestToken = localStorage.getItem("guest_token");
      const res = await api.post("/cart/items", payload, {
        headers: { "x-guest-token": guestToken || "" },
      });
      if (res.data.success) {
        showAlert("장바구니에 담았습니다!");
        await refreshCart();
      } else {
        showAlert("장바구니 담기에 실패했습니다.");
      }
    } catch {
      showAlert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [schedule, quantity, unitPrice, refreshCart]);

  if (loading) return null;
  if (!schedule)
    return <p style={{ padding: 40 }}>일정 정보를 찾을 수 없습니다.</p>;

  // 스타일 상수화(중복 제거)
  const actionBtnStyle = (main) => ({
    flex: 1,
    minWidth: isMobile ? undefined : "40%",
    padding: isMobile ? "12px 0" : "10px 16px",
    border: main ? "none" : "1px solid #0070f3",
    backgroundColor: main ? "#0070f3" : "#fff",
    color: main ? "#fff" : "#0070f3",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 40,
        fontSize: 16,
        color: "#333",
      }}
    >
      {/* 브레드크럼브 */}
      <div style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>
        <span
          onClick={() => router.push("/education")}
          style={{ cursor: "pointer", marginRight: 6 }}
        >
          교육
        </span>
        &gt;
        <span
          onClick={() => router.push(`/education/${type}`)}
          style={{ cursor: "pointer", marginLeft: 6 }}
        >
          {type}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isTabletOrBelow ? "column" : "row",
          gap: isTabletOrBelow ? 24 : 40,
          alignItems: isTabletOrBelow ? "stretch" : "flex-start",
        }}
      >
        {/* 썸네일 */}
        <div style={{ flex: 1 }}>
          {schedule.image_url || schedule.product_image ? (
            <img
              src={schedule.image_url || schedule.product_image}
              alt={schedule.title}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 8,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                border: "1px solid #ccc",
                borderRadius: 8,
                backgroundColor: "#f9f9f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#888" }}>이미지가 없습니다</span>
            </div>
          )}
        </div>
        {/* 텍스트 정보 */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 10 }}>
            {schedule.title}
          </h1>
          <p style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
            {Number(schedule.price).toLocaleString()}원
          </p>
          <div style={{ paddingTop: 12 }}>
            {[
              {
                label: "교육기간",
                value: (() => {
                  const start = new Date(schedule.start_date);
                  const end = new Date(schedule.end_date);
                  const sameDay = start.toDateString() === end.toDateString();
                  return sameDay
                    ? start.toLocaleDateString()
                    : `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;
                })(),
              },
              { label: "장소", value: schedule.location || "-" },
              { label: "강사", value: schedule.instructor || "-" },
              { label: "정원", value: `${schedule.total_spots ?? "-"}명` },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "0.5px solid rgba(0,0,0,0.05)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#444",
                }}
              >
                <span style={{ color: "#666" }}>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: "1px solid #eee",
              fontSize: 15,
              whiteSpace: "pre-line",
              lineHeight: 1.8,
              color: "#444",
            }}
          >
            <span style={{ textAlign: "right", maxWidth: "70%" }}>
              {schedule.description || "-"}
            </span>
          </div>
          {/* 수량 */}
          <div style={{ marginTop: 30 }}>
            <div
              style={{
                marginBottom: 28,
                padding: 10,
                backgroundColor: "#f7f9fc",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 500, color: "#333" }}>수량</span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: 32,
                    height: 36,
                    border: "none",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  –
                </button>
                <div
                  style={{
                    width: 50,
                    textAlign: "center",
                    fontSize: 15,
                    lineHeight: "36px",
                    background: "#fff",
                  }}
                >
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  style={{
                    width: 32,
                    height: 36,
                    border: "none",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                fontSize: 16,
              }}
            >
              <span style={{ color: "#333" }}>총 {quantity}명</span>
              <span style={{ fontWeight: "bold" }}>
                {Number(unitPrice * quantity).toLocaleString()}원
              </span>
            </div>
          </div>
          {/* 구매/장바구니 버튼 */}
          {isMobile ? (
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                width: "100%",
                display: "flex",
                gap: 8,
                padding: "12px 16px",
                backgroundColor: "#fff",
                borderTop: "1px solid #eee",
                zIndex: 999,
              }}
            >
              <button onClick={handleAddToCart} style={actionBtnStyle(false)}>
                <ShoppingCart
                  size={18}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                장바구니
              </button>
              <button onClick={handleBuyNow} style={actionBtnStyle(true)}>
                바로 구매
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button onClick={handleAddToCart} style={actionBtnStyle(false)}>
                장바구니
              </button>
              <button onClick={handleBuyNow} style={actionBtnStyle(true)}>
                바로 구매
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 상세 설명, 탭 */}
      <ProductTabs
        tabs={[
          { id: "detail", label: "상품상세" },
          { id: "review", label: "상품후기" },
          { id: "inquiry", label: "상품문의" },
          { id: "refund", label: "환불안내" },
        ]}
      />
      <div id="detail" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductDetail html={schedule.detail} />
      </div>
      <div id="review" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductReviews
          productId={schedule.product_id || schedule.productId}
          scheduleId={schedule.id}
        />
      </div>
      <div id="inquiry" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductInquiry
          productId={schedule.product_id || schedule.productId}
        />
      </div>
      <div id="refund" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabRefundPolicy />
      </div>
    </div>
  );
}
