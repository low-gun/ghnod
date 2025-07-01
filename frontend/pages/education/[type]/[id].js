import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api"; // 상단에 이미 import 돼 있어야 함
import { useCartContext } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext"; // ✅ 추가
import ProductTabs from "@/components/product/ProductTabs";
import TabProductDetail from "@/components/product/TabProductDetail";
import TabProductReviews from "@/components/product/TabProductReviews";
import TabProductInquiry from "@/components/product/TabProductInquiry";
import TabRefundPolicy from "@/components/product/TabRefundPolicy";
import ScrollTopButton from "@/components/common/ScrollTopButton";

export default function EducationScheduleDetailPage() {
  const router = useRouter();
  const { cartItems, setCartItems } = useCartContext(); // ✅ 이 줄 추가
  const { user } = useUserContext();
  const { type, id } = router.query;
  const [schedule, setSchedule] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const handleBuyNow = async () => {
    if (!user) {
      alert("로그인 후 결제하실 수 있습니다.");
      return router.push("/login");
    }

    if (!schedule) {
      return alert("일정 정보를 불러오지 못했습니다.");
    }

    try {
      router.push({
        pathname: "/checkout",
        query: {
          buyNow: encodeURIComponent(
            JSON.stringify({
              schedule_id: schedule.id,
              quantity,
              unit_price: Number(schedule.price),
              discount_price: 0,
            })
          ),
        },
      });
    } catch (err) {
      console.error("❌ 바로구매 처리 중 오류:", err);
      alert("바로구매 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!id) return;

    api
      .get(`/education/schedules/${id}`)
      .then((res) => {
        console.log("🔥 받은 일정:", res.data.schedule);
        if (res.data.success) setSchedule(res.data.schedule);
      })
      .catch(() => alert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: 40 }}>불러오는 중...</p>;
  if (!schedule)
    return <p style={{ padding: 40 }}>일정 정보를 찾을 수 없습니다.</p>;
  const unitPrice = Number(schedule.price ?? schedule.product_price ?? 0);
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
      {/* ✅ 브레드크럼브 */}
      <div style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>
        <span
          onClick={() => router.push("/education")}
          style={{
            cursor: "pointer",
            marginRight: 6,
          }}
        >
          교육
        </span>
        &gt;
        <span
          onClick={() => router.push(`/education/${type}`)}
          style={{
            cursor: "pointer",
            marginLeft: 6,
          }}
        >
          {type}
        </span>
      </div>

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {/* 좌측: 썸네일 (비율로) */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 3", // ✅ 썸네일 비율 유지
              border: "1px solid #ccc",
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {schedule.image_url ? (
              <img
                src={schedule.image_url}
                alt={schedule.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : schedule.product_image ? (
              <img
                src={schedule.product_image}
                alt={schedule.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span style={{ color: "#888" }}>이미지가 없습니다</span>
            )}
          </div>
        </div>

        {/* 텍스트 정보 */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>{schedule.title}</h1>

          {/* 가격 */}
          <p style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
            {Number(schedule.price).toLocaleString()}원
          </p>

          {/* 정보 구역 */}
          <div style={{ paddingTop: 12 }}>
            {[
              {
                label: "교육기간",
                value: (() => {
                  const start = new Date(schedule.start_date);
                  const end = new Date(schedule.end_date);
                  const sameDay =
                    start.getFullYear() === end.getFullYear() &&
                    start.getMonth() === end.getMonth() &&
                    start.getDate() === end.getDate();
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
                  padding: "16px 0",
                  borderBottom: "1px solid #eee",
                  fontSize: 15,
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
              padding: "16px 0",
              borderBottom: "1px solid #eee",
              fontSize: 15,
              whiteSpace: "pre-line",
            }}
          >
            <span style={{ textAlign: "right", maxWidth: "70%" }}>
              {schedule.description || "-"}
            </span>
          </div>

          {/* 수량 선택 + 총 수량/금액 */}
          <div style={{ marginTop: 30 }}>
            <div
              style={{
                marginBottom: 28,
                padding: "10px",
                backgroundColor: "#f7f9fc", // ✅ 살짝 배경색 추가
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
                fontSize: 16, // ✅ 살짝 키움
              }}
            >
              <span style={{ color: "#333" }}>총 {quantity}명</span>
              <span style={{ fontWeight: "bold" }}>
                {Number(unitPrice * quantity).toLocaleString()}원
              </span>
            </div>
          </div>

          {/* ✅ 요 아래에 이거 붙여줘 */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={async () => {
                try {
                  const payload = {
                    schedule_id: schedule.id,
                    quantity,
                    unit_price: unitPrice,
                    type: "buyNow",
                  };

                  console.log("📦 담기 요청 값:", payload);

                  const guestToken = localStorage.getItem("guest_token");
                  const res = await api.post("/cart/items", payload, {
                    headers: {
                      "x-guest-token": guestToken || "",
                    },
                  });

                  if (res.data.success) {
                    alert("🛒 장바구니에 담았습니다!");

                    const newItem = {
                      id: Date.now(), // 임시 id (서버에서 안 주는 경우)
                      schedule_id: schedule.id,
                      schedule_title: schedule.title,
                      image_url:
                        schedule.image_url || schedule.product_image || null,
                      quantity: 1,
                      unit_price: Number(schedule.price),
                      discount_price: null,
                      subtotal: Number(schedule.price),
                    };

                    setCartItems((prev) => [...prev, newItem]);
                  } else {
                    alert("❌ 장바구니 담기에 실패했습니다.");
                  }
                } catch (err) {
                  console.error("장바구니 담기 오류:", err);
                  alert("오류가 발생했습니다. 다시 시도해주세요.");
                }
              }}
              style={{
                flex: 1,
                minWidth: "40%",
                padding: "10px 16px",
                border: "1px solid #0070f3",
                backgroundColor: "#fff",
                color: "#0070f3",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              장바구니
            </button>
            <button
              onClick={handleBuyNow}
              style={{
                flex: 1,
                minWidth: "40%",
                padding: "10px 16px",
                backgroundColor: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>

      {/* 상세 설명 */}
      <ProductTabs
        tabs={[
          { id: "detail", label: "상품상세" },
          { id: "review", label: "상품후기" },
          { id: "inquiry", label: "상품문의" },
          { id: "refund", label: "환불안내" },
        ]}
      />

      {/* 탭 콘텐츠 실제 위치에 렌더링 */}
      <div id="detail">
        <TabProductDetail html={schedule.detail} />
      </div>
      <div id="review">
        <TabProductReviews />
      </div>
      <div id="inquiry">
        <TabProductInquiry />
      </div>
      <div id="refund">
        <TabRefundPolicy />
      </div>
      <ScrollTopButton />
    </div>
  );
}
