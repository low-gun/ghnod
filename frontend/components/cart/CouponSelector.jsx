import { formatPrice } from "@/lib/format";

export default function CouponSelector({ couponList = [], onSelect, onClose }) {
  console.log("🔥 CouponSelector 렌더됨:", couponList); // ✅ 렌더 확인

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...modalStyle, width: 320 }}
        onClick={(e) => e.stopPropagation()} // ✅ 내부 클릭은 전파 차단
      >
        <div style={headerStyle}>
          <strong>쿠폰 선택</strong>
          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <ul style={{ padding: 0, listStyle: "none", marginTop: 12 }}>
          {/* 선택 안 함 */}
          <li
            key="none"
            tabIndex={0}
            role="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect(null);
                onClose();
              }
            }} // ✅ 키보드 활성화
            style={listItemStyle}
          >
            선택 안 함
          </li>

          {/* 쿠폰 목록 */}
          {couponList.map((c) => {
            const label = c.label || c.name || `쿠폰 #${c.id}`;
            const amount = c.amount ?? 0;
            const expiry = c.expiry_date || c.expired_at;
            const expiryText = expiry ? new Date(expiry).toLocaleDateString() : null;

            return (
              <li
                key={c.id ?? label}
                tabIndex={0}
                role="button"
                onClick={() => {
                  onSelect(c);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelect(c);
                    onClose();
                  }
                }} // ✅ 키보드 활성화
                style={listItemStyle}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{label}</span>
                  <span
                    style={{
                      color: "#3b82f6",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {formatPrice(amount)}원
                  </span>
                </div>

                {expiryText && (
                  <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>
                    유효기한: {expiryText}
                  </div>
                )}
              </li>
            );
          })}
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
  maxHeight: "70vh", // ✅ 스크롤 높이 제한
  overflowY: "auto", // ✅ 스크롤
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
