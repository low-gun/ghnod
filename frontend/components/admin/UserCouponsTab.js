import { useEffect, useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
const DatePicker = dynamic(() => import("react-datepicker"), { ssr: false });
import "react-datepicker/dist/react-datepicker.css";
import { downloadExcel } from "@/lib/downloadExcel";
import { useMemo } from "react";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import PaginationControls from "@/components/common/PaginationControls";

export default function UserCouponsTab({ userId }) {
  const [coupons, setCoupons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [usage, setUsage] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "expiry_date",
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
  useEffect(() => {
    if (!userId) return;
  
    const fetchData = async () => {
      try {
        const res = await api.get(`/admin/users/${userId}/coupons`);
        if (res.data?.success) {
          const data = res.data.coupons || [];
          setCoupons(data);
          setFiltered(data);
        } else {
          console.warn("❌ 쿠폰 API 실패:", res.data?.message);
          setCoupons([]);
          setFiltered([]);
        }
      } catch (err) {
        console.error("❌ 쿠폰 API 오류:", err);
        setCoupons([]);
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
  
    fetchData();
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
      if (typeof a[key] === "string" && typeof b[key] === "string") {
        return direction === "asc"
          ? a[key].localeCompare(b[key])
          : b[key].localeCompare(a[key]);
      }
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
      }
      return 0;
    });

    setFiltered(temp);
  }, [coupons, usage, startDate, endDate, search, sortConfig]);

  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setUsage("");
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const handleDownload = async () => {
    const exportData = filtered.map((c) => ({
      쿠폰명: c.name,
      할인액: c.discount_amount,
      상태: c.is_used ? "사용됨" : "미사용",
      만료일: c.expiry_date?.slice(0, 10),
    }));
  
    const name = userInfo?.username || "user";
    const email = userInfo?.email || "email";
    const fileName = `쿠폰_${name}(${email})`; // 날짜는 util에서 자동 추가
  
    await downloadExcel({
      fileName,
      sheets: [{ name: "쿠폰", data: exportData }],
    });
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
          EXCEL
        </button>
      </div>

      {/* 페이지사이즈 드롭다운 */}
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
                <th style={thCenter}>NO</th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("name")}
                >
                  쿠폰명 {renderArrow("name")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("discount_amount")}
                >
                  할인액 {renderArrow("discount_amount")}
                </th>
                <th
                  style={{ ...thCenter, cursor: "pointer" }}
                  onClick={() => handleSort("is_used")}
                >
                  상태 {renderArrow("is_used")}
                </th>

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
              {pagedCoupons.map((c, i) => (
                <tr key={i}>
                  <td style={tdCenter}>
                    {filtered.length - ((currentPage - 1) * itemsPerPage + i)}
                  </td>
                  <td style={tdCenter}>{c.coupon_name}</td>
                  <td style={tdCenter}>
                    {Number(c.discount_amount).toLocaleString()}원
                  </td>
                  <td style={tdCenter}>{renderBadge(c.is_used)}</td>
                  <td style={tdCenter}>
                    {c.expiry_date ? c.expiry_date.slice(0, 10) : "없음"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
