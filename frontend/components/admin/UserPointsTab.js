import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import UserPointModal from "./UserPointModal";

export default function UserPointsTab({ userId }) {
  const [points, setPoints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  const fetchPoints = () => {
    api.get(`/admin/users/${userId}/points`).then((res) => {
      const data = res.data.points || [];
      setPoints(data);
      setFiltered(data);
    });

    api.get(`/admin/users/${userId}`).then((res) => {
      setUserInfo(res.data.user);
    });
  };

  useEffect(() => {
    if (!userId) return;
    fetchPoints();
  }, [userId]);

  useEffect(() => {
    let temp = [...points];

    if (type) temp = temp.filter((p) => p.change_type === type);

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
      temp = temp.filter((p) => p.description?.toLowerCase().includes(lower));
    }

    // 정렬
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
  }, [points, type, startDate, endDate, search, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setType("");
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const handleDownload = () => {
    const exportData = filtered.map((p) => ({
      구분: p.change_type,
      금액: p.amount,
      설명: p.description || "-",
      일시: p.created_at?.slice(0, 19).replace("T", " "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "포인트");

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `포인트_${name}(${email})_${today}.xlsx`;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  const renderBadge = (type) => {
    const color = type === "적립" ? "#0070f3" : "#f44336";
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
        {type}
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        >
          <option value="">전체</option>
          <option value="적립">적립</option>
          <option value="사용">사용</option>
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
          placeholder="설명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "200px" }}
        />

        <button onClick={resetFilters} style={buttonStyle("#ccc", "#333")}>
          초기화
        </button>
        <button
          onClick={() => setShowModal(true)}
          style={buttonStyle("#0070f3", "#fff")}
        >
          + 포인트 지급
        </button>
        <button onClick={handleDownload} style={buttonStyle("#4CAF50", "#fff")}>
          다운로드
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        {filtered.length === 0 ? (
          <p>포인트 내역이 없습니다.</p>
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
                <th style={thCenter}>구분</th>
                <th
                  style={{ ...thRight, cursor: "pointer" }}
                  onClick={() => handleSort("amount")}
                >
                  금액{" "}
                  {sortConfig.key === "amount" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th style={thLeft}>설명</th>
                <th
                  style={{ ...thRight, cursor: "pointer" }}
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
                  <td style={tdCenter}>{renderBadge(p.change_type)}</td>
                  <td style={tdRight}>{Number(p.amount).toLocaleString()}P</td>
                  <td style={tdLeft}>{p.description || "-"}</td>
                  <td style={tdRight}>
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 지급 모달 */}
      {showModal && (
        <UserPointModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onSuccess={fetchPoints}
        />
      )}
    </div>
  );
}

// 🎨 스타일
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

const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
};

const thLeft = { padding: "12px", textAlign: "center", fontWeight: "bold" };
const thRight = { padding: "12px", textAlign: "center", fontWeight: "bold" };
const thCenter = { padding: "12px", textAlign: "center", fontWeight: "bold" };

const tdLeft = { padding: "12px", textAlign: "center" };
const tdRight = { padding: "12px", textAlign: "center" };
const tdCenter = { padding: "12px", textAlign: "center" };
