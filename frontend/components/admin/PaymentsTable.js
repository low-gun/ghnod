// frontend/components/admin/PaymentsTable.js
import { useState, useMemo, useEffect, useRef } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
const PaymentDetailModal = dynamic(() => import("./PaymentDetailModal"), { ssr: false });
import { formatPrice } from "@/lib/format";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import StatusBadge from "@/components/common/StatusBadge";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import VirtualizedTable from "@/components/common/VirtualizedTable"; // ✅ 추가

/** 로컬시간 포맷 (YYYY-MM-DD HH:mm:ss) */
function formatDateLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/* ----------------------------- */
/*        상태/결제수단 정규화     */
/* ----------------------------- */
const STATUS_LABEL_MAP = {
  paid: "결제완료",
  refunded: "환불완료",
  failed: "결제실패",
  pending: "결제대기",
};
const METHOD_LABEL_MAP = {
  card: "카드",
  transfer: "계좌이체",
  vbank: "가상계좌",
};

function getStatusRaw(row) {
  return (
    row?.status ??
    row?.payment_status ??
    row?.paymentStatus ??
    row?.order_status ??
    row?.orderStatus ??
    row?.pg_status ??
    row?.pgStatus ??
    row?.toss_status ??
    row?.tossStatus ??
    row?.status_text ??
    row?.statusText ??
    row?.status_label ??
    row?.statusLabel ??
    row?.state ??
    row?.order_state ??
    ""
  );
}
function toStatusKeyFromString(raw) {
  const s = (raw ?? "").toString().toLowerCase();
  if (["paid", "refunded", "failed", "pending"].includes(s)) return s;
  if (s.includes("환불") || s.includes("cancel")) return "refunded";
  if (
    s.includes("실패") ||
    s.includes("거절") ||
    s.includes("fail") ||
    s.includes("error")
  )
    return "failed";
  if (
    s.includes("대기") ||
    s.includes("pending") ||
    s.includes("ready") ||
    s.includes("waiting")
  )
    return "pending";
  if (
    s.includes("완료") ||
    s.includes("성공") ||
    s.includes("승인") ||
    s.includes("paid") ||
    s.includes("done")
  )
    return "paid";
  return "";
}
function inferStatusKey(row) {
  const text = JSON.stringify(row ?? {}).toLowerCase();
  if (text.includes("refund") || text.includes("cancel")) return "refunded";
  if (text.includes("fail") || text.includes("error") || text.includes("deny"))
    return "failed";
  if (
    row?.approved_at ||
    row?.paid_at ||
    text.includes("approve") ||
    text.includes("paid")
  )
    return "paid";
  if (
    row?.requested_at ||
    row?.ready_at ||
    text.includes("ready") ||
    text.includes("pending")
  )
    return "pending";
  return "";
}
function getStatusKey(row) {
  return toStatusKeyFromString(getStatusRaw(row)) || inferStatusKey(row) || "";
}
function getStatusLabel(row) {
  const raw = getStatusRaw(row);
  const key = getStatusKey(row);
  if (key) return STATUS_LABEL_MAP[key];
  return raw || "-";
}

function getMethodRaw(row) {
  return (
    row?.payment_method ??
    row?.method ??
    row?.pay_method ??
    row?.payMethod ??
    ""
  );
}
function toMethodKey(raw) {
  const m = (raw ?? "").toString().toLowerCase();
  if (["card", "transfer", "vbank"].includes(m)) return m;
  if (m.includes("카드")) return "card";
  if (m.includes("계좌")) return "transfer";
  if (m.includes("가상") || m.includes("virtual")) return "vbank";
  return "";
}
function getMethodLabel(row) {
  const key = toMethodKey(getMethodRaw(row));
  return (key && METHOD_LABEL_MAP[key]) || getMethodRaw(row) || "-";
}

/** 숫자 변환 유틸 */
function toNumberOr0(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** 할인 분해 (쿠폰/포인트/합계) */
function getDiscountParts(row) {
  const coupon = toNumberOr0(row?.coupon_discount);
  const point = toNumberOr0(row?.used_point);
  return { coupon, point, total: coupon + point };
}

/** 정합성 판별: 금액>0 이고 수량=0 이면 비정상
 * - order_id가 없으면 NO_ORDER
 * - order_id가 있으면 NO_ITEMS
 * - 그 외 OK
 */
function getIntegrityStatus(row) {
  const qty = toNumberOr0(row?.total_quantity);
  const amt = toNumberOr0(row?.amount);
  if (amt > 0 && qty === 0) {
    return row?.order_id ? "NO_ITEMS" : "NO_ORDER";
  }
  return "OK";
}

/* ----------------------------- */

export default function PaymentsTable({
  // ✅ 외부 툴바 전용: 아래 세 개만 쓰면 됩니다.
  externalSearchType,
  externalSearchQuery,
  searchSyncKey,
  // 부가 콜백
  onExcelData,
  onLoaded,
  // 과거 호환성: 전달돼도 사용 안 함
  useExternalToolbar,
}) {
  const { showAlert } = useGlobalAlert();
  const isTabletOrBelow = useIsTabletOrBelow();

  // 서버 데이터/상태
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // SSR 하이드레이션 안전
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 정렬/페이지네이션
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 선택/모달
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalPaymentId, setModalPaymentId] = useState(null);
  /** 할인 상세 토글 상태 */
  const [openDiscountId, setOpenDiscountId] = useState(null);

  // 환불 (샘플)
  // 환불 (API 연동)
const handleRefund = async (orderId) => {
  if (!orderId) return showAlert("유효하지 않은 주문 ID입니다.");
  if (!confirm("정말 환불 처리하시겠습니까?")) return;

  try {
    const res = await api.post(`/admin/orders/${orderId}/refund`, {
      reason: "관리자 환불 처리",
    });
    if (res.data?.success) {
      showAlert(`환불 완료 (환불액: ${res.data.refundAmount}원)`);
      fetchPayments(); // 목록 새로고침
    } else {
      showAlert(res.data?.message || "환불 실패");
    }
  } catch (err) {
    console.error("❌ 환불 처리 오류:", err);
    showAlert("환불 처리 중 오류가 발생했습니다.");
  }
};


  // 정렬 클릭
  const handleSort = (key) => {
    setSortConfig((prev) =>
      !prev || prev.key !== key
        ? { key, direction: "asc" }
        : { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    );
    setCurrentPage(1);
  };

    // ① 계산 캐싱: 렌더링에서 반복 호출되는 계산을 한 번만 수행
  const processedPayments = useMemo(() => {
    return payments.map((p) => {
      const { coupon, point, total } = getDiscountParts(p);
      const statusKey = getStatusKey(p);
      return {
        ...p,
        coupon,
        point,
        discountTotal: total,
        statusKey,
        statusLabel: getStatusLabel(p),
        integrity: getIntegrityStatus(p),
        methodLabel: getMethodLabel(p),
        canRefund: statusKey === "paid",
      };
    });
  }, [payments]);

  // ② 렌더에서 사용할 현재 페이지 데이터 (서버 페이징이므로 그대로 사용)
  const pagedPayments = processedPayments;

  // 체크박스
  const isAllChecked =
    pagedPayments.length > 0 &&
    pagedPayments.every((p) => {
      const id = p.payment_id ?? p.id;
      return id && selectedIds.includes(id);
    });
  const toggleAll = (checked) =>
    setSelectedIds(checked ? pagedPayments.map((p) => p.payment_id ?? p.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const fetchPayments = async (signal) => {
    setIsFetching(true);
    try {
      const baseParams = {
        page: currentPage,
        pageSize: itemsPerPage,
        sort: sortConfig.key,
        order: sortConfig.direction,
        type: externalSearchType,
        search: externalSearchQuery,
      };
  
      const compatParams = { field: externalSearchType, keyword: externalSearchQuery };
  
      const rangeParams = {};
      if (externalSearchType === "created_at" && typeof externalSearchQuery === "string") {
        const [start, end] = externalSearchQuery.split("|");
        if (start) rangeParams.start_date = start;
        if (end) rangeParams.end_date = end;
      }
  
      const params = { ...baseParams, ...compatParams, ...rangeParams };
      
      const res = await api.get("admin/payments", { params, signal });

    if (res.data?.success) {
      const list = res.data.payments || [];
      setPayments(list);
      setTotalCount(res.data.totalCount || 0);

      onLoaded?.({
        totalCount: res.data.totalCount ?? 0,
        totalAmount: res.data.totalAmount ?? 0,
      });

      if (typeof onExcelData === "function") {
        const processedRows = list.map((p) => {
          const { coupon, point, total } = getDiscountParts(p);
          const statusKey = getStatusKey(p);
          return {
            ...p,
            coupon,
            point,
            discountTotal: total,
            statusLabel: getStatusLabel(p),
            integrity: getIntegrityStatus(p),
            methodLabel: getMethodLabel(p),
            canRefund: statusKey === "paid",
          };
        });

        onExcelData({
          headers: [
            "주문번호","사용자","수량","결제금액","할인적용",
            "결제수단","결제일시","상태","정합성",
          ],
          data: processedRows.map((p) => ({
            주문번호: `pay-${p.payment_id ?? p.id}`,
            사용자: p.username || "",
            수량: p.total_quantity ?? 0,
            결제금액: p.amount ?? 0,
            할인적용: p.discountTotal,
            결제수단: p.methodLabel,
            결제일시: formatDateLocal(p.created_at),
            상태: p.statusLabel,
            정합성: p.integrity,
          })),
        });
      }
    }
  } catch (err) {
    if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
      console.error("❌ 결제내역 조회 오류:", err?.response?.data ?? err);
    }
  } finally {
    setIsFetching(false);
  }
};
  
  // ✅ 외부 툴바 전용: 버튼 클릭 시 올려준 searchSyncKey 변화에만 반응
  useEffect(() => {
    if (!mounted) return; // ✅ 하이드레이션 완료 후에만 호출

    const controller = new AbortController();
    fetchPayments(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentPage, itemsPerPage, sortConfig, searchSyncKey]);

  return (
    <div>
      {/* 본문 */}
      {isFetching ? (
        mounted && isTabletOrBelow ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={3} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={10} rows={6} />
        )
      ) : payments.length === 0 ? (
        <div
          style={{
            border: "1px dashed #d0d7de",
            background: "#fafbfc",
            color: "#57606a",
            padding: "18px 16px",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          결제 내역이 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
        </div>
      ) : mounted && isTabletOrBelow ? (
        // 모바일/태블릿
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {pagedPayments.map((p) => {
              const id = p.payment_id ?? p.id;
              return (
                <div
                  key={id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 12,
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={(e) => toggleOne(id, e.target.checked)}
                    />
                    <div style={{ fontSize: 13, color: "#666" }}>#{id}</div>
                  </div>

                  <div style={cardRow}>
                    <span style={cardLabel}>할인적용</span>
                    <span
                      style={cardValue}
                      title={
                        p.discountTotal > 0
                          ? `쿠폰할인 ${formatPrice(p.coupon)}원\n포인트 ${formatPrice(p.point)}원`
                          : ""
                      }
                      onClick={() =>
                        setOpenDiscountId((prev) => (prev === id ? null : id))
                      }
                    >
                      {p.discountTotal > 0
                        ? `-${formatPrice(p.discountTotal)}원`
                        : "미적용"}
                    </span>
                  </div>

                  {/* 클릭 시에만 분해 내역 노출 */}
                  {openDiscountId === id && p.discountTotal > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        textAlign: "right",
                        color: "#555",
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      {p.coupon > 0 && <div>쿠폰할인 {formatPrice(p.coupon)}원</div>}
                      {p.point > 0 && <div>포인트 {formatPrice(p.point)}원</div>}
                    </div>
                  )}

                  <div style={cardRow}>
                    <span style={cardLabel}>수량</span>
                    <span
                      style={{
                        ...cardValue,
                        ...(p.integrity !== "OK"
                          ? { color: "#b91c1c", fontWeight: 600 }
                          : {}),
                      }}
                      title={
                        p.integrity !== "OK"
                          ? p.integrity === "NO_ORDER"
                            ? "결제는 있으나 연결된 주문 없음 (NO_ORDER)"
                            : "주문은 있으나 아이템 없음 (NO_ITEMS)"
                          : ""
                      }
                    >
                      {p.total_quantity ?? 0}개
                      {p.integrity !== "OK" && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>
                          ({p.integrity})
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={cardRow}>
                    <span style={cardLabel}>결제금액</span>
                    <span style={cardValue}>{formatPrice(p.amount)}원</span>
                  </div>

                  <div style={cardRow}>
                    <span style={cardLabel}>결제수단</span>
                    <span style={cardValue}>{p.methodLabel}</span>
                  </div>
                  <div style={cardRow}>
                    <span style={cardLabel}>결제일시</span>
                    <span style={cardValue}>{formatDateLocal(p.created_at)}</span>
                  </div>

                  <div style={cardRow}>
                    <span style={cardLabel}>상태</span>
                    <span style={cardValue}>
                      <StatusBadge status={p.statusKey}>{p.statusLabel}</StatusBadge>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setModalPaymentId(id)} style={primaryBtn}>
                      상세
                    </button>
                    {p.canRefund && (
                      <button
                        onClick={() => handleRefund(p.order_id)}
                        style={dangerBtn}
                      >
                        환불
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
                 </>
      ) : (
        // 데스크톱
        <>
          <VirtualizedTable
            tableClassName="admin-table"
            height={560}           // 필요 시 조정
            rowHeight={56}         // 내용 높이에 맞게
            resetKey={`${currentPage}|${itemsPerPage}|${sortConfig.key}|${sortConfig.direction}|${searchSyncKey}`}
            columns={[
              {
                key: "sel",
                title: (
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                ),
                width: 40,
              },
              { key: "payment_id", title: "주문번호", width: 100, onClickHeader: () => handleSort("payment_id") },
              { key: "username",   title: "사용자",   width: 160, onClickHeader: () => handleSort("username") },
              { key: "qty",        title: "수량",     width: 80,  onClickHeader: () => handleSort("total_quantity") },
              { key: "amount",     title: "결제금액", width: 120, onClickHeader: () => handleSort("amount") },
              { key: "discount",   title: "할인적용", width: 120, onClickHeader: () => handleSort("discount_total") },
              { key: "method",     title: "결제수단", width: 100, onClickHeader: () => handleSort("payment_method") },
              { key: "created_at", title: "결제일시", width: 160, onClickHeader: () => handleSort("created_at") },
              { key: "status",     title: "상태",     width: 100, onClickHeader: () => handleSort("status") },
{ key: "actions",    title: "환불",     width: 120 },            ]}
            items={pagedPayments}
            renderRowCells={({ item: p, index: idx }) => {
              const id = p.payment_id ?? p.id;
              return (
                <>
                  <td className="admin-td" style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={(e) => toggleOne(id, e.target.checked)}
                    />
                  </td>
                  <td
  className="admin-td"
  style={{ width: 100, color: "#0070f3", cursor: "pointer" }}
  onClick={() => setModalPaymentId(id)}
>
  #{id}
</td>
      
                  <td className="admin-td" style={{ width: 160 }}>
                    {p.username || "-"}
                    <br />
                    <span style={{ fontSize: 13, color: "#888" }}>
                      {p.email || "-"}
                    </span>
                  </td>
      
                  <td className="admin-td" style={{ width: 80 }}>
                    <span
                      style={{
                        ...(p.integrity !== "OK"
                          ? { color: "#b91c1c", fontWeight: 600 }
                          : {}),
                      }}
                      title={
                        p.integrity !== "OK"
                          ? p.integrity === "NO_ORDER"
                            ? "결제는 있으나 연결된 주문 없음 (NO_ORDER)"
                            : "주문은 있으나 아이템 없음 (NO_ITEMS)"
                          : ""
                      }
                    >
                      {p.total_quantity ?? 0}개
                      {p.integrity !== "OK" && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>
                          ({p.integrity})
                        </span>
                      )}
                    </span>
                  </td>
      
                  <td className="admin-td" style={{ width: 120 }}>
                    {formatPrice(p.amount)}원
                  </td>
      
                  <td className="admin-td" style={{ width: 120 }}>
                    <div
                      title={
                        p.discountTotal > 0
                          ? `쿠폰할인 ${formatPrice(p.coupon)}원\n포인트 ${formatPrice(p.point)}원`
                          : ""
                      }
                      onClick={() =>
                        setOpenDiscountId((prev) => (prev === id ? null : id))
                      }
                      style={{ cursor: p.discountTotal > 0 ? "pointer" : "default" }}
                    >
                      {p.discountTotal > 0
                        ? `-${formatPrice(p.discountTotal)}원`
                        : "미적용"}
                    </div>
      
                    {openDiscountId === id && p.discountTotal > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#555",
                          fontSize: 13,
                          lineHeight: 1.4,
                        }}
                      >
                        {p.coupon > 0 && (
                          <div>쿠폰할인 {formatPrice(p.coupon)}원</div>
                        )}
                        {p.point > 0 && (
                          <div>포인트 {formatPrice(p.point)}원</div>
                        )}
                      </div>
                    )}
                  </td>
      
                  <td className="admin-td" style={{ width: 100 }}>
                    {p.methodLabel}
                  </td>
      
                  <td className="admin-td" style={{ width: 160 }}>
                    {formatDateLocal(p.created_at)}
                  </td>
      
                  <td className="admin-td" style={{ width: 100 }}>
  <StatusBadge status={p.statusKey}>{p.statusLabel}</StatusBadge>
</td>

<td className="admin-td" style={{ width: 120 }}>
  {p.canRefund && (
    <button
      onClick={() => handleRefund(p.order_id)}
      style={dangerBtn}
    >
      환불
    </button>
  )}
</td>

                </>
              );
            }}
          />
        </>
      )
      }

      {modalPaymentId && (
        <PaymentDetailModal
          paymentId={modalPaymentId}
          onClose={() => setModalPaymentId(null)}
        />
      )}
    </div>
  );
}

/* 스타일 */

const primaryBtn = {
  padding: "4px 8px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  cursor: "pointer",
};
const dangerBtn = {
  padding: "4px 8px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  cursor: "pointer",
};

const cardRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "6px 0",
  borderBottom: "1px dashed #f0f0f0",
};
const cardLabel = { color: "#888", fontSize: 13, minWidth: 80 };
const cardValue = { color: "#222", fontSize: 14, textAlign: "right" };
