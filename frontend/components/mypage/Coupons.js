import React from "react";
import { formatPrice } from "@/lib/format";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ko-KR");
}

export default function Coupons({ data }) {
  const isMobile = useIsMobile();

  // 쿠폰 코드 복사
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert("쿠폰코드가 복사되었습니다.");
  };

  if (!data) return null;

  // 사용가능/임박/만료 구분
  const now = new Date();
  const getCouponState = (coupon) => {
    if (coupon.is_used) return "used";
    if (coupon.expiry_date && new Date(coupon.expiry_date) < now) return "expired";
    if (
      coupon.expiry_date &&
      new Date(coupon.expiry_date) - now < 1000 * 60 * 60 * 24 * 3 // 3일 이내
    )
      return "expiring";
    return "available";
  };

  const filtered = data.filter(
    (c) => !c.is_used && (!c.expiry_date || new Date(c.expiry_date) > now)
  );

  return (
    <div style={{ padding: isMobile ? 0 : 20 }}>
      {!isMobile && <h2 style={titleStyle}>쿠폰</h2>}

      {filtered.length === 0 ? (
        <div style={{ color: "#888", padding: "40px 0", textAlign: "center" }}>
          사용 가능한 쿠폰이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "18px",
            width: "100%",
          }}
        >
          {filtered.map((coupon, i) => {
            const state = getCouponState(coupon);
            const expiry = coupon.expiry_date ? formatDate(coupon.expiry_date) : null;
            let badgeColor =
              state === "expiring"
                ? "#faad14"
                : state === "expired"
                ? "#bbb"
                : "#297cff";

            return (
              <div
                key={coupon.coupon_id || `coupon-${i}`}
                style={{
                  ...cardStyle,
                  border: `1.5px solid ${badgeColor}`,
                  position: "relative",
                  background:
                    state === "expired"
                      ? "#fafafb"
                      : state === "used"
                      ? "#fafbfa"
                      : "#fff",
                  opacity: state === "expired" || state === "used" ? 0.55 : 1,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#284785",
                      marginRight: 7,
                    }}
                  >
                    {coupon.name}
                  </span>
                  {/* 상태 뱃지 */}
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 9px",
                      borderRadius: 11,
                      color: "#fff",
                      background: badgeColor,
                      fontWeight: 500,
                      marginLeft: 2,
                    }}
                  >
                    {state === "expiring"
                      ? "만료임박"
                      : state === "expired"
                      ? "만료됨"
                      : coupon.is_used
                      ? "사용됨"
                      : "사용가능"}
                  </span>
                </div>
                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                  {coupon.discount_type === "percent"
                    ? (
                        <>
                          <span style={{ color: "#1a8f37", fontWeight: 800 }}>
                            {coupon.discount_value}%
                          </span>
                          &nbsp;할인쿠폰
                        </>
                      )
                    : coupon.discount_amount
                    ? (
                        <>
                          <span style={{ color: "#1a8f37", fontWeight: 800 }}>
                            {formatPrice(coupon.discount_amount)}
                          </span>
                          원 할인쿠폰
                        </>
                      )
                    : "할인정보 없음"}
                </div>

                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
                  {expiry ? (
                    <>
                      유효기한: <b style={{ color: state === "expiring" ? "#d97706" : undefined }}>{expiry}</b>
                    </>
                  ) : (
                    <>유효기한: 제한없음</>
                  )}
                </div>


              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const titleStyle = {
  fontSize: "1.2rem",
  marginBottom: "16px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "18px 20px 15px 18px",
  boxShadow: "0 2px 9px 0 rgba(30,60,110,0.07)",
  backgroundColor: "#fff",
  minHeight: 110,
};

const copyBtnStyle = {
  marginLeft: 10,
  fontSize: 12,
  border: "none",
  background: "#e8f2ff",
  color: "#297cff",
  borderRadius: 5,
  padding: "3px 10px",
  cursor: "pointer",
};
