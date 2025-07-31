import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function UserCouponGrantModal({
  selectedIds = [],
  couponTemplates = [],
  onClose,
  onSuccess,
}) {
  const [templateId, setTemplateId] = useState("");
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async () => {
    try {
      console.log("🎯 지급 버튼 클릭됨");
      if (selectedIds.length === 0) {
        showAlert("쿠폰 지급 대상을 선택해주세요.");
        return;
      }
      if (!templateId) {
        showAlert("지급할 쿠폰을 선택해주세요.");
        return;
      }

      const token = sessionStorage.getItem("accessToken");
      console.log("🔥 accessToken from sessionStorage:", token);

      const res = await api.post("admin/batch-coupons", {
        userIds: selectedIds.map((id) => Number(id)),
        templateId: Number(templateId),
      });
      console.log("✅ 쿠폰 지급 성공 응답:", res.data);
      showAlert("쿠폰 지급이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.log("📛 전체 응답 데이터:", err.response?.data);
      const msg =
        err.response?.data?.message || err.message || "쿠폰 지급 중 오류 발생";
      console.error("❌ 쿠폰 지급 실패:", msg);
      showAlert(String(msg));
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          ×
        </button>
        <h3 style={{ marginBottom: 12 }}>쿠폰 지급</h3>
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          선택된 사용자: {selectedIds.length}명
        </p>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={selectStyle}
        >
          <option value="">쿠폰을 선택하세요</option>
          {couponTemplates.map((tpl) => {
            const label =
              tpl.discount_type === "percent"
                ? `[${tpl.discount_value}%] ${tpl.name}`
                : `[${tpl.discount_amount}원] ${tpl.name}`;
            return (
              <option key={tpl.id} value={tpl.id}>
                {label}
              </option>
            );
          })}
        </select>
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

const selectStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const submitButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#ffc107",
  color: "#212529",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
