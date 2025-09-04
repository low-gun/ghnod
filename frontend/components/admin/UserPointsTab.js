import { useEffect, useState, useMemo } from "react";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import PaginationControls from "@/components/common/PaginationControls";
import api from "@/lib/api";
import dynamic from "next/dynamic";
const DatePicker = dynamic(() => import("react-datepicker"), { ssr: false });
import "react-datepicker/dist/react-datepicker.css";
import { downloadExcel } from "@/lib/downloadExcel";

export default function UserPointsTab({ userId }) {
  const [points, setPoints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const fetchPoints = async () => {
    try {
      const res = await api.get(`/admin/users/${userId}/points`);
      if (res.data?.success) {
        const data = res.data.points || [];
        setPoints(data);
        setFiltered(data);
      } else {
        console.warn("❌ 포인트 API 실패:", res.data?.message);
        setPoints([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error("❌ 포인트 API 오류:", err);
      setPoints([]);
      setFiltered([]);
    }
  
    try {
      const resUser = await api.get(`/admin/users/${userId}`);
      if (resUser.data?.success) {
        setUserInfo(resUser.data.user);
      }
    } catch (err) {
      console.error("❌ 사용자 정보 API 오류:", err);
      setUserInfo(null);
    }
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
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    setFiltered(temp);
  }, [points, type, startDate, endDate, search, sortConfig]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);
  const pagedPoints = useMemo(() => {
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
  const resetFilters = () => {
    setType("");
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const handleDownload = async () => {
    const exportData = filtered.map((p) => ({
      일시: p.created_at?.slice(0, 19).replace("T", " "),
      상태: p.change_type,
      금액: p.amount,
      설명: p.description || "-",
    }));
  
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `포인트_${name}(${email})`; // 날짜는 util에서 자동 추가
  
    await downloadExcel({
      fileName,
      sheets: [{ name: "포인트", data: exportData }],
    });
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
        <button onClick={handleDownload} style={buttonStyle("#4CAF50", "#fff")}>
          다운로드
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        {/* 테이블 우상단 드롭다운 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "8px",
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
        {filtered.length === 0 ? (
          <p>포인트 내역이 없습니다.</p>
        ) : (
          <>
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
                    style={{ ...thRight, cursor: "pointer" }}
                    onClick={() => handleSort("created_at")}
                  >
                    일시 {renderArrow("created_at")}
                  </th>
                  <th
                    style={{ ...thCenter, cursor: "pointer" }}
                    onClick={() => handleSort("change_type")}
                  >
                    상태 {renderArrow("change_type")}
                  </th>
                  <th
                    style={{ ...thRight, cursor: "pointer" }}
                    onClick={() => handleSort("amount")}
                  >
                    금액 {renderArrow("amount")}
                  </th>
                  <th
                    style={{ ...thLeft, cursor: "pointer" }}
                    onClick={() => handleSort("description")}
                  >
                    설명 {renderArrow("description")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagedPoints.map((p, i) => (
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
                    <td style={tdRight}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td style={tdCenter}>{renderBadge(p.change_type)}</td>
                    <td style={tdRight}>
                      {Number(p.amount).toLocaleString()}P
                    </td>
                    <td style={tdLeft}>{p.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      {filtered.length > 0 && totalPages > 1 && (
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
