// /frontend/components/admin/UserCouponModal.js
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import AdminDialog from "@/components/common/AdminDialog";

export default function UserCouponModal({ user, onClose, onRefresh }) {
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  const [couponTemplates, setCouponTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [issuedCoupons, setIssuedCoupons] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // paging
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/coupon-templates");
        if (res.data?.success) setCouponTemplates(res.data.data || []);
      } catch (err) {
        console.error("❌ 쿠폰 템플릿 불러오기 실패:", err);
      }
    })();
    fetchIssuedCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchIssuedCoupons = async () => {
    try {
      const res = await api.get(`/admin/users/${user.id}/coupons`);
      if (res.data?.success) setIssuedCoupons(res.data.coupons || []);
    } catch (error) {
      console.error("❌ 쿠폰 발급 내역 조회 실패:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      showAlert("발급할 쿠폰을 선택해주세요.");
      return;
    }
    const parsedTemplateId = Number(selectedTemplateId);
    if (!parsedTemplateId) {
      showAlert("쿠폰 템플릿이 유효하지 않습니다.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/admin/batch-coupons`, {
        userIds: [user.id],
        templateId: parsedTemplateId,
      });

      showAlert("쿠폰이 발급되었습니다.");
      setSelectedTemplateId("");
      await fetchIssuedCoupons();
      onRefresh?.();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "쿠폰 발급 중 오류가 발생했습니다.";
      console.error("❌ 쿠폰 발급 실패:", msg);
      showAlert(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeCoupon = async (couponId, is_used) => {
    if (is_used) return; // 사용/회수된 쿠폰은 회수 불가
    const ok = await showConfirm("정말 이 쿠폰을 회수하시겠습니까?");
    if (!ok) return;

    try {
      setSubmitting(true);
      await api.delete(`/admin/users/coupons/${couponId}`);
      showAlert("쿠폰이 성공적으로 회수되었습니다.");
      await fetchIssuedCoupons();
    } catch (error) {
      console.error("❌ 쿠폰 회수 실패:", error);
      showAlert("쿠폰 회수 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(issuedCoupons.length / pageSize));
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return issuedCoupons.slice(start, start + pageSize);
  }, [issuedCoupons, currentPage]);

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        style={btnGhost}
      >
        닫기
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={btnPrimaryYellow}
      >
        {submitting ? "발급 중..." : "발급"}
      </button>
    </>
  );

  return (
    <AdminDialog
      open={true}
      onClose={submitting ? undefined : onClose}
      title="쿠폰 발급"
      subtitle={`대상: ${user.username} (${user.email})`}
      size="md"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      {/* 발급 섹션 */}
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label style={label}>쿠폰 선택</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          disabled={submitting}
          style={input}
        >
          <option value="">선택 안 함</option>
          {couponTemplates.map((tpl) => {
            const prefix =
              tpl.discount_type === "percent" && tpl.discount_value
                ? `[${tpl.discount_value}%] `
                : tpl.discount_type === "fixed" && tpl.discount_amount
                  ? `[${formatPrice(tpl.discount_amount)}원] `
                  : "";
            return (
              <option key={tpl.id} value={tpl.id}>
                {prefix}
                {tpl.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* 발급 내역 */}
      <h4 style={{ marginTop: 8, marginBottom: 8 }}>발급된 쿠폰 내역</h4>
      {issuedCoupons.length === 0 ? (
        <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
          발급된 쿠폰이 없습니다.
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
                <th style={th}>쿠폰명</th>
                <th style={th}>할인</th>
                <th style={th}>사용여부</th>
                <th style={th}>만료일</th>
                <th style={th}>회수</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoupons.map((coupon) => {
                const usedLabel =
                  coupon.is_used === 1
                    ? "사용됨"
                    : coupon.is_used === -1
                      ? "회수됨"
                      : "미사용";
                const canRevoke = Number(coupon.is_used) === 0;
                return (
                  <tr key={coupon.id}>
                    <td style={td}>{coupon.coupon_name || "-"}</td>
                    <td style={td}>
                      {coupon.discount_type === "percent"
                        ? `${coupon.discount_value}%`
                        : coupon.discount_amount != null
                          ? `${formatPrice(coupon.discount_amount)}원`
                          : "0원"}
                    </td>
                    <td style={td}>{usedLabel}</td>
                    <td style={td}>
                      {coupon.expiry_date
                        ? new Date(coupon.expiry_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td style={td}>
                      {canRevoke && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRevokeCoupon(coupon.id, coupon.is_used)
                          }
                          disabled={submitting}
                          style={btnDanger}
                        >
                          회수
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 간단 페이지네이션 */}
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
const btnPrimaryYellow = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#ffc107",
  color: "#212529",
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
const btnDanger = {
  padding: "6px 10px",
  fontSize: 13,
  borderRadius: 8,
  border: "none",
  background: "#e11d48",
  color: "#fff",
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
