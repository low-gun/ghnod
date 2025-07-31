import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useMemo } from "react"; // 상단 import도 추가
import PageSizeSelector from "@/components/common/PageSizeSelector";
import PaginationControls from "@/components/common/PaginationControls";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function UserPaymentsTab({ userId }) {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [userInfo, setUserInfo] = useState(null);
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
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
  const fetchPayments = () => {
    api.get(`/admin/users/${userId}/payments`).then((res) => {
      const data = res.data.payments || [];
      setPayments(data);
      setFiltered(data);
    });

    api.get(`/admin/users/${userId}`).then((res) => {
      setUserInfo(res.data.user);
    });
  };

  useEffect(() => {
    if (!userId) return;
    fetchPayments();
  }, [userId]);

  useEffect(() => {
    let temp = [...payments];

    if (status) temp = temp.filter((p) => p.status === status);

    if (startDate && endDate) {
      const start = startDate.getTime();
      const end = endDate.getTime();
      temp = temp.filter((p) => {
        const created = new Date(p.created_at).getTime();
        return created >= start && created <= end;
      });
    }

    if (search) {
      const lower = search.toLowerCase();
      temp = temp.filter((p) =>
        p.payment_method?.toLowerCase().includes(lower)
      );
    }

    temp.sort((a, b) => {
      const { key, direction } = sortConfig;
      const aVal = a[key];
      const bVal = b[key];

      let result = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        result = aVal.localeCompare(bVal);
      } else if (!isNaN(Date.parse(aVal)) && !isNaN(Date.parse(bVal))) {
        result = new Date(aVal) - new Date(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        result = aVal - bVal;
      }

      return direction === "asc" ? result : -result;
    });

    setFiltered(temp);
  }, [payments, status, search, startDate, endDate, sortConfig]);
  const pagedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setStatus("");
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const handleDownload = () => {
    const exportData = filtered.map((p) => {
      const createdAt = new Date(p.created_at).toLocaleString("ko-KR");
      const refundedAt = p.refunded_at
        ? new Date(p.refunded_at).toLocaleString("ko-KR")
        : null;

      return {
        금액: p.amount,
        결제수단: p.payment_method,
        상태: p.status,
        일시: refundedAt ? `${createdAt} (${refundedAt})` : createdAt,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "결제내역");

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `결제내역_${name}(${email})_${today}.xlsx`;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);
  const renderBadge = (status) => {
    const labels = {
      paid: "결제완료",
      pending: "대기중",
      canceled: "취소됨",
      refunded: "환불됨",
    };
    const colors = {
      paid: "#4CAF50",
      pending: "#FFA000",
      canceled: "#f44336",
      refunded: "#9E9E9E",
    };

    const color = colors[status] || "#999";
    const label = labels[status] || status;

    return (
      <span
        style={{
          backgroundColor: color,
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

  return (
    <div>
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
        >
          <option value="">전체 상태</option>
          <option value="paid">결제완료</option>
          <option value="pending">대기중</option>
          <option value="canceled">취소됨</option>
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="시작일"
          dateFormat="yyyy-MM-dd"
          customInput={<input style={inputStyle} />}
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="종료일"
          dateFormat="yyyy-MM-dd"
          customInput={<input style={inputStyle} />}
        />

        <input
          type="text"
          placeholder="결제수단 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "200px" }}
        />

        <button onClick={resetFilters} style={buttonStyle("#ccc", "#333")}>
          초기화
        </button>
        <button onClick={handleDownload} style={buttonStyle("#4CAF50", "#fff")}>
          EXCEL
        </button>
      </div>
      {/* ▼ 여기에 PageSizeSelector 넣기 */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
        }}
      >
        <PageSizeSelector
          value={itemsPerPage}
          onChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      </div>
      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        {filtered.length === 0 ? (
          <p>결제내역이 없습니다.</p>
        ) : (
          <table
            style={{
              width: "100%",
              fontSize: "15px",
              borderCollapse: "collapse",
              lineHeight: "1.6",
            }}
          >
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                <th style={thCenter}>NO</th>
                <th
                  style={{ ...thCenter, width: "30%", cursor: "pointer" }}
                  onClick={() => handleSort("created_at")}
                >
                  일시 {renderArrow("created_at")}
                </th>
                <th
                  style={{ ...thCenter, width: "35%", cursor: "pointer" }}
                  onClick={() => handleSort("product_titles")}
                >
                  상품명 {renderArrow("product_titles")}
                </th>
                <th
                  style={{ ...thCenter, width: "10%", cursor: "pointer" }}
                  onClick={() => handleSort("amount")}
                >
                  금액 {renderArrow("amount")}
                </th>
                <th
                  style={{ ...thCenter, width: "15%", cursor: "pointer" }}
                  onClick={() => handleSort("payment_method")}
                >
                  결제수단 {renderArrow("payment_method")}
                </th>
                <th
                  style={{ ...thCenter, width: "10%", cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  상태 {renderArrow("status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.map((p, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdCenter}>
                    {filtered.length - ((currentPage - 1) * itemsPerPage + i)}
                  </td>
                  {/* 일시 */}
                  <td style={tdCenter}>
                    {new Date(p.created_at).toLocaleString("ko-KR")}
                    {p.refunded_at && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        ({new Date(p.refunded_at).toLocaleString("ko-KR")})
                      </div>
                    )}
                  </td>

                  {/* 상품명 */}
                  <td style={tdCenter}>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "#0070f3",
                        textDecoration: "underline",
                      }}
                      onClick={() => showAlert(p.product_titles)}
                    >
                      {p.product_titles
                        ? p.product_titles.split(", ")[0] +
                          (p.product_titles.includes(", ") ? " 등" : "")
                        : "-"}
                    </span>
                  </td>

                  {/* 금액 */}
                  <td style={tdCenter}>
                    {Number(p.amount).toLocaleString()}원
                  </td>

                  {/* 결제수단 */}
                  <td style={tdCenter}>{p.payment_method}</td>

                  {/* 상태 */}
                  <td style={tdCenter}>{renderBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "16px",
        }}
      >
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

// 💅 스타일
const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "140px",
};

const buttonStyle = (bg, color) => ({
  padding: "8px 14px",
  backgroundColor: bg,
  color: color,
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
});

const thCenter = { padding: "12px", textAlign: "center", fontWeight: "bold" };
const tdCenter = { padding: "12px", textAlign: "center" };
