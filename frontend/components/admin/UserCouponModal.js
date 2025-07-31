import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format"; // ✅ 추가
import { useGlobalAlert } from "@/stores/globalAlert"; // 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 추가

export default function UserCouponModal({ user, onClose, onRefresh }) {
  const [couponTemplates, setCouponTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [issuedCoupons, setIssuedCoupons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { showAlert } = useGlobalAlert(); // 추가
  const { showConfirm } = useGlobalConfirm(); // ✅ 추가

  useEffect(() => {
    api
      .get("/admin/coupon-templates")
      .then((res) => {
        if (res.data.success) {
          setCouponTemplates(res.data.data);
        }
      })
      .catch((err) => {
        console.error("❌ 쿠폰 템플릿 불러오기 실패:", err);
      });

    fetchIssuedCoupons();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchIssuedCoupons = async () => {
    try {
      const res = await api.get(`/admin/users/${user.id}/coupons`);
      if (res.data.success) {
        setIssuedCoupons(res.data.coupons);
      }
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
      await api.post(`/admin/batch-coupons`, {
        userIds: [user.id],
        templateId: parsedTemplateId,
      });

      showAlert("쿠폰이 발급되었습니다.");
      setSelectedTemplateId("");
      fetchIssuedCoupons();
      onRefresh?.();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "쿠폰 발급 중 오류가 발생했습니다.";

      console.error("❌ 쿠폰 발급 실패:", msg);
      showAlert(msg);
    }
  };

  const paginatedCoupons = issuedCoupons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(issuedCoupons.length / pageSize);

  const renderCouponLabel = (tpl) => {
    const discountText =
      tpl.discount_type === "percent"
        ? `${tpl.discount_value}%`
        : tpl.discount_amount != null
          ? `${formatPrice(tpl.discount_amount)}원`
          : "0원";

    const expiredText = tpl.expired_at
      ? `만료일: ${new Date(tpl.expired_at).toLocaleDateString()}`
      : "만료일 없음";

    return `[${discountText}] ${tpl.name} (${expiredText})`;
  };
  const handleRevokeCoupon = async (couponId) => {
    const ok = await showConfirm("정말 이 쿠폰을 회수하시겠습니까?");
    if (!ok) return;

    try {
      await api.delete(`/admin/users/coupons/${couponId}`);
      showAlert("쿠폰이 성공적으로 회수되었습니다.");
      fetchIssuedCoupons();
    } catch (error) {
      console.error("❌ 쿠폰 회수 실패:", error);
      showAlert("쿠폰 회수 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle} aria-label="닫기">
          ×
        </button>

        <h3 style={{ marginBottom: "16px" }}>🎟️ 쿠폰 발급</h3>
        <p>
          대상: <strong>{user.username}</strong> ({user.email})
        </p>

        <div style={{ marginTop: "16px" }}>
          <label>쿠폰 선택</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={inputStyle}
          >
            <option value="">선택 안 함</option>
            {couponTemplates.map((tpl) => {
              let prefix = "";

              if (tpl.discount_type === "percent" && tpl.discount_value) {
                prefix = `[${tpl.discount_value}%] `;
              } else if (tpl.discount_type === "fixed" && tpl.discount_amount) {
                prefix = `[${formatPrice(tpl.discount_amount)}원] `;
              }

              return (
                <option key={tpl.id} value={tpl.id}>
                  {prefix}
                  {tpl.name}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button onClick={onClose} style={buttonStyleCancel}>
            취소
          </button>
          <button onClick={handleSubmit} style={buttonStyle}>
            발급
          </button>
        </div>

        {/* 발급 내역 테이블 */}
        <h4 style={{ marginTop: "32px" }}>📄 발급된 쿠폰 내역</h4>
        {issuedCoupons.length === 0 ? (
          <p style={{ marginTop: "8px" }}>발급된 쿠폰이 없습니다.</p>
        ) : (
          <>
            <table
              style={{ width: "100%", marginTop: "8px", fontSize: "14px" }}
            >
              <thead>
                <tr>
                  <th>쿠폰명</th>
                  <th>할인</th>
                  <th>사용여부</th>
                  <th>만료일</th>
                  <th>회수</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon, index) => (
                  <tr key={index}>
                    <td>{coupon.coupon_name || "-"}</td>
                    <td>
                      {coupon.discount_type === "percent"
                        ? `${coupon.discount_value}%`
                        : coupon.discount_amount != null
                          ? `${formatPrice(coupon.discount_amount)}원`
                          : "0원"}
                    </td>
                    <td>
                      {coupon.is_used === 1
                        ? "사용됨"
                        : coupon.is_used === -1
                          ? "회수됨"
                          : "미사용"}
                    </td>
                    <td>
                      {coupon.expiry_date
                        ? new Date(coupon.expiry_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {/* ✅ 미사용 쿠폰만 회수 가능 */}
                      {!coupon.is_used && (
                        <button
                          onClick={() => handleRevokeCoupon(coupon.id)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          회수
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ 이전
              </button>
              <span style={{ margin: "0 8px" }}>
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                다음 ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  position: "relative",
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "500px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};

const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "transparent",
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "4px",
};

const buttonStyle = {
  padding: "8px 16px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginLeft: "8px",
};

const buttonStyleCancel = {
  ...buttonStyle,
  backgroundColor: "#ccc",
  color: "#000",
};

const thStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const tdStyle = {
  padding: "8px",
  textAlign: "center",
};
