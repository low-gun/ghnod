import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useGlobalAlert } from "@/stores/globalAlert";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";

// 날짜 범위 포맷
function formatDateRange(start, end) {
  if (!start && !end) return "일정 미정";
  const dayKo = ["일", "월", "화", "수", "목", "금", "토"];

  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  const fmt = (d, opts = { year: true }) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    const wk = dayKo[d.getDay()];
    return `${opts.year ? `${y}. ` : ""}${m}. ${dd}. (${wk})`;
  };

  if (!e) return fmt(s, { year: true });
  const sameYear = s && e && s.getFullYear() === e.getFullYear();
  const left = fmt(s, { year: true });
  const right = fmt(e, { year: !sameYear });
  return `${left} ~ ${right}`;
}

// 상태 배지
const statusBadge = (status) => {
  const map = {
    paid: { text: "결제완료", bg: "#ECFDF5", color: "#065F46", brd: "#A7F3D0" },
    cancelled: { text: "취소됨", bg: "#FEF2F2", color: "#991B1B", brd: "#FECACA" },
    refund: { text: "환불진행", bg: "#FFF7ED", color: "#9A3412", brd: "#FED7AA" },
    pending: { text: "대기중", bg: "#EEF2FF", color: "#3730A3", brd: "#C7D2FE" },
  };
  const b = map[status] || { text: status || "-", bg: "#F3F4F6", color: "#374151", brd: "#E5E7EB" };
  return (
    <span
      style={{
        background: b.bg,
        color: b.color,
        border: `1px solid ${b.brd}`,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {b.text}
    </span>
  );
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    if (!router.isReady || !id) return;
    (async () => {
      try {
        const res = await api.get(`/orders/${id}/items`);
        setItems(res.data.items || []);
        setOrder(res.data.order || null);
      } catch (err) {
        console.error("❌ 주문 항목 조회 실패:", err);
        showAlert?.("주문 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, id]);

  const itemsSum = useMemo(() => {
    return items.reduce((sum, it) => {
      const unit =
        typeof it.subtotal === "number"
          ? it.subtotal
          : (it.discount_price ?? it.unit_price) * (it.quantity || 0);
      return sum + (Number(unit) || 0);
    }, 0);
  }, [items]);

  const coupon = Number(order?.coupon_discount || 0);
  const usedPoint = Number(order?.used_point || 0);
  const payAmount = Math.max(0, itemsSum - coupon - usedPoint);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(String(id));
      showAlert?.("주문번호가 복사되었습니다.");
    } catch {
      showAlert?.("복사에 실패했습니다.");
    }
  };

  if (loading) return <p style={{ padding: 40 }}>불러오는 중...</p>;
  if (!items.length) return <p style={{ padding: 40 }}>주문 내역이 없습니다.</p>;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: 24 }}>
      {/* 헤더 라인 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#111827" }}>
            주문 #{id}
          </span>
          {order?.order_status ? statusBadge(order.order_status) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={copyOrderId}
            style={{
              background: "#F3F4F6",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 13,
              cursor: "pointer",
            }}
            aria-label="주문번호 복사"
          >
            주문번호 복사
          </button>
        </div>
      </div>

     {/* 좌측/우측 카드 영역 */}
{order && (
  <>
    <div className="summary-grid">
      {/* 좌측 카드 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: 16,
          background: "#FFFFFF",
        }}
      >
        <MetaRow
          label="주문일시"
          value={
            order.created_at
              ? new Date(order.created_at).toLocaleString("ko-KR")
              : "-"
          }
        />
        <MetaRow
          label="결제수단"
          value={formatPayMethod(order.payment_method)}
        />
        <MetaRow
          label="총 결제금액"
          value={
            <span style={{ color: "#0070f3", fontWeight: 600 }}>
              {formatPrice(payAmount)}원
            </span>
          }
        />
      </div>

      {/* 우측 카드 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: 16,
          background: "#FFFFFF",
        }}
      >
        <PriceRow label="상품합계" value={`${formatPrice(itemsSum)}원`} />
        <PriceRow
          label="쿠폰할인"
          value={
            coupon > 0
              ? `-${formatPrice(coupon)}원`
              : `${formatPrice(coupon)}원`
          }
          dim
        />
        <PriceRow
          label="포인트사용"
          value={
            usedPoint > 0
              ? `-${formatPrice(usedPoint)}P`
              : `${formatPrice(usedPoint)}P`
          }
          dim
        />
        <hr
          style={{ border: 0, borderTop: "1px solid #EEE", margin: "12px 0" }}
        />
        <PriceRow
          label="결제금액"
          value={`${formatPrice(payAmount)}원`}
          highlight
        />
      </div>
    </div>

    <style jsx>{`
      .summary-grid {
        display: grid;
        gap: 16px;
        margin-bottom: 20px;
        grid-template-columns: 1fr; /* 모바일: 한 줄 */
      }
      @media (min-width: 768px) {
        .summary-grid {
          grid-template-columns: 1fr 1fr; /* 태블릿 이상: 두 칸 */
        }
      }
    `}</style>
  </>
)}


   {/* 상품 카드 리스트 - ScheduleCardGrid 재사용 */}
<ScheduleCardGrid
  schedules={items}
  type="order"
  hideEndMessage
  hideBadge
  showDetailButton
/>

    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <span style={{ color: "#6B7280", fontSize: 13 }}>{label}</span>
      <span style={{ color: "#111827", fontSize: 14 }}>{value}</span>
    </div>
  );
}

function PriceRow({ label, value, highlight, dim }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: 8,
        alignItems: "center",
        margin: "4px 0",
      }}
    >
      <div style={{ color: dim ? "#9CA3AF" : "#6B7280", fontSize: 13 }}>
        {label}
      </div>
      <div
        style={{
          color: highlight ? "#0070f3" : "#111827",
          fontSize: highlight ? 18 : 14,
          fontWeight: highlight ? 600 : 400,
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatPayMethod(method) {
  if (!method) return "";
  const map = {
    card: "카드결제",
    toss: "토스결제",
    vbank: "가상계좌",
    transfer: "계좌이체",
  };
  return map[method] || method;
}
