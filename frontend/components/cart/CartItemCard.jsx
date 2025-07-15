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

export default function CartItemCard({
  item,
  selected,
  onCheck,
  onDelete,
  onQuantityChange,
  disableActions = false,
}) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const {
    id,
    schedule_id,
    schedule_title,
    start_date,
    end_date,
    image_url,
    unit_price,
    discount_price,
    quantity,
    subtotal,
  } = item;

  const start = new Date(start_date);
  const end = new Date(end_date);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: isMobile ? "10px" : "16px",
        background: "#fff",
        display: isMobile ? "block" : "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "8px" : "16px",
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        minWidth: 0,
      }}
    >
      {/* 삭제 버튼 */}
      {!disableActions && (
  <button
    onClick={() => onDelete(id)}
    style={{
      position: "absolute",
      top: isMobile ? 2 : 6,
      right: isMobile ? 2 : 6,
      background: "transparent",
      border: "none",
      fontSize: isMobile ? "17px" : "20px",
      color: "#aaa",
      cursor: "pointer",
      zIndex: 2,
      padding: 0,
      width: isMobile ? 28 : 32,   // X버튼 클릭영역 넉넉히
      height: isMobile ? 28 : 32,
      lineHeight: isMobile ? "28px" : "32px",
      textAlign: "center",
    }}
    title="삭제"
  >
    ×
  </button>
)}

      {!disableActions && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onCheck(id, e.target.checked)}
          style={{ position: "absolute", top: isMobile ? 8 : 12, left: isMobile ? 8 : 12, zIndex: 2 }}
        />
      )}

      {/* 썸네일 */}
      <div
        onClick={() => router.push(`/education/facilitation/${schedule_id}`)}
        style={{
          width: isMobile ? 60 : 80,
          height: isMobile ? 60 : 80,
          flexShrink: 0,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginBottom: isMobile ? 8 : 0,
        }}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={schedule_title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#999", fontSize: isMobile ? 10 : 12 }}>썸네일 없음</span>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, paddingTop: isMobile ? 2 : 4, minWidth: 0 }}>
        {/* 제목: 두줄까지, 말줄임 적용 */}
        <div
  style={{
    fontSize: isMobile ? "13px" : "15px",
    marginBottom: "4px",
    fontWeight: 400,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-all",
    minHeight: isMobile ? "34px" : "40px",
    // 👇 X버튼 영역만큼 패딩
    paddingRight: isMobile ? 32 : 36,
    marginTop: isMobile ? 18 : 0, // 모바일이면 X버튼 공간
    position: "relative",
  }}
>
  {schedule_title}
</div>

        {/* 날짜 */}
        <p
          style={{
            fontSize: isMobile ? "11px" : "13px",
            color: "#666",
            marginBottom: "8px",
          }}
        >
          {isValidDate(start)
            ? start.toLocaleDateString()
            : ""}
          {isValidDate(start) && isValidDate(end) && !sameDay &&
            ` ~ ${end.toLocaleDateString()}`}
          {!isValidDate(start) && !isValidDate(end) && "일정 미정"}
        </p>

        {/* 수량 조절 */}
        {disableActions ? (
          <div style={{ fontSize: isMobile ? 12 : 14, marginTop: 4 }}>수량: {quantity}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                display: "inline-flex",
                border: "1px solid #ccc",
                borderRadius: 4,
                overflow: "hidden",
                alignItems: "center",
                height: isMobile ? 28 : 32,
              }}
            >
              <button
                onClick={() => onQuantityChange(item, -1)}
                style={{
                  ...qtyBtnStyle,
                  width: isMobile ? 26 : 32,
                  height: isMobile ? 28 : 32,
                  fontSize: isMobile ? 14 : 16,
                }}
              >
                –
              </button>
              <div
                style={{
                  ...qtyValueStyle,
                  width: isMobile ? 28 : 36,
                  height: isMobile ? 24 : 28,
                  fontSize: isMobile ? 12 : 14,
                  lineHeight: isMobile ? "24px" : "28px",
                }}
              >
                {quantity}
              </div>
              <button
                onClick={() => onQuantityChange(item, 1)}
                style={{
                  ...qtyBtnStyle,
                  width: isMobile ? 26 : 32,
                  height: isMobile ? 28 : 32,
                  fontSize: isMobile ? 14 : 16,
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 가격 */}
        <div style={{ marginTop: 8, fontSize: isMobile ? "12px" : "15px" }}>
          {discount_price ? (
            <>
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  marginRight: 8,
                }}
              >
                {formatPrice(unit_price)}원
              </span>
              <span style={{ color: "#d9534f", marginRight: 4 }}>
                {formatPrice(discount_price)}원
              </span>
              <span
                style={{
                  fontSize: isMobile ? "10px" : "11px",
                  marginLeft: 3,
                  color: "#d9534f",
                }}
              >
                ({Math.round((1 - discount_price / unit_price) * 100)}% 할인)
              </span>
              <div
                style={{
                  textAlign: "right",
                  marginTop: 2,
                }}
              >
                {formatPrice(subtotal)}원
              </div>
            </>
          ) : (
            <div style={{ textAlign: "right" }}>{formatPrice(subtotal)}원</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 버튼 스타일
const qtyBtnStyle = {
  border: "1px solid #ddd",
  background: "#f5f5f5",
  fontWeight: 400,
  cursor: "pointer",
  borderRadius: "4px",
};

const qtyValueStyle = {
  textAlign: "center",
  background: "#fff",
};

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}
