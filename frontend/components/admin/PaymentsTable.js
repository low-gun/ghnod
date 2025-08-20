// frontend/components/admin/PaymentsTable.js
import { useState, useMemo, useEffect } from "react";
import api from "@/lib/api";
import PaymentDetailModal from "./PaymentDetailModal";
import { formatPrice } from "@/lib/format";
import "react-datepicker/dist/react-datepicker.css";
import PaginationControls from "@/components/common/PaginationControls";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import StatusBadge from "@/components/common/StatusBadge";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";

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
  const handleRefund = (orderId) => {
    showAlert(`환불 처리 기능은 미구현 상태입니다.\n환불 대상: ${orderId}`);
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

  // 페이징 계산
  const totalPages = useMemo(
    () => Math.ceil(totalCount / itemsPerPage),
    [totalCount, itemsPerPage]
  );
  const pagedPayments = payments;

  // 체크박스
  const isAllChecked =
    pagedPayments.length > 0 &&
    pagedPayments.every(
      (p) =>
        (p.payment_id ?? p.id) && selectedIds.includes(p.payment_id ?? p.id)
    );
  const toggleAll = (checked) =>
    setSelectedIds(
      checked ? pagedPayments.map((p) => p.payment_id ?? p.id) : []
    );
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  // 데이터 호출
  const fetchPayments = async () => {
    setIsFetching(true);
    try {
      // (fetchPayments 내부)
      const baseParams = {
        page: currentPage,
        pageSize: itemsPerPage,
        sort: sortConfig.key,
        order: sortConfig.direction,
        // 기존 스펙
        type: externalSearchType,
        search: externalSearchQuery,
      };

      // 백엔드 호환 스펙(동시 전송)
      const compatParams = {
        field: externalSearchType, // e.g. "username" | "payment_method" | "created_at"
        keyword: externalSearchQuery, // e.g. "박현준" | "card" | "2025-08-01|2025-08-18"
      };

      // 날짜 검색이면 start_date / end_date도 전송
      const rangeParams = {};
      if (
        externalSearchType === "created_at" &&
        typeof externalSearchQuery === "string"
      ) {
        const [start, end] = externalSearchQuery.split("|");
        if (start) rangeParams.start_date = start; // "YYYY-MM-DD"
        if (end) rangeParams.end_date = end; // "YYYY-MM-DD"
      }

      const params = { ...baseParams, ...compatParams, ...rangeParams };
      console.log("🔎[PaymentsTable] fetch params:", JSON.stringify(params));

      const res = await api.get("admin/payments", { params });

      console.log(
        "✅[PaymentsTable] result:",
        JSON.stringify({
          success: res?.data?.success,
          totalCount: res?.data?.totalCount,
          received: Array.isArray(res?.data?.payments)
            ? res.data.payments.length
            : 0,
        })
      );

      if (res.data?.success) {
        setPayments(res.data.payments || []);
        setTotalCount(res.data.totalCount || 0);

        // 상단 카드 동기화
        if (typeof onLoaded === "function") {
          onLoaded({
            totalCount: res.data.totalCount ?? 0,
            totalAmount: res.data.totalAmount ?? 0,
          });
        }

        // 엑셀
        if (typeof onExcelData === "function") {
          onExcelData({
            headers: [
              "주문번호",
              "사용자",
              "수량",
              "결제금액",
              "할인적용",
              "결제수단",
              "결제일시",
              "상태",
              "정합성", // ✅ 추가
            ],
            data: (res.data.payments || []).map((p) => ({
              주문번호: `pay-${p.payment_id ?? p.id}`,
              사용자: p.username || "",
              수량: p.total_quantity ?? 0,
              결제금액: p.amount ?? 0,
              할인적용: getDiscountParts(p).total,
              결제수단: getMethodLabel(p),
              결제일시: formatDateLocal(p.created_at),
              상태: getStatusLabel(p),
              정합성: getIntegrityStatus(p), // ✅ 추가
            })),
          });
        }
      }
    } catch (err) {
      console.error("❌ 결제내역 조회 오류:", err?.response?.data ?? err);
    } finally {
      setIsFetching(false);
    }
  };

  // ✅ 외부 툴바 전용: 버튼 클릭 시 올려준 searchSyncKey 변화에만 반응
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, sortConfig, searchSyncKey]);

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
              const { coupon, point, total } = getDiscountParts(p);
              const statusKey = getStatusKey(p);
              const statusLabel = getStatusLabel(p);
              const canRefund = statusKey === "paid";
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
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
                        total > 0
                          ? `쿠폰할인 ${formatPrice(coupon)}원\n포인트 ${formatPrice(point)}원`
                          : ""
                      }
                      onClick={() =>
                        setOpenDiscountId((prev) => (prev === id ? null : id))
                      }
                    >
                      {total > 0 ? `-${formatPrice(total)}원` : "미적용"}
                    </span>
                  </div>

                  {/* 클릭 시에만 분해 내역 노출 */}
                  {openDiscountId === id && total > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        textAlign: "right",
                        color: "#555",
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      {coupon > 0 && (
                        <div>쿠폰할인 {formatPrice(coupon)}원</div>
                      )}
                      {point > 0 && <div>포인트 {formatPrice(point)}원</div>}
                    </div>
                  )}

                  <div style={cardRow}>
                    <span style={cardLabel}>수량</span>
                    <span
                      style={{
                        ...cardValue,
                        ...(getIntegrityStatus(p) !== "OK"
                          ? { color: "#b91c1c", fontWeight: 600 } // 빨간 강조
                          : {}),
                      }}
                      title={
                        getIntegrityStatus(p) !== "OK"
                          ? getIntegrityStatus(p) === "NO_ORDER"
                            ? "결제는 있으나 연결된 주문 없음 (NO_ORDER)"
                            : "주문은 있으나 아이템 없음 (NO_ITEMS)"
                          : ""
                      }
                    >
                      {p.total_quantity ?? 0}개
                      {getIntegrityStatus(p) !== "OK" && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>
                          ({getIntegrityStatus(p)})
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
                    <span style={cardValue}>{getMethodLabel(p)}</span>
                  </div>
                  <div style={cardRow}>
                    <span style={cardLabel}>결제일시</span>
                    <span style={cardValue}>
                      {formatDateLocal(p.created_at)}
                    </span>
                  </div>

                  <div style={cardRow}>
                    <span style={cardLabel}>상태</span>
                    <span style={cardValue}>
                      <StatusBadge status={statusKey}>
                        {statusLabel}
                      </StatusBadge>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => setModalPaymentId(id)}
                      style={primaryBtn}
                    >
                      상세
                    </button>
                    {canRefund && (
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

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        // 데스크톱
        <>
          <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
            <table
              className="admin-table"
              style={{ tableLayout: "fixed", width: "100%" }} // ✅ 고정 레이아웃
            >
              <thead style={{ backgroundColor: "#f9f9f9" }}>
                <tr>
                  <th className="admin-th" style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "100px" }}
                    onClick={() => handleSort("payment_id")}
                  >
                    주문번호
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "160px" }}
                    onClick={() => handleSort("username")}
                  >
                    사용자
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "80px" }}
                    onClick={() => handleSort("total_quantity")}
                  >
                    수량
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "120px" }}
                    onClick={() => handleSort("amount")}
                  >
                    결제금액
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "120px" }}
                    onClick={() => handleSort("discount_total")}
                  >
                    할인적용
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "100px" }}
                    onClick={() => handleSort("payment_method")}
                  >
                    결제수단
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "160px" }}
                    onClick={() => handleSort("created_at")}
                  >
                    결제일시
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "100px" }}
                    onClick={() => handleSort("status")}
                  >
                    상태
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagedPayments.map((p, idx) => {
                  const id = p.payment_id ?? p.id;
                  const { coupon, point, total } = getDiscountParts(p);
                  const statusKey = getStatusKey(p);
                  const statusLabel = getStatusLabel(p);
                  const canRefund = statusKey === "paid";
                  return (
                    <tr
                      key={id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td className="admin-td">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={(e) => toggleOne(id, e.target.checked)}
                        />
                      </td>
                      <td className="admin-td">#{id}</td>
                      <td className="admin-td">
                        {p.username || "-"}
                        <br />
                        <span style={{ fontSize: 13, color: "#888" }}>
                          {p.email || "-"}
                        </span>
                      </td>
                      <td className="admin-td">
                        <span
                          style={{
                            ...(getIntegrityStatus(p) !== "OK"
                              ? { color: "#b91c1c", fontWeight: 600 }
                              : {}),
                          }}
                          title={
                            getIntegrityStatus(p) !== "OK"
                              ? getIntegrityStatus(p) === "NO_ORDER"
                                ? "결제는 있으나 연결된 주문 없음 (NO_ORDER)"
                                : "주문은 있으나 아이템 없음 (NO_ITEMS)"
                              : ""
                          }
                        >
                          {p.total_quantity ?? 0}개
                          {getIntegrityStatus(p) !== "OK" && (
                            <span style={{ marginLeft: 6, fontSize: 12 }}>
                              ({getIntegrityStatus(p)})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="admin-td">{formatPrice(p.amount)}원</td>
                      <td className="admin-td">
                        <div
                          title={
                            total > 0
                              ? `쿠폰할인 ${formatPrice(coupon)}원\n포인트 ${formatPrice(point)}원`
                              : ""
                          }
                          onClick={() =>
                            setOpenDiscountId((prev) =>
                              prev === id ? null : id
                            )
                          }
                          style={{ cursor: total > 0 ? "pointer" : "default" }}
                        >
                          {total > 0 ? `-${formatPrice(total)}원` : "미적용"}
                        </div>

                        {openDiscountId === id && total > 0 && (
                          <div
                            style={{
                              marginTop: 6,
                              color: "#555",
                              fontSize: 13,
                              lineHeight: 1.4,
                            }}
                          >
                            {coupon > 0 && (
                              <div>쿠폰할인 {formatPrice(coupon)}원</div>
                            )}
                            {point > 0 && (
                              <div>포인트 {formatPrice(point)}원</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="admin-td">{getMethodLabel(p)}</td>
                      <td className="admin-td">
                        {formatDateLocal(p.created_at)}
                      </td>

                      <td className="admin-td">
                        <StatusBadge status={statusKey}>
                          {statusLabel}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

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
