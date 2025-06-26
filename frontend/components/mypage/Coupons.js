import React from "react";
import { formatPrice } from "@/lib/format";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // 상단 import 추가

// ─────────────────────────────────────────────────────────────────────────────
// 날짜 포맷 함수
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ko-KR");
}

// ─────────────────────────────────────────────────────────────────────────────
// Coupons 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function Coupons({ data }) {
  const isMobile = useIsMobile(); // ✅ 여기로 이동 (함수 내부)
  const containerStyle = {
    padding: isMobile ? 0 : 20,
  };
  if (!data) return <></>;

  return (
    <div style={containerStyle}>
      {!isMobile && <h2 style={titleStyle}>쿠폰</h2>}

      {data.length === 0 ? (
        <p>사용 가능한 쿠폰이 없습니다.</p>
      ) : (
        <div style={cardContainerStyle}>
          {data
            .filter((coupon) => {
              const notUsed = coupon.is_used === 0;
              const notExpired =
                !coupon.expiry_date ||
                new Date(coupon.expiry_date) > new Date();
              return notUsed && notExpired;
            })
            .map((coupon, i) => {
              const expiry = formatDate(coupon.expiry_date);
              return (
                <div key={coupon.coupon_id || `coupon-${i}`} style={cardStyle}>
                  <h3 style={cardTitleStyle}>{coupon.name}</h3>

                  <p style={infoTextStyle}>
                    {coupon.discount_type === "percent"
                      ? `할인율: ${coupon.discount_value}%`
                      : coupon.discount_amount != null
                        ? `할인가격: ${formatPrice(coupon.discount_amount)}원`
                        : "할인정보 없음"}
                  </p>

                  <p style={infoTextStyle}>
                    {coupon.expiry_date
                      ? `유효기한: ${expiry}`
                      : "유효기한: 제한없음"}
                  </p>

                  <p style={infoTextStyle}>
                    상태: {coupon.is_used ? "사용됨" : "사용가능"}
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 스타일 (상단으로 이동)
// ─────────────────────────────────────────────────────────────────────────────

const titleStyle = {
  fontSize: "1.2rem",
  marginBottom: "16px",
};

const cardContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "16px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
};

const cardTitleStyle = {
  marginBottom: "8px",
  fontSize: "1rem",
  fontWeight: "bold",
};

const codeStyle = {
  color: "#666",
  fontSize: "0.9rem",
  marginLeft: "4px",
};

const infoTextStyle = {
  margin: "4px 0",
  fontSize: "0.9rem",
};
