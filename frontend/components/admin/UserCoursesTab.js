import { useEffect, useState } from "react";
import api from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import PaginationControls from "@/components/common/PaginationControls";
import { useMemo } from "react"; // 맨 위 import 필요
export default function UserCoursesTab({ userId }) {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [userInfo, setUserInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "start_date",
    direction: "desc",
  });
  const router = useRouter();
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

      let result = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        result = aVal.localeCompare(bVal);
      } else {
        result = new Date(aVal) - new Date(bVal);
      }

      return direction === "asc" ? result : -result;
    });

    setFiltered(temp);
  }, [courses, startDate, endDate, search, sortConfig]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);
  const pagedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const renderStatusBadge = (status) => {
    const colors = {
      예정: "#0070f3",
      진행중: "#FFA000",
      완료: "#4CAF50",
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
          EXCEL
        </button>
      </div>
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
                <th style={thCenter}>NO</th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("start_date")}
                >
                  시작일 {renderArrow("start_date")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("end_date")}
                >
                  종료일 {renderArrow("end_date")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("order_date")}
                >
                  주문일 {renderArrow("order_date")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("title")}
                >
                  강의명 {renderArrow("title")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  상태 {renderArrow("status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedCourses.map((c, i) => (
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
                  <td style={tdCenter}>{c.start_date?.slice(0, 10)}</td>
                  <td style={tdCenter}>{c.end_date?.slice(0, 10)}</td>
                  <td style={tdCenter}>{c.order_date?.slice(0, 10)}</td>
                  <td
                    style={{
                      ...tdCenter,
                      color: "#0070f3",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() =>
                      router.push(
                        `/education/${c.product_type}/${c.schedule_id}`
                      )
                    }
                  >
                    {c.title}
                  </td>
                  <td style={tdCenter}>{renderStatusBadge(c.status)}</td>
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
