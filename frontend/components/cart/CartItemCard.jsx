import { formatPrice } from "@/lib/format";
import { useRouter } from "next/router";

export default function CartItemCard({
  item,
  selected,
  onCheck,
  onDelete,
  onQuantityChange,
  disableActions = false,
}) {
  const router = useRouter();

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
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "12px",
        background: "#fff",
        display: "flex",
        flexDirection: "column", // ✅ 세로로 쌓기
        gap: "12px",
        position: "relative",
        height: "100%", // ✅ 카드 높이 통일
        boxSizing: "border-box",
      }}
    >
      {/* 삭제 버튼 */}
      {!disableActions && (
        <button
          onClick={() => onDelete(id)}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "transparent",
            border: "none",
            fontSize: "20px",
            color: "#aaa",
            cursor: "pointer",
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
          style={{ position: "absolute", top: 12, left: 12 }}
        />
      )}

      {/* 썸네일 */}
      <div
        onClick={() => router.push(`/education/facilitation/${schedule_id}`)}
        style={{
          width: 80,
          height: 80,
          flexShrink: 0,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={schedule_title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#999", fontSize: 12 }}>썸네일 없음</span>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, paddingTop: 4 }}>
        <h3
          style={{
            fontSize: "15px",
            marginBottom: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {schedule_title}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "8px",
          }}
        >
          {start.toLocaleDateString()}
          {!sameDay && ` ~ ${end.toLocaleDateString()}`}
        </p>

        {/* 수량 조절 */}
        {/* 수량 표시 또는 조절 */}
        {disableActions ? (
          <div style={{ fontSize: 14, marginTop: 4 }}>수량: {quantity}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                display: "inline-flex",
                border: "1px solid #ccc",
                borderRadius: 4,
                overflow: "hidden",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => onQuantityChange(item, -1)}
                style={qtyBtnStyle}
              >
                –
              </button>
              <div style={qtyValueStyle}>{quantity}</div>
              <button
                onClick={() => onQuantityChange(item, 1)}
                style={qtyBtnStyle}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 가격 */}
        <div style={{ marginTop: 8, fontSize: "15px" }}>
          {discount_price ? (
            <>
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  marginRight: 8,
                }}
              >
                {formatPrice(unit_price)}
              </span>
              <span style={{ color: "#d9534f", fontWeight: "bold" }}>
                {formatPrice(discount_price)}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  marginLeft: 6,
                  color: "#d9534f",
                  fontWeight: "bold",
                }}
              >
                ({Math.round((1 - discount_price / unit_price) * 100)}% 할인)
              </span>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {formatPrice(subtotal)}
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatPrice(subtotal)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const qtyBtnStyle = {
  width: 28,
  height: 28,
  border: "none",
  background: "transparent",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
};
const qtyValueStyle = {
  width: 36,
  height: 28,
  lineHeight: "28px",
  textAlign: "center",
  fontSize: 14,
  background: "#fff",
};
