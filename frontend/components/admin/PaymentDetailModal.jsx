import { useEffect, useState } from "react";
import axios from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // ✅ 반응형 훅 추가

export default function PaymentDetailModal({ paymentId, onClose }) {
  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile(); // ✅ 반응형 적용
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/admin/payments/${paymentId}`);
        const paymentData = data.payment;
        setPayment(paymentData);
        if (paymentData?.admin_memo) setMemo(paymentData.admin_memo);

        if (paymentData?.order_id) {
          const orderRes = await axios.get(
            `/orders/${paymentData.order_id}/items`
          );
          console.log("🧾 주문 상세 응답:", orderRes.data); // 🔥 이거 추가
          setOrder(orderRes.data.order);
          setItems(orderRes.data.items);
        }
      } catch (err) {
        console.error("❌ 상세 정보 로드 실패", err);
      }
    };

    fetchData();
  }, [paymentId]);

  // ✅ ESC 키 누르면 닫힘
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSaveMemo = async () => {
    setSaving(true);
    try {
      await axios.put(`/admin/payments/${paymentId}/memo`, { memo });
      showAlert("메모가 저장되었습니다.");
    } catch (err) {
      showAlert("메모 저장에 실패했습니다.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!payment) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 2001,
        display: "flex",
        justifyContent: "center",
        alignItems: isMobile ? "flex-end" : "center", // ✅ 모바일: 아래 정렬
        padding: isMobile ? 0 : 20,                   // ✅ 모바일: 패딩 제거
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 560,                // ✅ 모바일: 전체 너비
          background: "#fff",
          borderRadius: isMobile ? "16px 16px 0 0" : 12,    // ✅ 모바일: 위쪽만 둥글게
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          padding: 20,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          fontFamily: "'Apple SD Gothic Neo', sans-serif",
          textAlign: "left",
        }}
      >
  
        <button onClick={onClose} style={closeButtonStyle}>
          ×
        </button>

        <CardBlock title="결제 정보">
          <Info label="결제번호" value={payment.id} />
          <Info label="주문번호" value={payment.order_id} />
          <Info label="결제금액" value={`${formatPrice(payment.amount)}원`} />
          <Info label="결제수단" value={payment.payment_method} />
          <Info
            label="결제일시"
            value={new Date(payment.created_at).toLocaleString("ko-KR")}
          />
          <Info label="상태" value={payment.status} />
        </CardBlock>

        {order && (
          <>
            <CardBlock title="할인 정보">
              <Info
                label="사용 포인트"
                value={`${formatPrice(order.used_point || 0)}원`}
              />
              <Info
                label="쿠폰 할인"
                value={`${formatPrice(order.coupon_discount || 0)}원`}
              />
            </CardBlock>

            <h3 style={sectionTitleStyle}>구매 항목</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={th}>일정명</th>
                    <th style={th}>상품군</th>
                    <th style={th}>기간</th>
                    <th style={th}>수량</th>
                    <th style={th}>단가</th>
                    <th style={th}>할인가</th>
                    <th style={th}>소계</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={td}>{item.title}</td>
                      <td style={td}>{item.type}</td>
                      <td style={td}>
                        {item.start_date} ~ {item.end_date}
                      </td>
                      <td style={td}>{item.quantity}</td>
                      <td style={td}>{formatPrice(item.unit_price)}</td>
                      <td style={td}>{formatPrice(item.discount_price)}</td>
                      <td style={td}>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <CardBlock title="메모">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="메모를 입력하세요."
            style={textareaStyle}
          />

          <div style={buttonGroupStyle}>
            <button
              onClick={handleSaveMemo}
              disabled={saving}
              style={primaryButton}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button onClick={onClose} style={grayButton}>
              닫기
            </button>
          </div>
        </CardBlock>
      </div>
    </div>
  );
}

// ✅ 서브 컴포넌트
function Info({ label, value }) {
  return (
    <p style={{ marginBottom: 6, fontSize: 15, lineHeight: 1.6 }}>
      <strong style={{ display: "inline-block", width: 90 }}>{label}:</strong>{" "}
      {value}
    </p>
  );
}

// ✅ 스타일들
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 1000,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
};

const contentStyle = {
  background: "#fff",
  padding: "32px",
  borderRadius: "12px",
  maxWidth: "560px", // ✅ 더 좁게
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
  fontFamily: "'Apple SD Gothic Neo', sans-serif",
  textAlign: "left", // ✅ 좌측 정렬
};

const closeButtonStyle = {
  position: "absolute",
  top: 12,
  right: 16,
  background: "none",
  border: "none",
  fontSize: 28,
  fontWeight: "bold",
  color: "#666",
  cursor: "pointer",
};

const titleStyle = {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 20,
};

const sectionTitleStyle = {
  fontSize: 17,
  fontWeight: "bold",
  marginTop: 28,
  marginBottom: 14,
};

const infoGroupStyle = {
  marginBottom: 12,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  minWidth: "100%", // ✅ mobile overflow 고려
  marginBottom: 24,
};

const th = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  backgroundColor: "#f9f9f9",
  fontWeight: "bold",
  textAlign: "center",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
  color: "#333",
};

const textareaStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  marginBottom: "16px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: 14,
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

const buttonGroupStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
};

const primaryButton = {
  padding: "8px 16px",
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};

const grayButton = {
  padding: "8px 16px",
  backgroundColor: "#ccc",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};
function CardBlock({ title, children }) {
  return (
    <div style={cardBlockStyle}>
      {title && <h3 style={cardBlockTitle}>{title}</h3>}
      {children}
    </div>
  );
}

const cardBlockStyle = {
  backgroundColor: "#fafafa",
  padding: "16px 20px",
  borderRadius: "12px",
  marginBottom: "20px",
  border: "1px solid #eee",
};

const cardBlockTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  marginBottom: "12px",
};
