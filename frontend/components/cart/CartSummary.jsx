// components/cart/CartSummary.jsx
import { useState, useMemo, useEffect } from "react";
import { formatPrice } from "@/lib/format";
import CouponSelector from "./CouponSelector";
import PointInputModal from "./PointInputModal";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
export default function CartSummary({
  items = [],
  couponDiscount = 0,
  pointUsed = 0,
  onCheckout,
  onCouponChange,
  onPointChange,
  maxPoint = 0,
  couponList = [],
  isLoading = false,
  // ✅ 추가
  variant = "cart", // "cart" | "checkout"
}) {
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [showPointPopup, setShowPointPopup] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const isCart = variant === "cart";
  const isCheckout = variant === "checkout";
  const selectedCardCount = items.length; // ✅ 카드(항목) 개수 기준

  const {
    totalQuantity,
    totalPrice,
    totalDiscount,
    safeCoupon,
    maxUsablePoint, // ✅ 추가
    effectivePoint,
    totalFinal,
  } = useMemo(() => {
    const q = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const price = items.reduce(
      (s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 0),
      0
    );
    const discount = items.reduce((s, it) => {
      const u = Number(it.unit_price || 0);
      const d = Number(it.discount_price || 0);
      const qty = Number(it.quantity || 0);
      const has = d > 0 && d < u;
      return s + (has ? (u - d) * qty : 0);
    }, 0);
    const couponEff =
      q === 0 || typeof couponDiscount !== "number" ? 0 : couponDiscount;
    const couponSafe = isNaN(couponEff) ? 0 : couponEff;

    // ✅ 포인트 캡: 결제 전 최대 사용 가능 포인트
    const gross = Math.max(0, price - discount - couponSafe);
    const capByCash = gross; // 금액 한도
    const cap = Math.max(0, Math.min(Number(maxPoint || 0), capByCash));

    const pointRaw = q === 0 ? 0 : Number(pointUsed || 0);
    const pointEff = Math.max(0, Math.min(pointRaw, cap)); // ✅ 캡 적용

    const final = Math.max(0, price - discount - couponSafe - pointEff);

    return {
      totalQuantity: q,
      totalPrice: price,
      totalDiscount: discount,
      safeCoupon: couponSafe,
      maxUsablePoint: cap, // ✅ 반환
      effectivePoint: pointEff, // ✅ 캡 적용된 값
      totalFinal: final,
    };
  }, [items, couponDiscount, pointUsed, maxPoint]);
  useEffect(() => {
    if (totalQuantity === 0) {
      if (effectivePoint !== 0) onPointChange(0);
      return;
    }
    // pointUsed(부모 상태)와 캡 비교
    const raw = Number(pointUsed || 0);
    if (raw < 0) onPointChange(0);
    else if (raw > maxUsablePoint) onPointChange(maxUsablePoint);
  }, [totalQuantity, effectivePoint, maxUsablePoint, pointUsed, onPointChange]);
  // ✅ 버튼 비활성 조건: 0원이어도 결제(무료결제) 가능해야 하므로 막지 않음
  const btnDisabled = totalQuantity === 0 || isLoading;

  return (
    <div style={wrapStyle}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <span>{isCheckout ? "결제 요약" : "주문정보"}</span>
        <span style={badgeStyle}>선택 {selectedCardCount}개</span>
      </div>

      {/* ✅ 카트에서만: 선택 미니 프리뷰 (썸네일 최대 3개 + 외 N개) */}
      {/* ✅ 카트에서만: 선택 미니 프리뷰 → “상품명 · 금액” 목록(최대 3개) + 외 N개 */}
      {isCart && items.length > 0 && (
        <div style={previewRow}>
          <div style={{ width: "100%" }}>
            {items.slice(0, 3).map((it) => {
              const u = Number(it.unit_price || 0);
              const d = Number(it.discount_price || 0);
              const qty = Number(it.quantity || 0);
              const has = d > 0 && d < u;
              const lineTotal = (has ? d : u) * qty; // 할인 반영 합계

              return (
                <div key={it.id} style={listRow}>
                  <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
  <span style={listTitle} title={it.schedule_title || it.title}>
    {it.schedule_title || it.title || "선택 항목"}
  </span>
  {/* 기간/시간 (있을 때만) */}
  {(it.start_date || it.end_date) && (
    <span style={{ fontSize:12, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
      {new Date(it.start_date).toLocaleDateString()}
      {it.end_date && ` ~ ${new Date(it.end_date).toLocaleDateString()}`}
      {(it.start_time || it.end_time) && `  ${String(it.start_time||"").slice(0,5)}~${String(it.end_time||"").slice(0,5)}`}
    </span>
  )}
</div>
<span style={listPrice}>{formatPrice(lineTotal)}원</span>

                </div>
              );
            })}

            {items.length > 3 && (
              <div style={{ marginTop: 4 }}>
                <span style={moreText}>외 {items.length - 3}개</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 금액 요약 */}
      {/* 금액 요약: cart에서는 숨김, checkout에서는 노출 */}
      {!isCart && (
        <div style={rowStyle}>
          <span style={labelStyle}>상품금액</span>
          <span>{formatPrice(totalPrice)}원</span>
        </div>
      )}

      {totalDiscount > 0 && (
        <div style={{ ...rowStyle, color: "#ef4444" }}>
          <span style={labelStyle}>상품 할인</span>
          <span>- {formatPrice(totalDiscount)}원</span>
        </div>
      )}

      {/* ✅ 쿠폰: 항상 표시 (목록 없으면 비활성) */}
      {/* ✅ 쿠폰: 없으면 '없음', 있으면 버튼만. 적용 후에는 금액 표기 + 버튼 */}
      {(() => {
        const hasCoupons = Array.isArray(couponList) && couponList.length > 0;
        const isUnavailable = totalQuantity === 0 || !hasCoupons; // 없을 때
        const isApplied = totalQuantity > 0 && safeCoupon > 0; // 적용됨

        return (
          <div style={{ ...rowStyle, color: "#ef4444" }}>
            <span style={labelStyle}>쿠폰</span>

            {/* 없을 때: '없음'만 */}
            {isUnavailable && <span>없음</span>}

            {/* 있을 때 & 미적용: 버튼만 */}
            {!isUnavailable && !isApplied && (
              <button
                onClick={() => setShowCouponPopup(true)}
                style={miniBtnStyle(false)}
                title="쿠폰 선택"
              >
                사용
              </button>
            )}

            {/* 적용 후: 금액 + 버튼(변경/재선택) */}
            {isApplied && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>- {formatPrice(safeCoupon)}원</span>
                <button
                  onClick={() => setShowCouponPopup(true)}
                  style={miniBtnStyle(false)}
                  title="쿠폰 변경"
                >
                  변경
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ✅ 포인트: 없으면 '없음', 있으면 버튼만. 적용 후에는 금액 표기 + 버튼 */}
      {(() => {
        const owned = Number(maxPoint || 0);
        const isUnavailable = totalQuantity === 0 || owned <= 0; // 없을 때
        const isApplied = totalQuantity > 0 && effectivePoint > 0; // 적용됨

        return (
          <div style={{ ...rowStyle, color: "#ef4444" }}>
            <span style={labelStyle}>포인트</span>

            {/* 없을 때: '없음'만 */}
            {isUnavailable && <span>없음</span>}

            {/* 있을 때 & 미적용: 버튼만 */}
            {!isUnavailable && !isApplied && (
              <button
                onClick={() => setShowPointPopup(true)}
                style={miniBtnStyle(false)}
                title="포인트 사용"
              >
                사용
              </button>
            )}

            {/* 적용 후: 금액 + 버튼(변경/재입력) */}
            {isApplied && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>- {formatPrice(effectivePoint)}원</span>
                <button
                  onClick={() => setShowPointPopup(true)}
                  style={miniBtnStyle(false)}
                  title="포인트 변경"
                >
                  변경
                </button>
              </div>
            )}
          </div>
        );
      })()}

      <div style={totalRowStyle}>
        <span>결제 금액</span>
        {/* ✅ 접근성: 금액 변경 읽어주기 */}
        <span aria-live="polite">{formatPrice(totalFinal)}원</span>
      </div>
      {isCheckout && (
        <div style={consentWrapStyle}>
          <div style={consentTitleStyle}>
            주문 내용을 확인했으며, 아래 내용에 모두 동의합니다.
          </div>

          <ul style={consentListStyle}>
            <li>
              개인정보처리방침침{" "}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                style={consentLinkStyle}
                aria-haspopup="dialog"
                aria-controls="privacy-modal"
              >
                보기
              </button>
            </li>

            <li>
              서비스이용약관{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                style={consentLinkStyle}
                aria-haspopup="dialog"
                aria-controls="thirdparty-modal"
              >
                보기
              </button>
            </li>

            <li>
              결제대행 서비스 이용약관{" "}
              <a
                href="https://pages.tosspayments.com/terms/user"
                target="_blank"
                rel="noopener"
                style={consentLinkStyle}
              >
                (주)토스페이먼츠
              </a>
            </li>
          </ul>
        </div>
      )}

      <button
        onClick={onCheckout}
        disabled={btnDisabled}
        style={orderBtnStyle(btnDisabled)}
        title={
          totalQuantity === 0
            ? "선택된 항목이 없습니다"
            : isLoading
              ? "처리 중입니다"
              : isCheckout
                ? "결제하기"
                : "주문하기"
        }
        onMouseDown={(e) => {
          if (btnDisabled) return;
          e.currentTarget.style.transform = "translateY(1px)";
        }}
        onMouseUp={(e) => {
          if (btnDisabled) return;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {isLoading ? "처리 중..." : isCheckout ? "결제하기" : "주문하기"}
      </button>

      {showCouponPopup && (
        <CouponSelector
          couponList={couponList}
          onSelect={(coupon) => onCouponChange(coupon)}
          onClose={() => setShowCouponPopup(false)}
        />
      )}

      {showPointPopup && (
        <PointInputModal
          // ✅ 모달에도 실제 사용 가능 한도 전달
          maxPoint={Number(maxUsablePoint || 0)}
          defaultValue={effectivePoint}
          onApply={(val) => {
            const v = Number(val || 0);
            const capped = Math.max(
              0,
              Math.min(v, Number(maxUsablePoint || 0))
            );
            onPointChange(capped); // ✅ 입력 즉시 캡 적용
          }}
          onClose={() => setShowPointPopup(false)}
        />
      )}
      {/* 정책/약관 모달 */}
      {showPrivacyModal && (
        <PrivacyModal
          id="privacy-modal"
          visible={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
      {showTermsModal && (
        <TermsModal
          id="thirdparty-modal"
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
      )}
    </div>
  );
}

/* ───────── styles ───────── */
const wrapStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  height: "fit-content",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 10,
};

const badgeStyle = {
  fontSize: 12,
  background: "#eef2ff",
  color: "#4f46e5",
  padding: "4px 8px",
  borderRadius: 999,
};

/* ✅ 선택 미니 프리뷰 */
const previewRow = {
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const moreText = {
  fontSize: 12,
  color: "#475569",
};

/* ✅ 카트 목록형 미리보기용 */
const listRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  padding: "4px 0",
};
const listTitle = {
  fontSize: 13,
  color: "#111827",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "70%",
};
const listPrice = {
  fontSize: 13,
  fontWeight: 400,
  color: "#0f172a",
};

const rowStyle = {
  fontSize: 14,
  marginBottom: 6,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const totalRowStyle = {
  fontSize: 16,
  fontWeight: 800,
  marginTop: 8,
  borderTop: "1px dashed #cbd5e1",
  paddingTop: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelStyle = {
  minWidth: 90,
  color: "#475569",
};

const miniBtnStyle = (disabled) => ({
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid #cdd3df",
  background: disabled ? "#f1f5f9" : "#fff",
  color: disabled ? "#94a3b8" : "#111827",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all .12s ease",
});

const orderBtnStyle = (disabled) => ({
  marginTop: 14,
  width: "100%",
  padding: "12px 0",
  fontWeight: 800,
  background: disabled ? "#cbd5e1" : "linear-gradient(90deg,#3b82f6,#2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 15,
  opacity: disabled ? 0.8 : 1,
  transition: "transform .08s ease, box-shadow .12s ease, opacity .12s ease",
  boxShadow: disabled ? "none" : "0 10px 18px rgba(59,130,246,.25)",
});
const consentWrapStyle = {
  marginTop: 10,
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#f9fafb",
};

const consentTitleStyle = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 8,
  fontWeight: 600,
};

const consentListStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  rowGap: 6,
  fontSize: 13,
  color: "#4b5563",
};

const consentLinkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  marginLeft: 6,
  color: "#4b5563", // 어두운 회색
  cursor: "pointer",
  textDecoration: "underline",
  fontWeight: 500,
  fontSize: "inherit",
};
