import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function UserCoursesTab({ userId }) {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "start_date",
    direction: "desc",
  });

  useEffect(() => {
    if (!userId) return;

    api.get(`/admin/users/${userId}/courses`).then((res) => {
      const data = res.data.courses || [];
      setCourses(data);
      setFiltered(data);
    });

    api.get(`/admin/users/${userId}`).then((res) => {
      setUserInfo(res.data.user);
    });
  }, [userId]);

  useEffect(() => {
    let temp = [...courses];

    if (startDate && endDate) {
      const start = startDate.getTime();
      const end = endDate.getTime();
      temp = temp.filter((c) => {
        const courseStart = new Date(c.start_date).getTime();
        return courseStart >= start && courseStart <= end;
      });
    }

    if (search) {
      const lower = search.toLowerCase();
      temp = temp.filter((c) => c.title?.toLowerCase().includes(lower));
    }

    // 정렬
    temp.sort((a, b) => {
      const { key, direction } = sortConfig;
      const aVal = a[key];
      const bVal = b[key];
      return direction === "asc"
        ? new Date(aVal) - new Date(bVal)
        : new Date(bVal) - new Date(aVal);
    });

    setFiltered(temp);
  }, [courses, startDate, endDate, search, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSearch("");
  };

  const handleDownload = () => {
    const exportData = filtered.map((course) => ({
      강의명: course.title,
      시작일: course.start_date?.slice(0, 10),
      종료일: course.end_date?.slice(0, 10),
      주문일: course.order_date?.slice(0, 10),
      상태: course.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "수강정보");

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `수강정보_${name}(${email})_${today}.xlsx`;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
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
        <input
          type="text"
          placeholder="강의명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "200px" }}
        />

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
          <p>수강 내역이 없습니다.</p>
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
                <th style={thCenter}>강의명</th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("start_date")}
                >
                  시작일{" "}
                  {sortConfig.key === "start_date" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("end_date")}
                >
                  종료일{" "}
                  {sortConfig.key === "end_date" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("order_date")}
                >
                  주문일{" "}
                  {sortConfig.key === "order_date" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th style={thCenter}>상태</th>
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
                  <td style={tdCenter}>{c.title}</td>
                  <td style={tdCenter}>{c.start_date?.slice(0, 10)}</td>
                  <td style={tdCenter}>{c.end_date?.slice(0, 10)}</td>
                  <td style={tdCenter}>{c.order_date?.slice(0, 10)}</td>
                  <td style={tdCenter}>{c.status}</td>
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
