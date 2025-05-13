import { formatPrice } from "@/lib/format";

export default function CouponSelector({ couponList = [], onSelect, onClose }) {
  console.log("🔥 CouponSelector 렌더됨:", couponList); // ✅ 렌더 확인
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: 320 }}>
        <div style={headerStyle}>
          <strong>쿠폰 선택</strong>
          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>
        <ul style={{ padding: 0, listStyle: "none", marginTop: 12 }}>
          <li
            key={0}
            tabIndex={0}
            role="button"
            onClick={() => {
              console.log("🔥 쿠폰 선택: 없음");
              onSelect(null);
              onClose();
            }}
            style={listItemStyle}
          >
            선택 안 함
          </li>

          {couponList.map((c) => (
            <li
              key={c.id}
              tabIndex={0}
              role="button"
              onClick={() => {
                const matched = couponList.find((x) => x.id === c.id);
                console.log("🔥 쿠폰 클릭됨:", matched);
                if (!matched) {
                  console.warn("❗ 쿠폰 매칭 실패, 원본:", c);
                }
                onSelect(matched);
                onClose();
              }}
              style={listItemStyle}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{c.label || c.name || `쿠폰 #${c.id}`}</span>
                <span
                  style={{
                    color: "#3b82f6",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {formatPrice(c.amount || 0)}
                </span>
              </div>
              {c.expiry_date && (
                <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>
                  유효기한: {new Date(c.expiry_date).toLocaleDateString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modalStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: 280,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const closeBtnStyle = {
  fontSize: 18,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const listItemStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  fontSize: "14px",
};
