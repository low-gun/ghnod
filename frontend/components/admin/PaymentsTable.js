import { useState, useMemo } from "react";
import PaymentDetailModal from "./PaymentDetailModal";
import { formatPrice } from "@/lib/format";
import "react-datepicker/dist/react-datepicker.css";
import SearchFilter from "@/components/common/SearchFilter";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";

export default function PaymentsTable({ payments = [] }) {
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalPaymentId, setModalPaymentId] = useState(null);

  // 환불 처리 (구현체에 맞게 연결)
  const handleRefund = (orderId) => {
    // 환불 로직 구현 필요(예: 환불 모달 등)
    alert(`환불 처리 기능은 미구현 상태입니다.\n환불 대상: ${orderId}`);
  };

  // 검색/정렬 리셋
  const handleReset = () => {
    setSearchType("all");
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // 정렬
  const handleSort = (key) => {
    setSortConfig((prev) =>
      !prev || prev.key !== key
        ? { key, direction: "asc" }
        : { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    );
    setCurrentPage(1);
  };

  // 필터링 useMemo
  const filteredPayments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return payments.filter((p) => {
      if (searchType === "created_at" || searchType === "updated_at") {
        const date = new Date(p[searchType]);
        const startOnly = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const endOnly = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        if (startOnly && endOnly) return date >= startOnly && date <= endOnly;
        if (startOnly) return date >= startOnly;
        if (endOnly) return date <= endOnly;
        return true;
      }
      if (searchType === "all") {
        return (
          p.payment_id?.toString().includes(query) ||
          p.username?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.status?.toLowerCase().includes(query) ||
          p.payment_method?.toLowerCase().includes(query) ||
          p.amount?.toString().includes(query)
        );
      }
      if (searchType === "username") {
        return (
          p.username?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
        );
      }
      if (searchType === "status") {
        if (!searchQuery) return true;
        return p.status === searchQuery;
      }
      return p[searchType]?.toString().toLowerCase().includes(query);
    });
  }, [searchQuery, searchType, startDate, endDate, payments]);

  // 정렬 useMemo
  const sortedPayments = useMemo(() => {
    if (!sortConfig) return filteredPayments;
    const { key, direction } = sortConfig;
    return [...filteredPayments].sort((a, b) => {
      const aVal = key === "discount_total"
        ? (a.used_point || 0) + (a.coupon_discount || 0)
        : a[key];
      const bVal = key === "discount_total"
        ? (b.used_point || 0) + (b.coupon_discount || 0)
        : b[key];
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredPayments, sortConfig]);

  // 페이징 useMemo
  const pagedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPayments.slice(start, start + itemsPerPage);
  }, [sortedPayments, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => Math.ceil(sortedPayments.length / itemsPerPage), [sortedPayments, itemsPerPage]);

  // 체크박스
  const isAllChecked = pagedPayments.length > 0 && pagedPayments.every((p) => selectedIds.includes(p.payment_id || p.id));
  const toggleAll = (checked) => setSelectedIds(checked ? pagedPayments.map((p) => p.payment_id || p.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((item) => item !== id));

  // 상태 뱃지
  const renderStatusBadge = (status) => {
    const dict = { paid: "결제완료", refunded: "환불완료", failed: "결제실패" };
    const colors = { 결제완료: "#10b981", 환불완료: "#3b82f6", 결제실패: "#ef4444" };
    const label = dict[status] || status;
    return (
      <span
        style={{
          backgroundColor: colors[label] || "#ccc",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
        }}
      >
        {label}
      </span>
    );
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // 정렬 화살표
  const renderArrow = (key) => {
    const baseStyle = { marginLeft: "6px", fontSize: "12px" };
    if (!sortConfig || key !== sortConfig.key)
      return <span style={{ ...baseStyle, color: "#ccc" }}>↕</span>;
    return (
      <span style={{ ...baseStyle, color: "#000" }}>
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div style={{ flex: 1, display: "flex", gap: "10px" }}>
          <SearchFilter
            searchType={searchType}
            setSearchType={setSearchType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            searchOptions={[
              { value: "payment_id", label: "주문번호", type: "text" },
              { value: "username", label: "사용자", type: "text" },
              { value: "total_quantity", label: "수강인원", type: "text" },
              { value: "amount", label: "결제금액", type: "text" },
              { value: "discount_total", label: "할인적용", type: "text" },
              {
                value: "payment_method",
                label: "결제수단",
                type: "select",
                options: [
                  { value: "카드", label: "카드" },
                  { value: "계좌이체", label: "계좌이체" },
                  { value: "가상계좌", label: "가상계좌" },
                ],
              },
              { value: "created_at", label: "결제일시", type: "date" },
              {
                value: "status",
                label: "상태",
                type: "select",
                options: [
                  { value: "완료", label: "결제완료" },
                  { value: "실패", label: "결제실패" },
                  { value: "환불", label: "환불완료" },
                ],
              },
            ]}
            onSearchUpdate={(type, query) => {
              setSearchType(type);
              setSearchQuery(query);
              setStartDate(null);
              setEndDate(null);
              setCurrentPage(1);
            }}
          />
          <button
            onClick={handleReset}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              fontWeight: "bold",
              backgroundColor: "#ccc",
              border: "none",
              height: "38px",
            }}
          >
            초기화
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PageSizeSelector
            value={itemsPerPage}
            onChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
          />
          <ExcelDownloadButton
            fileName="결제내역"
            sheetName="결제내역"
            headers={[
              "주문번호",
              "사용자",
              "수강인원",
              "결제금액",
              "할인적용",
              "결제수단",
              "결제일시",
              "상태",
            ]}
            data={sortedPayments.map((p) => ({
              주문번호: `pay-${p.payment_id || p.id}`,
              사용자: p.username,
              수강인원: p.total_quantity,
              결제금액: p.amount,
              할인적용: (p.used_point || 0) + (p.coupon_discount || 0),
              결제수단: p.payment_method,
              결제일시: formatDate(p.created_at),
              상태: p.status,
            }))}
          />
        </div>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}
      >
        <thead style={{ backgroundColor: "#f9f9f9" }}>
          <tr>
            <th style={thCenter}>
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={(e) => toggleAll(e.target.checked)}
              />
            </th>
            <th style={thCenter} onClick={() => handleSort("order_id")}>
              주문번호 {renderArrow("order_id")}
            </th>
            <th style={thCenter} onClick={() => handleSort("username")}>
              사용자 {renderArrow("username")}
            </th>
            <th style={thCenter} onClick={() => handleSort("total_quantity")}>
              수강인원 {renderArrow("total_quantity")}
            </th>
            <th style={thCenter} onClick={() => handleSort("amount")}>
              결제금액 {renderArrow("amount")}
            </th>
            <th style={thCenter} onClick={() => handleSort("discount_total")}>
              할인적용 {renderArrow("discount_total")}
            </th>
            <th style={thCenter} onClick={() => handleSort("payment_method")}>
              결제수단 {renderArrow("payment_method")}
            </th>
            <th style={thCenter} onClick={() => handleSort("created_at")}>
              결제일시 {renderArrow("created_at")}
            </th>
            <th style={thCenter} onClick={() => handleSort("status")}>
              상태 {renderArrow("status")}
            </th>
            <th style={thCenter}>상세</th>
          </tr>
        </thead>
        <tbody>
          {pagedPayments.map((p, index) => {
            const paymentId = p.payment_id || p.id;
            return (
              <tr key={paymentId} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={tdCenter}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(paymentId)}
                    onChange={(e) => toggleOne(paymentId, e.target.checked)}
                  />
                </td>
                <td style={tdCenter}>#{paymentId}</td>
                <td style={tdCenter}>
                  {p.username || "-"} <br />
                  <span style={{ fontSize: 13, color: "#888" }}>{p.email || "-"}</span>
                </td>
                <td style={tdCenter}>{p.total_quantity || 0}명</td>
                <td style={tdCenter}>{formatPrice(p.amount)}원</td>
                <td style={tdCenter}>
                  {(p.used_point || 0) + (p.coupon_discount || 0) > 0
                    ? `-${formatPrice((p.used_point || 0) + (p.coupon_discount || 0))}원`
                    : "미적용"}
                </td>
                <td style={tdCenter}>{p.payment_method || "-"}</td>
                <td style={tdCenter}>{formatDate(p.created_at)}</td>
                <td style={tdCenter}>{renderStatusBadge(p.status)}</td>
                <td style={tdCenter}>
                  <button
                    onClick={() => setModalPaymentId(paymentId)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#0070f3",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    상세
                  </button>
                  {(p.status === "paid" || p.status === "결제완료") && (
                    <button
                      onClick={() => handleRefund(p.order_id)}
                      style={{
                        fontSize: 13,
                        padding: "4px 8px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        marginLeft: 6,
                      }}
                    >
                      환불
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {modalPaymentId && (
        <PaymentDetailModal
          paymentId={modalPaymentId}
          onClose={() => setModalPaymentId(null)}
        />
      )}
    </div>
  );
}

const thCenter = {
  padding: "12px",
  textAlign: "center",
  fontWeight: "bold",
  cursor: "pointer",
};

const tdCenter = {
  padding: "12px",
  textAlign: "center",
};
