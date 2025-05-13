import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { toast } from "react-toastify";
import { useMemo } from "react"; // 최상단 import 부분에 추가
import PaginationControls from "@/components/common/PaginationControls"; // ✅ 추가
export default function CouponTemplateModal({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 한 페이지에 보여줄 항목 수
  const [form, setForm] = useState({
    name: "",
    discount_type: "fixed",
    discount_value: "",
    discount_amount: "",
    max_discount_amount: "",
    expired_at: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/admin/coupon-templates");
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 조회 실패:", err);
      toast.error("쿠폰 템플릿 조회 실패");
    }
  };
  useEffect(() => {
    fetchTemplates();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const handleSubmit = async () => {
    if (!form.name || !form.discount_type) {
      toast.error("쿠폰명과 할인타입은 필수입니다.");
      return;
    }
    if (form.discount_type === "fixed" && !form.discount_amount) {
      toast.error("금액 할인 쿠폰은 할인금액이 필요합니다.");
      return;
    }
    if (form.discount_type === "percent" && !form.discount_value) {
      toast.error("퍼센트 할인 쿠폰은 할인율이 필요합니다.");
      return;
    }

    if (form.discount_type === "percent" && form.discount_value > 100) {
      toast.error("할인율은 100%를 초과할 수 없습니다.");
      return;
    }

    try {
      await api.post("/admin/coupon-templates", {
        ...form,
        expired_at: form.expired_at || null,
      });
      toast.success("쿠폰 템플릿이 등록되었습니다.");
      fetchTemplates();
      resetForm();
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 등록 실패:", err);
      toast.error("등록 실패");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/coupon-templates/${id}/activate`, {
        is_active: currentStatus ? 0 : 1,
      });
      fetchTemplates();
    } catch (err) {
      console.error("❌ 활성화 상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까? (발급된 쿠폰이 없어야 합니다)"))
      return;
    try {
      await api.delete(`/admin/coupon-templates/${id}`);
      toast.success("쿠폰 템플릿이 삭제되었습니다.");
      fetchTemplates();
    } catch (err) {
      console.error("❌ 쿠폰 템플릿 삭제 실패:", err);
      toast.error("삭제 실패 (발급된 쿠폰이 있을 수 있음)");
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

  const handleClose = () => {
    resetForm();
    onClose();
  };
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return templates.slice(start, start + itemsPerPage);
  }, [templates, currentPage]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={handleClose} style={closeButtonStyle}>
          ×
        </button>

        <h3 style={{ marginBottom: "16px" }}>🎟️ 쿠폰 템플릿 관리</h3>

        {/* 입력 폼 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>쿠폰명</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>할인타입</label>
            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm({ ...form, discount_type: e.target.value })
              }
              style={inputStyle}
            >
              <option value="fixed">금액 할인</option>
              <option value="percent">퍼센트 할인</option>
            </select>
          </div>

          {form.discount_type === "fixed" ? (
            <div style={inputGroupStyle}>
              <label style={labelStyle}>할인금액</label>
              <input
                type="number"
                value={form.discount_amount}
                onChange={(e) =>
                  setForm({ ...form, discount_amount: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          ) : (
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>할인율(%)</label>
                <input
                  type="number"
                  value={form.discount_value}
                  max={100}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>최대 할인금액</label>
                <input
                  type="number"
                  value={form.max_discount_amount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount_amount: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={inputGroupStyle}>
            <label style={labelStyle}>만료일</label>
            <input
              type="date"
              value={form.expired_at}
              onChange={(e) => setForm({ ...form, expired_at: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: "right", marginTop: "12px" }}>
            <button onClick={handleSubmit} style={buttonStyle}>
              등록
            </button>
          </div>
        </div>

        {/* 리스트 */}
        <h4>📄 등록된 쿠폰 템플릿</h4>
        <div
          style={{ maxHeight: "400px", overflowY: "auto", marginTop: "8px" }}
        >
          <table
            style={{
              width: "100%",
              fontSize: "14px",
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
              {paginatedTemplates.map((tpl) => (
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
                        ...smallButtonStyle,
                        backgroundColor: tpl.is_active ? "#28a745" : "#6c757d",
                      }}
                    >
                      {tpl.is_active ? "활성화" : "비활성화"}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      style={{
                        ...smallButtonStyle,
                        backgroundColor: "#e74c3c",
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={currentPage}
            totalPages={Math.ceil(templates.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
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
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "720px",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const closeButtonStyle = {
  position: "absolute",
  top: "8px",
  right: "12px",
  background: "transparent",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
};

const inputGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px",
};

const labelStyle = {
  width: "120px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputStyle = {
  flex: "1",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const buttonStyle = {
  padding: "8px 16px",
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const smallButtonStyle = {
  padding: "4px 8px",
  fontSize: "13px",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const thStyle = {
  padding: "8px",
  background: "#f8f9fa",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "8px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
};
