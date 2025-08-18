// ./frontend/components/common/StatusBadge.jsx
const LABELS = {
  paid: "결제완료",
  refunded: "환불완료",
  failed: "결제실패",
};

const COLORS = {
  결제완료: "#10b981",
  환불완료: "#3b82f6",
  결제실패: "#ef4444",
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status || "-";
  const bg = COLORS[label] || "#9ca3af";
  return (
    <span
      style={{
        backgroundColor: bg,
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 12,
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );
}
