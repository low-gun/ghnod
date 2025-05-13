import React, { useState, useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatPrice } from "@/lib/format";

function formatKoreanDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date)) return isoString;
  return date.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status) {
  if (status === "결제완료" || status === "paid") return "완료";
  if (status === "결제실패" || status === "failed") return "실패";
  if (status === "환불완료" || status === "refunded") return "환불";
  return status || "미확인";
}

export default function PaymentHistory({ data }) {
  console.log("🧾 PaymentHistory data:", data); // ✅ 콘솔 찍기
  const [filterType, setFilterType] = useState("order_id");
  const [searchValue, setSearchValue] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activePopover, setActivePopover] = useState(null);
  useEffect(() => {
    setSortConfig({ key: "null", direction: "asc" });
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderStatusBadge = (label) => {
    const colors = {
      완료: "#3b82f6", // 파랑
      실패: "#ef4444", // 빨강
      환불: "#6b7280", // 회색
    };
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

  const paymentMethods = Array.from(
    new Set(data.map((d) => d.payment_method).filter(Boolean))
  );
  const statuses = Array.from(
    new Set(data.map((d) => d.status).filter(Boolean))
  );

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filterType === "order_id" && searchValue) {
      result = result.filter((d) => String(d.order_id).includes(searchValue));
    }
    if (filterType === "status" && searchValue) {
      result = result.filter((d) => {
        const label = getStatusLabel(d.status); // paid → 완료
        return label === searchValue;
      });
    }

    if (filterType === "payment_method" && searchValue) {
      result = result.filter((d) => d.payment_method === searchValue);
    }
    if (filterType === "amount" && searchValue) {
      result = result.filter((d) => String(d.amount).includes(searchValue));
    }
    if (filterType === "date") {
      const [start, end] = dateRange;
      if (start && end) {
        result = result.filter((d) => {
          const dt = new Date(d.created_at);
          return dt >= start && dt <= end;
        });
      }
      // 둘 다 null이면 전체 보기 유지
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === "discount_total") {
          const aVal = (a.used_point || 0) + (a.coupon_discount || 0);
          const bVal = (b.used_point || 0) + (b.coupon_discount || 0);
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (sortConfig.key === "created_at") {
          return sortConfig.direction === "asc"
            ? new Date(aVal) - new Date(bVal)
            : new Date(bVal) - new Date(aVal);
        }

        if (typeof aVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [data, filterType, searchValue, dateRange, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>결제내역</h2>

      {/* 필터 */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setSearchValue("");
            setDateRange([null, null]);
          }}
          style={inputStyle}
        >
          <option value="order_id">주문번호</option> {/* ✅ 추가 */}
          <option value="date">결제일</option>
          <option value="amount">금액</option>
          <option value="payment_method">결제수단</option>
          <option value="status">상태</option>
        </select>

        {filterType === "date" && (
          <>
            <DatePicker
              selected={dateRange[0]}
              onChange={(date) => setDateRange([date, dateRange[1]])}
              placeholderText="시작일"
              dateFormat="yyyy-MM-dd"
              customInput={<input style={inputStyle} />}
            />
            <DatePicker
              selected={dateRange[1]}
              onChange={(date) => setDateRange([dateRange[0], date])}
              placeholderText="종료일"
              dateFormat="yyyy-MM-dd"
              customInput={<input style={inputStyle} />}
            />
          </>
        )}

        {["amount", "order_id"].includes(filterType) && (
          <input
            type="text"
            placeholder={
              filterType === "amount" ? "금액 입력" : "주문번호 입력"
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={inputStyle}
          />
        )}

        {filterType === "payment_method" && (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={inputStyle}
          >
            <option value="">전체</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        )}

        {filterType === "status" && (
          <select
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={inputStyle}
          >
            <option value="">전체</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={thCenter}>No</th>
              <th style={thCenter} onClick={() => handleSort("order_id")}>
                주문번호
                <span
                  style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "order_id" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "order_id"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
              <th style={thCenter} onClick={() => handleSort("created_at")}>
                결제일
                <span
                  style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "created_at" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "created_at"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
              <th style={thCenter} onClick={() => handleSort("amount")}>
                금액
                <span
                  style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "amount" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "amount"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
              <th style={thCenter} onClick={() => handleSort("total_quantity")}>
                수강인원
                <span
                  style={{
                    ...sortArrowStyle,
                    color:
                      sortConfig.key === "total_quantity" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "total_quantity"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
              <th style={thCenter} onClick={() => handleSort("discount_total")}>
                할인적용
                <span
                  style={{
                    ...sortArrowStyle,
                    color:
                      sortConfig.key === "discount_total" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "discount_total"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
              <th style={thCenter} onClick={() => handleSort("payment_method")}>
                결제수단
                <span
                  style={{
                    ...sortArrowStyle,
                    color:
                      sortConfig.key === "payment_method" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "payment_method"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>

              <th style={thCenter} onClick={() => handleSort("status")}>
                상태
                <span
                  style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "status" ? "#000" : "#ccc",
                  }}
                >
                  {sortConfig.key === "status"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "↕"}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={9} style={tdCenter}>
                  결제내역이 없습니다.
                </td>
              </tr>
            ) : (
              pagedData.map((item, idx) => (
                <tr
                  key={`${item.order_id}-${idx}`}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdCenter}>
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td
                    style={{ ...tdCenter, color: "#0070f3", cursor: "pointer" }}
                    onClick={() =>
                      (window.location.href = `/orders/${item.order_id}`)
                    }
                  >
                    {item.order_id}
                  </td>
                  <td style={tdCenter}>
                    {formatKoreanDateTime(item.created_at)}
                  </td>
                  <td style={tdCenter}>{formatPrice(item.amount)}원</td>
                  <td style={tdCenter}>{item.total_quantity || 0}명</td>
                  <td style={{ ...tdCenter, position: "relative" }}>
                    <span
                      onClick={() =>
                        (item.used_point || 0) + (item.coupon_discount || 0) >
                          0 &&
                        setActivePopover((prev) =>
                          prev === item.order_id ? null : item.order_id
                        )
                      }
                    >
                      {formatPrice(
                        (item.used_point || 0) + (item.coupon_discount || 0)
                      )}
                      원
                    </span>

                    {activePopover === item.order_id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "24px",
                          right: "0",
                          background: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontSize: "13px",
                          zIndex: 1000,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div>포인트: {formatPrice(item.used_point || 0)}P</div>
                        <div>
                          쿠폰: {formatPrice(item.coupon_discount || 0)}원
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={tdCenter}>{item.payment_method || "-"}</td>
                  <td style={tdCenter}>
                    {renderStatusBadge(getStatusLabel(item.status))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              padding: "6px 10px",
              fontSize: "14px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              margin: "0 4px",
              cursor: "pointer",
              fontWeight: currentPage === page ? "bold" : "normal",
              backgroundColor: currentPage === page ? "#eee" : "#fff",
            }}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "140px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "15px",
  lineHeight: "1.6",
};

const thCenter = {
  padding: "10px",
  textAlign: "center",
  fontWeight: "bold",
  cursor: "pointer",
};

const tdCenter = {
  padding: "12px",
  textAlign: "center",
};

const sortArrowStyle = {
  fontSize: "11px",
  marginLeft: "4px",
  verticalAlign: "middle",
};
