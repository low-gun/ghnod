// /frontend/components/admin/CouponTemplateModal.jsx
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import PaginationControls from "@/components/common/PaginationControls";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import AdminDialog from "@/components/common/AdminDialog";

export default function CouponTemplateModal({ onClose }) {
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [form, setForm] = useState({
    name: "",
    discount_type: "fixed",
    discount_value: "",
    discount_amount: "",
    max_discount_amount: "",
    expired_at: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 초기 로드
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("admin/coupon-templates");
      if (res.data?.success) setTemplates(res.data.data);
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 조회 실패:", err);
      showAlert("쿠폰 템플릿 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      discount_type: "fixed",
      discount_value: "",
      discount_amount: "",
      max_discount_amount: "",
      expired_at: "",
    });
  };

  const handleSubmit = async () => {
    // 검증
    if (!form.name || !form.discount_type) {
      showAlert("쿠폰명과 할인타입은 필수입니다.");
      return;
    }
    if (form.discount_type === "fixed" && !form.discount_amount) {
      showAlert("금액 할인 쿠폰은 할인금액이 필요합니다.");
      return;
    }
    if (form.discount_type === "percent") {
      if (!form.discount_value) {
        showAlert("퍼센트 할인 쿠폰은 할인율이 필요합니다.");
        return;
      }
      if (Number(form.discount_value) > 100) {
        showAlert("할인율은 100%를 초과할 수 없습니다.");
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.post("admin/coupon-templates", {
        ...form,
        // 백엔드가 null 허용
        discount_value:
          form.discount_type === "percent" ? Number(form.discount_value) : null,
        discount_amount:
          form.discount_type === "fixed" ? Number(form.discount_amount) : null,
        max_discount_amount:
          form.discount_type === "percent" && form.max_discount_amount !== ""
            ? Number(form.max_discount_amount)
            : null,
        expired_at: form.expired_at || null,
      });
      showAlert("쿠폰 템플릿이 등록되었습니다.");
      await fetchTemplates();
      resetForm();
      // 첫 페이지로 이동
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 등록 실패:", err);
      showAlert("등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/coupon-templates/${id}/activate`, {
        is_active: currentStatus ? 0 : 1,
      });
      await fetchTemplates();
    } catch (err) {
      console.error("❌ 활성화 상태 변경 실패:", err);
      showAlert("상태 변경 실패");
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm(
      "정말 삭제하시겠습니까? (발급된 쿠폰이 없어야 합니다)"
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/coupon-templates/${id}`);
      showAlert("쿠폰 템플릿이 삭제되었습니다.");
      await fetchTemplates();
      // 페이지 비어있으면 앞쪽 페이지로
      const totalPages = Math.max(
        1,
        Math.ceil((templates.length - 1) / itemsPerPage)
      );
      if (currentPage > totalPages) setCurrentPage(totalPages);
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 삭제 실패:", err);
      showAlert("삭제 실패 (발급된 쿠폰이 있을 수 있음)");
    }
  };

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return templates.slice(start, start + itemsPerPage);
  }, [templates, currentPage]);

  const footer = (
    <button
      type="button"
      onClick={onClose}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
      }}
    >
      닫기
    </button>
  );

  return (
    <AdminDialog
      open={true}
      onClose={onClose}
      title="쿠폰 템플릿 관리"
      subtitle="쿠폰 템플릿 등록 / 활성화 / 삭제"
      size="lg"
      footer={footer}
    >
      {/* 등록 폼 */}
      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 16,
          gridTemplateColumns: "1fr",
        }}
      >
        <div style={rowStyle}>
          <label style={labelStyle}>쿠폰명</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
            disabled={submitting}
            placeholder="예: 신규가입 10% 할인"
          />
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>할인타입</label>
          <select
            value={form.discount_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount_type: e.target.value }))
            }
            style={inputStyle}
            disabled={submitting}
          >
            <option value="fixed">금액 할인</option>
            <option value="percent">퍼센트 할인</option>
          </select>
        </div>

        {form.discount_type === "fixed" ? (
          <div style={rowStyle}>
            <label style={labelStyle}>할인금액</label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.discount_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount_amount: e.target.value }))
              }
              style={inputStyle}
              disabled={submitting}
              placeholder="예: 5000"
            />
          </div>
        ) : (
          <>
            <div style={rowStyle}>
              <label style={labelStyle}>할인율(%)</label>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={form.discount_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_value: e.target.value }))
                }
                style={inputStyle}
                disabled={submitting}
                placeholder="예: 10"
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>최대 할인금액</label>
              <input
                type="number"
                min={0}
                step={100}
                value={form.max_discount_amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_discount_amount: e.target.value,
                  }))
                }
                style={inputStyle}
                disabled={submitting}
                placeholder="예: 10000"
              />
            </div>
          </>
        )}

        <div style={rowStyle}>
          <label style={labelStyle}>만료일</label>
          <input
            type="date"
            value={form.expired_at}
            onChange={(e) =>
              setForm((f) => ({ ...f, expired_at: e.target.value }))
            }
            style={inputStyle}
            disabled={submitting}
          />
        </div>

        <div style={{ textAlign: "right", marginTop: 4 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#16a34a",
              color: "#fff",
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 목록 */}
      <h4 style={{ marginTop: 8, marginBottom: 8 }}>등록된 쿠폰 템플릿</h4>
      <div
        style={{
          border: "1px solid #eef2f7",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            fontSize: 14,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>쿠폰명</th>
              <th style={thStyle}>할인</th>
              <th style={thStyle}>만료일</th>
              <th style={thStyle}>발급/사용</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                  불러오는 중...
                </td>
              </tr>
            ) : paginatedTemplates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedTemplates.map((tpl) => (
                <tr key={tpl.id}>
                  <td style={tdStyle}>{tpl.name}</td>
                  <td style={tdStyle}>
                    {tpl.discount_type === "fixed"
                      ? `${formatPrice(tpl.discount_amount)}원`
                      : `${tpl.discount_value}%`}
                  </td>
                  <td style={tdStyle}>
                    {tpl.expired_at
                      ? new Date(tpl.expired_at).toLocaleDateString()
                      : "만료일 없음"}
                  </td>
                  <td style={tdStyle}>
                    {tpl.issued_count || 0} / {tpl.used_count || 0}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggleActive(tpl.id, tpl.is_active)}
                      style={{
                        ...pillBtn,
                        backgroundColor: tpl.is_active ? "#16a34a" : "#6b7280",
                      }}
                    >
                      {tpl.is_active ? "활성화" : "비활성화"}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      style={{ ...pillBtn, backgroundColor: "#e11d48" }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ padding: 8 }}>
          <PaginationControls
            page={currentPage}
            totalPages={Math.max(1, Math.ceil(templates.length / itemsPerPage))}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </AdminDialog>
  );
}

/* ---------- 스타일 ---------- */
const rowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  alignItems: "center",
  gap: 8,
};

const labelStyle = {
  fontWeight: 600,
  fontSize: 13,
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  outline: "none",
};

const thStyle = {
  padding: 10,
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "center",
  fontWeight: 700,
  color: "#111827",
};

const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #f1f5f9",
  textAlign: "center",
  color: "#374151",
};

const pillBtn = {
  padding: "6px 10px",
  fontSize: 13,
  color: "#fff",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
};
