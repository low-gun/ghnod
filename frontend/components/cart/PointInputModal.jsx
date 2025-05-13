// components/cart/PointInputModal.jsx
import { useState, useEffect } from "react";

export default function PointInputModal({
  onApply,
  onClose,
  maxPoint = 0,
  defaultValue = 0, // ✅ 기존 값 받아오기
}) {
  const [value, setValue] = useState(defaultValue);

  // ✅ defaultValue가 바뀔 때마다 초기화
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleApply = () => {
    const v = Math.min(Number(value), maxPoint);
    onApply(v);
    onClose();
  };

  const handleUseAll = () => {
    setValue(maxPoint);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <strong>포인트 사용</strong>
          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>
        <div style={{ marginTop: 16 }}>
          <input
            type="number"
            min={0}
            max={maxPoint}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
          <div style={rowBetweenStyle}>
            <div style={{ fontSize: "12px", color: "#999" }}>
              사용 가능 포인트: {maxPoint.toLocaleString()}P
            </div>
            <button
              onClick={handleUseAll}
              style={{
                fontSize: "12px",
                border: "none",
                background: "transparent",
                color: "#3b82f6",
                cursor: "pointer",
              }}
            >
              전액사용
            </button>
          </div>
        </div>
        <button onClick={handleApply} style={applyBtnStyle}>
          적용
        </button>
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

const inputStyle = {
  padding: 10,
  width: "100%",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: 4,
};

const applyBtnStyle = {
  marginTop: 16,
  padding: "10px 0",
  width: "100%",
  fontWeight: "bold",
  fontSize: "14px",
  backgroundColor: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
const rowBetweenStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
};
