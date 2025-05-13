import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function UserCouponsTab({ userId }) {
  const [coupons, setCoupons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [usage, setUsage] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "expiry_date",
    direction: "desc",
  });

  useEffect(() => {
    if (!userId) return;

    api.get(`/admin/users/${userId}/coupons`).then((res) => {
      const data = res.data.coupons || [];
      setCoupons(data);
      setFiltered(data);
    });

    api.get(`/admin/users/${userId}`).then((res) => {
      setUserInfo(res.data.user);
    });
  }, [userId]);

  useEffect(() => {
    let temp = [...coupons];

    if (usage) {
      temp = temp.filter((c) =>
        usage === "used" ? c.is_used === 1 : c.is_used === 0
      );
    }

    if (startDate && endDate) {
      const start = startDate.getTime();
      const end = endDate.getTime();
      temp = temp.filter((c) => {
        const expiry = new Date(c.expiry_date).getTime();
        return expiry >= start && expiry <= end;
      });
    }

    if (search) {
      const lower = search.toLowerCase();
      temp = temp.filter((c) => c.name?.toLowerCase().includes(lower));
    }

    temp.sort((a, b) => {
      const { key, direction } = sortConfig;
      if (key === "expiry_date") {
        return direction === "asc"
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      return 0;
    });

    setFiltered(temp);
  }, [coupons, usage, startDate, endDate, search, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setUsage("");
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const handleDownload = () => {
    const exportData = filtered.map((c) => ({
      쿠폰명: c.name,
      할인액: c.discount_amount,
      상태: c.is_used ? "사용됨" : "미사용",
      만료일: c.expiry_date?.slice(0, 10),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "쿠폰");

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `쿠폰_${name}(${email})_${today}.xlsx`;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  const renderBadge = (isUsed) => {
    const color = isUsed ? "#f44336" : "#4CAF50";
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
        {isUsed ? "사용됨" : "미사용"}
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
          value={usage}
          onChange={(e) => setUsage(e.target.value)}
          style={inputStyle}
        >
          <option value="">전체</option>
          <option value="unused">미사용</option>
          <option value="used">사용됨</option>
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="만료 시작일"
          dateFormat="yyyy-MM-dd"
          customInput={<input style={inputStyle} />}
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="만료 종료일"
          dateFormat="yyyy-MM-dd"
          customInput={<input style={inputStyle} />}
        />

        <input
          type="text"
          placeholder="쿠폰명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "200px" }}
        />

        <button onClick={resetFilters} style={buttonStyle("#ccc", "#333")}>
          초기화
        </button>
        <button onClick={handleDownload} style={buttonStyle("#4CAF50", "#fff")}>
          📥 다운로드
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        {filtered.length === 0 ? (
          <p>쿠폰 내역이 없습니다.</p>
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
                <th style={thCenter}>쿠폰명</th>
                <th style={thCenter}>할인액</th>
                <th style={thCenter}>상태</th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("expiry_date")}
                >
                  만료일{" "}
                  {sortConfig.key === "expiry_date" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdCenter}>{c.name}</td>
                  <td style={tdCenter}>
                    {Number(c.discount_amount).toLocaleString()}원
                  </td>
                  <td style={tdCenter}>{renderBadge(c.is_used)}</td>
                  <td style={tdCenter}>{c.expiry_date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// 스타일
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
