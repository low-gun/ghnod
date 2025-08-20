// /frontend/components/admin/UserPointModal.js
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import AdminDialog from "@/components/common/AdminDialog";

export default function UserPointModal({ user, onClose, onRefresh }) {
  const { showAlert } = useGlobalAlert();
  const [pointAmount, setPointAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pointHistory, setPointHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 5;

  const fetchPointHistory = async () => {
    try {
      const res = await api.get(`/admin/users/${user.id}/points`);
      if (res.data?.success) setPointHistory(res.data.points || []);
    } catch (error) {
      console.error("❌ 포인트 내역 조회 실패:", error);
    }
  };

  useEffect(() => {
    fetchPointHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSubmit = async () => {
    const value = Number(pointAmount);
    if (!Number.isFinite(value) || value <= 0) {
      showAlert("올바른 포인트 금액을 입력해주세요.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/admin/batch-points`, {
        userIds: [user.id],
        amount: value,
        description: description || "관리자 지급",
      });
      showAlert("포인트가 지급되었습니다.");
      setPointAmount("");
      setDescription("");
      await fetchPointHistory();
      onRefresh?.();
      onClose?.();
    } catch (error) {
      console.error("❌ 포인트 지급 실패:", error);
      showAlert("포인트 지급 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedHistory = pointHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.max(1, Math.ceil(pointHistory.length / pageSize));

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        style={btnGhost}
      >
        취소
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={btnPrimary}
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
      subtitle={`대상: ${user.username} (${user.email})`}
      size="md"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      {/* 입력 폼 */}
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={label}>포인트 금액</label>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="예: 1000"
            value={pointAmount}
            onChange={(e) => setPointAmount(e.target.value)}
            disabled={submitting}
            style={input}
          />
        </div>
        <div>
          <label style={label}>지급 사유</label>
          <input
            type="text"
            placeholder="예: 출석 이벤트 보상"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            style={input}
          />
        </div>
      </div>

      {/* 내역 */}
      <h4 style={{ marginTop: 24, marginBottom: 8 }}>포인트 내역</h4>
      {pointHistory.length === 0 ? (
        <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
          포인트 내역이 없습니다.
        </p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              marginTop: 8,
              fontSize: 14,
              borderCollapse: "collapse",
              border: "1px solid #eef2f7",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr>
                <th style={th}>구분</th>
                <th style={th}>금액</th>
                <th style={th}>사유</th>
                <th style={th}>날짜</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((item, idx) => (
                <tr key={idx}>
                  <td style={td}>{item.change_type}</td>
                  <td style={td}>{item.amount}</td>
                  <td style={td}>{item.description || "-"}</td>
                  <td style={td}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 (간단) */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={btnPager}
            >
              ◀ 이전
            </button>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={btnPager}
            >
              다음 ▶
            </button>
          </div>
        </>
      )}
    </AdminDialog>
  );
}

/* ── 스타일 ── */
const label = {
  display: "block",
  fontSize: 14,
  color: "#374151",
  marginBottom: 6,
};
const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  outline: "none",
};

const th = {
  padding: 10,
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "center",
  fontWeight: 700,
  color: "#111827",
};
const td = {
  padding: 10,
  borderBottom: "1px solid #f1f5f9",
  textAlign: "center",
  color: "#374151",
};

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};
const btnGhost = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
};
const btnPager = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
};
