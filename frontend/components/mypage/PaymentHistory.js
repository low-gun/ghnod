import React, { useState, useMemo, useEffect } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/router";
import { useIsCardLayout } from "@/lib/hooks/useIsDeviceSize";

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

// 결제수단 한글 표기
function getPaymentMethodLabel(method) {
  if (!method) return "-";
  if (method === "card") return "카드결제";
  if (method === "bank") return "무통장입금";
  // 필요 시 기타 추가
  return method;
}

export default function PaymentHistory() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filterType, setFilterType] = useState("order_id");
  const [searchValue, setSearchValue] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isCardLayout = useIsCardLayout();
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const statusOptions = ["paid", "failed", "refunded"];
  const [windowWidth, setWindowWidth] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/mypage/payments");
        if (res.data.success) setData(res.data.payments || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth && windowWidth <= 480;

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      setIsMediumScreen(isCardLayout && width > 500 && width < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [isCardLayout]);

  const containerStyle = {
    padding: isCardLayout ? 0 : 20,
    marginTop: isMediumScreen ? "16px" : 0,
    minHeight: 420,
  };

  useEffect(() => {
    setSortConfig({ key: null, direction: "asc" });
  }, []);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderStatusBadge = (label) => {
    const colors = {
      완료: "#3b82f6",
      실패: "#ef4444",
      환불: "#6b7280",
    };
    return (
      <span
        style={{
          backgroundColor: colors[label] || "#ccc",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "11px",
          fontSize: "13px",
          fontWeight: 600,
          minWidth: 44,
          textAlign: "center",
          marginLeft: 3,
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
        const label = getStatusLabel(d.status);
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

  // 결제내역 없음 안내 (MyCourse 스타일)
  const renderEmpty = () => (
    <div
      style={{
        padding: isMobile ? "56px 0 40px 0" : "70px 0 60px 0",
        textAlign: "center",
        color: "#bbb",
        fontSize: isMobile ? "1rem" : "1.1rem",
        minHeight: 200,
        fontWeight: 400,
      }}
    >
      <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>💳</span>
      결제내역이 없습니다
      <div style={{ fontSize: "0.97rem", color: "#ccc", marginTop: 4 }}>
        첫 결제를 진행해보세요!
      </div>
    </div>
  );

  // 카드형/테이블 분기
  return (
    <div style={containerStyle}>
      {!isMobile && <h2 style={titleStyle}>결제내역</h2>}

      {/* 필터 (카드형일 때는 숨김) */}
      {!isCardLayout && (
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
            <option value="order_id">주문번호</option>
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
              placeholder={filterType === "amount" ? "금액 입력" : "주문번호 입력"}
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
                  {getPaymentMethodLabel(method)}
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
              {statusOptions.map((status) => {
                const label = getStatusLabel(status);
                return (
                  <option key={status} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      )}

      {/* 카드형 or 테이블 */}
      {isCardLayout ? (
        filteredData.length === 0 ? (
          renderEmpty()
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            {filteredData.map((item) => (
              <div
                key={item.order_id}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 2px 10px 0 rgba(40,90,200,0.09)",
                  background: "#fff",
                  marginBottom: 0,
                  padding: "18px 18px 13px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  position: "relative",
                  cursor: "pointer",
                  border: "1.5px solid #e4eaf5",
                  minHeight: 110,
                }}
                onClick={() => router.push(`/orders/${item.order_id}`)}
              >
                {/* 상단: 금액 + 상태 */}

                {/* 주문번호 */}
                <div style={{ color: "#727F98", fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  주문번호 {item.order_id}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 17, color: "#284785" }}>
                    {formatPrice(item.amount)}원
                  </span>
                  <span style={{ fontSize: 14, color: "#555", marginLeft: "auto" }}>
                    {renderStatusBadge(getStatusLabel(item.status))}
                  </span>
                </div>
                {/* 결제일/인원/할인 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 15, color: "#4e5560" }}>
  <span>🗓 {formatKoreanDateTime(item.created_at)}</span>
  <span>👥 {item.quantity || 0}명</span>
  {((item.used_point || 0) + (item.coupon_discount || 0)) > 0 && (
    <span>
      할인 {formatPrice((item.used_point || 0) + (item.coupon_discount || 0))}원
    </span>
  )}
</div>
                {/* 결제수단 */}
                <div style={{
                  fontSize: 14,
                  color: "#888",
                  marginTop: 4,
                  borderTop: "1px solid #f3f3f5",
                  paddingTop: 7,
                  letterSpacing: "-0.5px",
                }}>
                  결제수단: <b>{getPaymentMethodLabel(item.payment_method)}</b>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // PC(테이블형)
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                <th style={thCenter}>No</th>
                <th style={thCenter} onClick={() => handleSort("order_id")}>
                  주문번호
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "order_id" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "order_id"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("created_at")}>
                  결제일
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "created_at" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "created_at"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("amount")}>
                  금액
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "amount" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "amount"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("total_quantity")}>
                  수강인원
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "total_quantity" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "total_quantity"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("discount_total")}>
                  할인적용
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "discount_total" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "discount_total"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("payment_method")}>
                  결제수단
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "payment_method" ? "#000" : "#ccc",
                  }}>
                    {sortConfig.key === "payment_method"
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </th>
                <th style={thCenter} onClick={() => handleSort("status")}>
                  상태
                  <span style={{
                    ...sortArrowStyle,
                    color: sortConfig.key === "status" ? "#000" : "#ccc",
                  }}>
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
                  <td colSpan={8} style={tdCenter}>
                    {renderEmpty()}
                  </td>
                </tr>
              ) : (
                pagedData.map((item, idx) => (
                  <tr
                    key={item.order_id + "-" + idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/orders/${item.order_id}`)}
                  >
                    <td style={tdCenter}>
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td style={{ ...tdCenter, color: "#0070f3" }}>
                      {item.order_id}
                    </td>
                    <td style={tdCenter}>
                      {formatKoreanDateTime(item.created_at)}
                    </td>
                    <td style={tdCenter}>{formatPrice(item.amount)}원</td>
                    <td style={tdCenter}>{item.quantity || 0}명</td>
                    <td style={tdCenter}>
                      {formatPrice((item.used_point || 0) + (item.coupon_discount || 0))}원
                    </td>
                    <td style={tdCenter}>{getPaymentMethodLabel(item.payment_method)}</td>
                    <td style={tdCenter}>
                      {renderStatusBadge(getStatusLabel(item.status))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* 페이지네이션 */}
          {pagedData.length !== 0 && (
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
          )}
        </div>
      )}
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
const titleStyle = {
  fontSize: "1.4rem",
  fontWeight: "bold",
  marginBottom: "20px",
};
const mobileCardStyle = {
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const mobileRow = {
  marginBottom: "8px",
  fontSize: "14px",
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
};
