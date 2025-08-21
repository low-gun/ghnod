import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/router";

// 반응형 감지
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 520);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/**
 * variant:
 *  - "cart": 편집 모드(체크박스/삭제/수량 ± 노출)
 *  - "checkout": 읽기 전용(동일 마크업, 컨트롤만 숨김)
 */
export default function CartItemCard({
  variant = "cart",
  item,
  selected = false,
  onCheck,
  onDelete,
  onQuantityChange,
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isCheckout = variant === "checkout";

  const {
    id,
    schedule_id,
    schedule_session_id,   // ✅ 회차 FK (선택)
    schedule_title,
    title,
    start_date,
    end_date,
    start_time,            // ✅ "HH:mm:ss" 또는 "HH:mm"
    end_time,              // ✅ "
    type,                  // ✅ 공개 상세 경로용 (예: 'facilitation')
    image_url,
    unit_price = 0,
    discount_price,
    quantity = 1,
    subtotal,
  } = item ?? {};
  

  const start = start_date ? new Date(start_date) : null;
  const end = end_date ? new Date(end_date) : null;
  const sameDay =
    start &&
    end &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  // 개당 가격(할인 반영)
  const hasDiscount =
    discount_price && discount_price > 0 && discount_price < unit_price;
  const perUnit = Number(hasDiscount ? discount_price : unit_price);

  // 라인 합계(서버 subtotal 우선)
  const lineTotal =
    typeof subtotal === "number" ? subtotal : perUnit * Number(quantity || 1);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: isMobile ? 12 : 16,
        background: "#fff",
        display: "flex",
        gap: isMobile ? 10 : 16,
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        minWidth: 0,
      }}
    >
      {/* 체크박스 (checkout에선 숨김) */}
      {!isCheckout && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={(e) => onCheck?.(id, e.target.checked)}
          style={{
            position: "absolute",
            top: isMobile ? 10 : 12,
            left: isMobile ? 10 : 12,
            zIndex: 2,
          }}
        />
      )}

      {/* 삭제 버튼 (checkout에선 숨김) */}
      {!isCheckout && (
        <button
          onClick={() => onDelete?.(id)}
          style={{
            position: "absolute",
            top: isMobile ? 6 : 8,
            right: isMobile ? 6 : 8,
            background: "transparent",
            border: "none",
            fontSize: isMobile ? 18 : 20,
            color: "#9ca3af",
            cursor: "pointer",
            zIndex: 2,
            padding: 0,
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            lineHeight: isMobile ? "28px" : "32px",
            textAlign: "center",
          }}
          title="삭제"
          aria-label="삭제"
        >
          ×
        </button>
      )}

      {/* 썸네일 */}
      <div
  onClick={() => {
    if (!schedule_id) return;
    if (type) router.push(`/education/${type}/${schedule_id}`);       // ✅ 타입 경로
    else router.push(`/education/calendar/${schedule_id}`);           // ✅ 폴백
  }}
  style={{
          width: isMobile ? 64 : 80,
          height: isMobile ? 64 : 80,
          flexShrink: 0,
          borderRadius: 6,
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: schedule_id ? "pointer" : "default",
        }}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={schedule_title || title || "상품 이미지"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#9ca3af", fontSize: isMobile ? 11 : 12 }}>
            이미지 없음
          </span>
        )}
      </div>

      {/* 텍스트/컨트롤 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 제목 (2줄 말줄임) */}
        <div
          style={{
            fontSize: isMobile ? 14 : 15.5,
            fontWeight: 600,
            marginBottom: 6,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
            paddingRight: isCheckout ? 0 : isMobile ? 32 : 36, // X 버튼 영역
          }}
          title={schedule_title || title}
        >
          {schedule_title || title}
        </div>

        {/* 날짜 */}
        <div style={{ fontSize: isMobile ? 12 : 13, color: "#6b7280", marginBottom: 8 }}>
  {start ? start.toLocaleDateString() : ""}
  {start && end && !sameDay ? ` ~ ${end.toLocaleDateString()}` : ""}
  {!start && !end ? "일정 미정" : ""}
  {/* 회차 시간이 내려오면 간단히 병기 */}
  {(start_time || end_time) && (start || end) && (
    <span>{`  ${String(start_time || "").slice(0,5)}~${String(end_time || "").slice(0,5)}`}</span>
  )}
</div>


        {/* 가격/수량 행 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* 🔹 개당 금액(수량 왼쪽 / fontWeight 400) */}
          <div style={{ minWidth: 90 }}>
            {hasDiscount ? (
              <>
                <div
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    color: "#9ca3af",
                    textDecoration: "line-through",
                    lineHeight: 1.1,
                  }}
                >
                  {formatPrice(unit_price)}원
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    color: "#111827",
                    fontWeight: 400, // 요구사항
                  }}
                >
                  {formatPrice(perUnit)}원
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: isMobile ? 13 : 14,
                  color: "#111827",
                  fontWeight: 400, // 요구사항
                }}
              >
                {formatPrice(perUnit)}원
              </div>
            )}
          </div>

          {/* 수량 컨트롤/텍스트 */}
          {!isCheckout ? (
            <div
              style={{
                display: "inline-flex",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                overflow: "hidden",
                alignItems: "center",
                height: isMobile ? 30 : 32,
                background: "#fff",
              }}
            >
              <button
                onClick={() => onQuantityChange?.(item, -1)}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: isMobile ? 28 : 32,
                  height: "100%",
                  cursor: "pointer",
                  fontSize: isMobile ? 16 : 18,
                }}
                aria-label="수량 감소"
              >
                –
              </button>
              <div
                style={{
                  width: isMobile ? 34 : 40,
                  textAlign: "center",
                  fontSize: isMobile ? 13 : 14,
                  lineHeight: isMobile ? "30px" : "32px",
                }}
              >
                {quantity}
              </div>
              <button
                onClick={() => onQuantityChange?.(item, 1)}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: isMobile ? 28 : 32,
                  height: "100%",
                  cursor: "pointer",
                  fontSize: isMobile ? 16 : 18,
                }}
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
          ) : (
            <div style={{ fontSize: isMobile ? 12 : 14, color: "#374151" }}>
              수량: <b>{quantity}</b>
            </div>
          )}

          {/* 🔹 오른쪽: 합계 라벨 없이 금액만 */}
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                fontSize: isMobile ? 14 : 16,
                color: "#111827",
                fontWeight: 700,
              }}
              aria-label="라인 합계 금액"
            >
              {formatPrice(lineTotal)}원
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
