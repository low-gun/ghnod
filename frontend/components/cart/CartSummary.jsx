// components/cart/CartSummary.jsx
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import CouponSelector from "./CouponSelector";
import PointInputModal from "./PointInputModal";
export default function CartSummary({
  items = [],
  couponDiscount = 0, // ✅ 실제 할인 금액이 넘어오도록 유지 (이제 제대로 전달됨)
  pointUsed = 0,
  onCheckout,
  onCouponChange,
  onPointChange,
  maxPoint = 0,
  couponList = [],
  isLoading = false, // ✅ 이 줄 추가
}) {
  console.log("📦 CartSummary → items 확인:", items); // ✅ 여기에 추가
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [showPointPopup, setShowPointPopup] = useState(false);

  const totalQuantity = items.reduce((sum, item) => {
    console.log("🔢 item.quantity:", item.quantity); // ✅ 여기서 각 item의 수량도 확인
    return sum + item.quantity;
  }, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalDiscount = items.reduce((sum, item) => {
    const hasDiscount =
      item.discount_price !== null &&
      item.discount_price !== undefined &&
      item.discount_price > 0 &&
      item.discount_price < item.unit_price;

    const discountAmount = hasDiscount
      ? (item.unit_price - item.discount_price) * item.quantity
      : 0;

    return sum + discountAmount;
  }, 0);

  const effectiveCoupon =
    totalQuantity === 0 || typeof couponDiscount !== "number"
      ? 0
      : couponDiscount;
  const effectivePoint = totalQuantity === 0 ? 0 : pointUsed;
  const safeCoupon = isNaN(effectiveCoupon) ? 0 : effectiveCoupon;

  console.log("💸 전달받은 couponDiscount:", couponDiscount);
  console.log("💸 safeCoupon 계산 결과:", safeCoupon);

  const totalFinal = Math.max(
    0,
    totalPrice - totalDiscount - effectiveCoupon - effectivePoint
  );

  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        height: "fit-content",
      }}
    >
      <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: 12 }}>
        주문정보
      </h3>

      {/* 수량 */}
      <div style={rowStyle}>
        <span style={labelStyle}>수량:</span>
        <span>{totalQuantity}개</span>
      </div>

      {/* 금액 */}
      <div style={rowStyle}>
        <span style={labelStyle}>금액:</span>
        <span>{formatPrice(totalPrice)}원</span>
      </div>
      {/* 쿠폰 할인 - couponList가 있을 때만 표시 */}
      {couponList && couponList.length > 0 && (
        <div style={{ ...rowStyle, color: "#d9534f" }}>
          <span style={labelStyle}>쿠폰:</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              {totalQuantity > 0 && safeCoupon > 0
                ? `− ${formatPrice(safeCoupon)}원`
                : "선택된 항목 없음"}
            </span>
            <button
              onClick={() => setShowCouponPopup(true)}
              style={useBtnStyle}
              disabled={totalQuantity === 0}
            >
              사용
            </button>
          </div>
        </div>
      )}

      {/* 포인트 사용 - maxPoint가 0보다 클 때만 표시 */}
      {!isNaN(maxPoint) && Number(maxPoint) > 0 && (
        <div style={{ ...rowStyle, color: "#d9534f" }}>
          <span style={labelStyle}>포인트:</span>
          <span>
            {totalQuantity > 0 && effectivePoint > 0
              ? `− ${formatPrice(effectivePoint)}원`
              : "선택된 항목 없음"}
            <button
              onClick={() => setShowPointPopup(true)}
              style={useBtnStyle}
              disabled={totalQuantity === 0}
            >
              사용
            </button>
          </span>
        </div>
      )}

      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          marginTop: 8,
          borderTop: "1px dashed #ccc",
          paddingTop: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>결제 금액</span>
        <span>{formatPrice(totalFinal)}원</span>
      </div>

      <button
        onClick={onCheckout}
        disabled={totalQuantity === 0 || isLoading}
        style={{
          marginTop: "16px",
          width: "100%",
          padding: "10px 0",
          fontWeight: "bold",
          backgroundColor:
            totalQuantity === 0 || isLoading ? "#ccc" : "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: totalQuantity === 0 || isLoading ? "not-allowed" : "pointer",
          fontSize: "15px",
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? "처리 중..." : "주문하기"}
      </button>

      {showCouponPopup && (
        <CouponSelector
          couponList={couponList}
          onSelect={(selectedCoupon) => {
            onCouponChange(selectedCoupon); // ✅ 전체 쿠폰 객체 통째로 넘김 (id + amount 포함)
          }}
          onClose={() => setShowCouponPopup(false)}
        />
      )}

      {showPointPopup && (
        <PointInputModal
          maxPoint={maxPoint} // ✅ props로 받은 값 전달
          defaultValue={pointUsed} // ✅ 이전 값 유지
          onApply={(val) => onPointChange(val)}
          onClose={() => setShowPointPopup(false)}
        />
      )}
    </div>
  );
}

const rowStyle = {
  fontSize: "14px",
  marginBottom: 4,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelStyle = {
  minWidth: "90px",
  fontWeight: "normal",
};

const useBtnStyle = {
  fontSize: "12px",
  marginLeft: 8,
  padding: "2px 6px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
};
