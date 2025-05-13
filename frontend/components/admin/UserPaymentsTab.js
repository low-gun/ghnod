import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function UserPaymentsTab({ userId }) {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

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

      if (key === "created_at") {
        return direction === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    setFiltered(temp);
  }, [payments, status, search, startDate, endDate, sortConfig]);

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
    const exportData = filtered.map((p) => ({
      금액: p.amount,
      결제수단: p.payment_method,
      상태: p.status,
      일시: p.created_at?.slice(0, 19).replace("T", " "),
    }));

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

  const renderBadge = (status) => {
    const colors = {
      paid: "#4CAF50",
      pending: "#FFA000",
      canceled: "#f44336",
    };
    const color = colors[status] || "#999";

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
        {status}
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
          다운로드
        </button>
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
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("amount")}
                >
                  금액{" "}
                  {sortConfig.key === "amount" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th style={thCenter}>결제수단</th>
                <th style={thCenter}>상태</th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("created_at")}
                >
                  일시{" "}
                  {sortConfig.key === "created_at" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdCenter}>
                    {Number(p.amount).toLocaleString()}원
                  </td>
                  <td style={tdCenter}>{p.payment_method}</td>
                  <td style={tdCenter}>{renderBadge(p.status)}</td>
                  <td style={tdCenter}>
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
