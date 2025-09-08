import React, { useState, useMemo, useEffect } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/router";
import { useIsCardLayout } from "@/lib/hooks/useIsDeviceSize";
import SearchFilter from "@/components/common/SearchFilter"; // ← 이 줄 추가

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
  const columnDefs = [
    { key: "No", label: "No", sortable: false },
    { key: "order_id", label: "주문번호", sortable: true },
    { key: "quantity", label: "수강인원", sortable: true }, // ← 응답 필드와 일치
    { key: "amount", label: "결제금액", sortable: true },
    { key: "payment_method", label: "결제수단", sortable: true },
    { key: "created_at", label: "결제일", sortable: true },
    { key: "status", label: "상태", sortable: true },
  ];
  
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
      <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}></span>
      결제내역이 없습니다.
    </div>
  );

  // 카드형/테이블 분기
  return (
    <div style={containerStyle}>
<h2 style={titleStyle}>결제내역</h2>
      {/* 필터 (카드형일 때는 숨김) */}
      {!isCardLayout && filteredData.length > 0 && (
        <SearchFilter
          searchType={filterType}
          setSearchType={setFilterType}
          searchQuery={searchValue}
          setSearchQuery={setSearchValue}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          setStartDate={(date) => setDateRange([date, dateRange[1]])}
          setEndDate={(date) => setDateRange([dateRange[0], date])}
          searchOptions={[
            { value: "order_id", label: "주문번호", type: "text" },
            { value: "amount", label: "금액", type: "text" },
            {
              value: "payment_method",
              label: "결제수단",
              type: "select",
              options: paymentMethods.map((m) => ({ value: m, label: m })),
            },
            {
              value: "status",
              label: "상태",
              type: "select",
              options: [
                { value: "완료", label: "완료" },
                { value: "실패", label: "실패" },
                { value: "환불", label: "환불" },
              ],
            },
            { value: "date", label: "결제일", type: "date" },
          ]}
          onSearchUpdate={(type, query) => {
            setFilterType(type);
            setSearchValue(query);
            setCurrentPage(1);
          }}
          isMobile={false}
        />
      )}

      {/* 카드형 or 테이블 */}
      {isCardLayout ? (
        filteredData.length === 0 ? (
          renderEmpty()
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: "100%",
            }}
          >
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
                <div
                  style={{
                    color: "#727F98",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 2,
                  }}
                >
                  주문번호 {item.order_id}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 17, color: "#284785" }}
                  >
                    {formatPrice(item.amount)}원
                  </span>
                  <span
                    style={{ fontSize: 14, color: "#555", marginLeft: "auto" }}
                  >
                    {renderStatusBadge(getStatusLabel(item.status))}
                  </span>
                </div>
               {/* 결제일/인원/할인 */}
<div
  style={{
    display: "flex",
    flexDirection: "column", // ✅ 여러 회차일 경우 줄바꿈
    gap: 6,
    fontSize: 15,
    color: "#4e5560",
  }}
>
  <span>🗓 {formatKoreanDateTime(item.created_at)}</span>

  {Array.isArray(item.items) && item.items.length > 0 ? (
    item.items.map((it, idx) => (
      <span key={idx}>
        👥 {it.schedule_title || "일정"}: {it.quantity || 0}명
      </span>
    ))
  ) : (
    <span>👥 {item.quantity || 0}명</span>
  )}

  {(item.used_point || 0) + (item.coupon_discount || 0) > 0 && (
    <span>
      할인{" "}
      {formatPrice(
        (item.used_point || 0) + (item.coupon_discount || 0)
      )}
      원
    </span>
  )}
</div>

                {/* 결제수단 */}
                <div
                  style={{
                    fontSize: 14,
                    color: "#888",
                    marginTop: 4,
                    borderTop: "1px solid #f3f3f5",
                    paddingTop: 7,
                    letterSpacing: "-0.5px",
                  }}
                >
                  결제수단: <b>{getPaymentMethodLabel(item.payment_method)}</b>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // PC(테이블형)
        (pagedData.length === 0) ? (
          // ✅ 데이터가 없으면 테이블/헤더를 렌더하지 않고 안내만 표시
          renderEmpty()
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead style={{ background: "#f9f9f9" }}>
                <tr>
                  {columnDefs.map((col) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={col.key}
                        style={thCenter}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      >
                        {col.label}
                        {col.sortable && isActive && (
                          <span style={{ ...sortArrowStyle, color: "#000" }}>
                            {sortConfig.direction === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedData.map((item, idx) => (
                  <tr
                    key={item.order_id + "-" + idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/orders/${item.order_id}`)}
                  >
                    {columnDefs.map((col) => {
                      if (col.key === "No") {
                        return (
                          <td key={col.key} style={tdCenter}>
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                        );
                      }
                      if (col.key === "order_id") {
                        return (
                          <td key={col.key} style={{ ...tdCenter, color: "#0070f3" }}>
                            {item.order_id}
                          </td>
                        );
                      }
                      if (col.key === "created_at") {
                        return (
                          <td key={col.key} style={tdCenter}>
                            {formatKoreanDateTime(item.created_at)}
                          </td>
                        );
                      }
                      if (col.key === "amount") {
                        const discount =
                          (item.used_point || 0) + (item.coupon_discount || 0);
                        return (
                          <td
                            key={col.key}
                            style={tdCenter}
                            title={
                              discount > 0
                                ? `할인 적용: ${formatPrice(discount)}원`
                                : ""
                            }
                          >
                            {formatPrice(item.amount)}원
                          </td>
                        );
                      }
                      if (col.key === "quantity") {
                        const sumQty = Array.isArray(item.items)
                          ? item.items.reduce(
                              (acc, it) => acc + Number(it.quantity || 0),
                              0
                            )
                          : item.quantity || 0;
                        return (
                          <td key={col.key} style={tdCenter}>
                            {sumQty}명
                          </td>
                        );
                      }
                      if (col.key === "payment_method") {
                        return (
                          <td key={col.key} style={tdCenter}>
                            {getPaymentMethodLabel(item.payment_method)}
                          </td>
                        );
                      }
                      if (col.key === "status") {
                        return (
                          <td key={col.key} style={tdCenter}>
                            {renderStatusBadge(getStatusLabel(item.status))}
                          </td>
                        );
                      }
                      return <td key={col.key} style={tdCenter}></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
      
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
        )
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
  fontWeight: "normal",
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
  fontSize: "1.2rem",
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
