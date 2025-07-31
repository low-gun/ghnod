import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function UserPointGrantModal({
  selectedIds = [],
  onClose,
  onSuccess,
}) {
  const [amount, setAmount] = useState(0);
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      showAlert("포인트 지급 대상을 선택해주세요.");
      return;
    }
    if (!amount || amount <= 0) {
      showAlert("올바른 포인트 금액을 입력해주세요.");
      return;
    }
    try {
      await api.post("admin/batch-points", {
        userIds: selectedIds,
        amount: Number(amount),
      });
      showAlert("포인트 지급이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (err) {
      showAlert("포인트 지급 중 오류 발생");
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          ×
        </button>
        <h3 style={{ marginBottom: 12 }}>포인트 지급</h3>
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          선택된 사용자: {selectedIds.length}명
        </p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="지급할 포인트 금액"
          style={inputStyle}
        />
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button onClick={handleSubmit} style={submitButtonStyle}>
            지급
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ 스타일
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "360px",
  position: "relative",
};

const closeButtonStyle = {
  position: "absolute",
  top: 8,
  right: 12,
  border: "none",
  background: "transparent",
  fontSize: 24,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const submitButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
