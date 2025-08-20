// /frontend/components/admin/UserCouponGrantModal.jsx
import { useState } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import AdminDialog from "@/components/common/AdminDialog";

export default function UserCouponGrantModal({
  selectedIds = [],
  couponTemplates = [],
  onClose,
  onSuccess,
}) {
  const { showAlert } = useGlobalAlert();
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      showAlert("쿠폰 지급 대상을 선택해주세요.");
      return;
    }
    if (!templateId) {
      showAlert("지급할 쿠폰을 선택해주세요.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("admin/batch-coupons", {
        userIds: selectedIds.map((id) => Number(id)),
        templateId: Number(templateId),
      });
      showAlert("쿠폰 지급이 완료되었습니다.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "쿠폰 지급 중 오류가 발생했습니다.";
      showAlert(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#fff",
          color: "#374151",
          cursor: "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        취소
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "#ffc107",
          color: "#212529",
          cursor: "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "지급 중..." : "지급"}
      </button>
    </>
  );

  return (
    <AdminDialog
      open={true}
      onClose={submitting ? undefined : onClose}
      title="쿠폰 지급"
      subtitle={`선택된 사용자: ${selectedIds.length}명`}
      size="sm"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ fontSize: 14, color: "#374151" }}>지급할 쿠폰</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none",
            background: "#fff",
          }}
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
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          • 선택된 템플릿 기준으로 즉시 지급됩니다.
        </p>
      </div>
    </AdminDialog>
  );
}
