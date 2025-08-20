// /frontend/components/admin/UserPointGrantModal.jsx
import { useState } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import AdminDialog from "@/components/common/AdminDialog";

export default function UserPointGrantModal({
  selectedIds = [],
  onClose,
  onSuccess,
}) {
  const { showAlert } = useGlobalAlert();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      showAlert("포인트 지급 대상을 선택해주세요.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showAlert("올바른 포인트 금액을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("admin/batch-points", {
        userIds: selectedIds,
        amount: value,
      });
      showAlert("포인트 지급이 완료되었습니다.");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      showAlert("포인트 지급 중 오류가 발생했습니다.");
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
          background: "#2563eb",
          color: "#fff",
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
      title="포인트 지급"
      subtitle={`선택된 사용자: ${selectedIds.length}명`}
      size="sm"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ fontSize: 14, color: "#374151" }}>
          지급할 포인트 금액
        </label>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="예: 1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none",
          }}
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          • 1 이상 정수로 입력하세요.
        </p>
      </div>
    </AdminDialog>
  );
}
