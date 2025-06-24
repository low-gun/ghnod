import { useEffect, useState } from "react";
import format from "date-fns/format/index.js";
import SearchFilter from "@/components/common/SearchFilter";
import api from "@/lib/api";
import { useMemo } from "react";
import { useRouter } from "next/router";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector"; // ✅ 추가
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton"; // 상단 import 추가

export default function SchedulesTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState({
    key: "start_date",
    direction: "asc",
  });
  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabType, setTabType] = useState("전체");
  const [typeOptions, setTypeOptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const datePart = format(date, "yyyy. M. d.");
    const timePart = format(date, "a h:mm:ss"); // 오전/오후 h:mm:ss
    return (
      <>
        {datePart}
        <br />
        {timePart}
      </>
    );
  };

  // ✅ fetch
  const fetchSchedules = async () => {
    const res = await api.get("admin/schedules", {
      params: {
        type: tabType,
        all: true,
        pageSize: pageSize, // ← 이거 추가
        page: page, // ← 선택사항 (현재 페이지)
      },
    });
    if (res.data.success) {
      setSchedules(res.data.schedules);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [tabType]);

  const handleSort = (key) => {
    const isSameKey = sortConfig.key === key;
    const nextDirection =
      isSameKey && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction: nextDirection });
    setPage(1);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("정말로 선택한 일정을 삭제하시겠습니까?")) return;
    try {
      await api.delete("admin/schedules", {
        data: { ids: selectedIds },
      });
      alert("삭제되었습니다.");
      setSelectedIds([]);
      fetchSchedules();
    } catch {
      alert("삭제 실패");
    }
  };

  const isAllChecked =
    schedules.length > 0 && schedules.every((s) => selectedIds.includes(s.id));

  const toggleAll = (checked) => {
    setSelectedIds(checked ? schedules.map((s) => s.id) : []);
  };

  const toggleOne = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };
  // ✅ 여기에 추가
  const handleToggleActive = async (id, currentValue) => {
    try {
      const newValue = !currentValue; // 현재값 반전
      await api.patch(`admin/schedules/${id}/active`, {
        is_active: newValue,
      });
      fetchSchedules();
    } catch (err) {
      alert("상태 변경 실패");
    }
  };
  const handleReset = () => {
    setPage(1);
    setSortConfig({ key: "start_date", direction: "asc" });
    setSearchQuery("");
    setSearchField("title");
    setStartDate(null);
    setEndDate(null);
    setTabType("전체");
  };
  useEffect(() => {
    if (schedules.length) {
      console.log(
        "🔥 전체 일정 목록",
        schedules.map((s) => ({
          id: s.id,
          is_active: s.is_active,
          title: s.title,
        }))
      );
    }
  }, [schedules]);
  useEffect(() => {
    api.get("admin/schedules/types").then((res) => {
      if (res.data.success) {
        setTypeOptions(
          res.data.types.map((type) => ({
            label: type,
            value: type,
          }))
        );
      }
    });
  }, []);
  const filteredSchedules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return schedules.filter((s) => {
      if (searchField === "title") {
        if (!searchQuery) return true;
        return s.title?.toLowerCase().includes(q);
      }
      if (searchField === "product_title") {
        return s.product_title?.toLowerCase().includes(q);
      }
      if (searchField === "product_type") {
        return s.product_type?.toLowerCase().includes(q);
      }
      if (searchField === "instructor") {
        return s.instructor?.toLowerCase().includes(q);
      }
      if (searchField === "price") {
        return String(s.price || "").includes(q);
      }
      if (searchField === "is_active") {
        console.log("is_active 비교:", {
          value: s.is_active,
          type: typeof s.is_active,
          searchQuery,
        });

        if (!searchQuery) return true;
        return String(s.is_active) === searchQuery;
      }

      if (searchField === "start_date") {
        if (!startDate && !endDate) return true;
        const date = new Date(s.start_date);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      }
      if (searchField === "created_at") {
        if (!startDate && !endDate) return true;
        const date = new Date(s.created_at);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      }
      if (searchField === "updated_at") {
        if (!startDate && !endDate) return true;
        if (!s.updated_at) return false;
        const date = new Date(s.updated_at);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      }
      // 전체 검색 (fallback)
      return true;
    });
  }, [schedules, searchQuery, searchField]);
  const sortedSchedules = useMemo(() => {
    const { key, direction } = sortConfig;
    return [...filteredSchedules].sort((a, b) => {
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredSchedules, sortConfig]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedSchedules.length / pageSize);
  }, [sortedSchedules, pageSize]);

  const pagedSchedules = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedSchedules.slice(start, end);
  }, [sortedSchedules, page, pageSize]);
  return (
    <div>
      {/* 🔍 검색 + 컨트롤 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
          <SearchFilter
            searchType={searchField}
            setSearchType={setSearchField}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={null}
            endDate={null}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            onSearchUpdate={(field, query) => {
              setSearchField(field);
              setSearchQuery(query);
              setPage(1);
            }}
            searchOptions={[
              { value: "title", label: "일정명", type: "text" },
              { value: "product_title", label: "상품명", type: "text" },
              {
                value: "product_type",
                label: "유형",
                type: "select",
                options: typeOptions,
              },
              { value: "start_date", label: "기간", type: "date" },
              { value: "instructor", label: "강사", type: "text" },
              { value: "price", label: "가격", type: "text" },
              {
                value: "is_active",
                label: "활성화 상태",
                type: "select",
                options: [
                  { value: "1", label: "활성" },
                  { value: "0", label: "비활성" },
                ],
              },
              { value: "created_at", label: "등록일시", type: "date" },
              { value: "updated_at", label: "수정일시", type: "date" },
            ]}
          />
          <button
            onClick={handleReset}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            초기화
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            style={{
              padding: "8px 12px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            삭제
          </button>

          <PageSizeSelector
            value={pageSize}
            onChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />

          <ExcelDownloadButton
            fileName="일정목록"
            sheetName="일정목록"
            headers={[
              "일정명",
              "상품명",
              "유형",
              "기간",
              "강사",
              "가격",
              "활성화",
              "등록일시",
              "수정일시",
            ]}
            data={sortedSchedules.map((s) => ({
              일정명: s.title,
              상품명: s.product_title,
              유형: s.product_type,
              기간: `${s.start_date?.slice(0, 10)} ~ ${s.end_date?.slice(0, 10)}`,
              강사: s.instructor,
              가격: `${Number(s.price).toLocaleString()}원`,
              활성화: s.is_active ? "활성" : "비활성",
              등록일시: new Date(s.created_at).toLocaleString(),
              수정일시: s.updated_at
                ? new Date(s.updated_at).toLocaleString()
                : "-",
            }))}
            extraSheets={[
              {
                name: "일정별_신청자목록",
                fetch: async () => {
                  const allRows = [];
                  for (const s of sortedSchedules) {
                    const res = await api.get(
                      `admin/schedules/${s.id}/students`
                    );
                    const students = res.data.students || [];
                    const mapped = students.map((stu) => ({
                      일정명: s.title,
                      상품명: s.product_title,
                      이름: stu.username,
                      이메일: stu.email,
                      수량: stu.quantity,
                      구분: stu.source,
                      신청일: new Date(stu.created_at).toLocaleString(),
                    }));
                    allRows.push(...mapped);
                  }
                  return allRows;
                },
              },
            ]}
          />
        </div>
      </div>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "15px",
            lineHeight: "1.6",
            tableLayout: "fixed", // ✅ 이 줄 추가
          }}
        >
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              <th style={{ ...thCenter, width: "50px" }}>
                <input
                  type="checkbox"
                  onChange={(e) => toggleAll(e.target.checked)}
                  checked={isAllChecked}
                />
              </th>
              <th
                style={{ ...thCenter, width: "280px" }}
                onClick={() => handleSort("title")}
              >
                일정명 {renderArrow("title", sortConfig)}
              </th>
              <th style={{ ...thCenter, width: "80px" }}>썸네일</th>
              <th
                style={{ ...thCenter, width: "160px" }}
                onClick={() => handleSort("product_title")}
              >
                상품명 {renderArrow("product_title", sortConfig)}
              </th>
              <th
                style={{ ...thCenter, width: "120px" }}
                onClick={() => handleSort("product_type")}
              >
                유형 {renderArrow("product_type", sortConfig)}
              </th>
              <th
                style={{ ...thCenter, width: "140px" }}
                onClick={() => handleSort("start_date")}
              >
                기간 {renderArrow("start_date", sortConfig)}
              </th>
              <th
                style={{ ...thCenter, width: "100px" }}
                onClick={() => handleSort("instructor")}
              >
                강사 {renderArrow("instructor", sortConfig)}
              </th>
              <th
                style={{ ...thCenter, width: "100px" }}
                onClick={() => handleSort("price")}
              >
                가격 {renderArrow("price", sortConfig)}
              </th>
              <th
                onClick={() => handleSort("is_active")}
                style={{
                  ...thCenter,
                  width: "60px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "42px",
                    height: "24px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor:
                        sortConfig.key !== "is_active"
                          ? "#bbb"
                          : sortConfig.direction === "asc"
                            ? "#bbb"
                            : "#28a745",
                      borderRadius: "24px",
                      transition: "0.3s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        height: "18px",
                        width: "18px",
                        left:
                          sortConfig.key === "is_active" &&
                          sortConfig.direction === "desc"
                            ? "21px"
                            : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        transition: "0.3s",
                      }}
                    />
                  </div>
                </div>
              </th>
              <th
                style={{ ...thCenter, width: "140px" }}
                onClick={() => handleSort("created_at")}
              >
                등록일시 {renderArrow("created_at", sortConfig)}
              </th>
              <th
                style={{ ...thCenter, width: "140px" }}
                onClick={() => handleSort("updated_at")}
              >
                수정일시 {renderArrow("updated_at", sortConfig)}
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedSchedules.map((s, idx) => (
              <tr
                key={s.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: "1px solid #eee",
                  textAlign: "center",
                  opacity: s.is_active ? 1 : 0.4,
                  height: 80,
                }}
              >
                <td style={{ ...tdCenter, width: "50px" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={(e) => toggleOne(s.id, e.target.checked)}
                  />
                </td>
                <td style={{ ...tdCenter, width: "280px" }}>
                  <span
                    onClick={() => router.push(`/admin/schedules/${s.id}`)}
                    style={{
                      color: "#0070f3",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontWeight: "500",
                      display: "block",
                    }}
                  >
                    {s.title}
                  </span>
                  <span style={{ fontSize: "13px", color: "#666" }}>
                    {s.product_title ?? "-"}
                  </span>
                </td>
                <td style={{ ...tdCenter, width: "80px" }}>
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt="일정 썸네일"
                      style={{ width: 60, height: 60, objectFit: "cover" }}
                    />
                  ) : s.product_image ? (
                    <img
                      src={s.product_image}
                      alt="상품 썸네일"
                      style={{ width: 60, height: 60, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 60,
                        border: "1px dashed #ccc",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#aaa",
                        fontSize: 12,
                        width: "100%",
                      }}
                    >
                      썸네일 없음
                    </div>
                  )}
                </td>
                <td style={{ ...tdCenter, width: "160px" }}>
                  {s.product_title ?? "-"}
                </td>
                <td style={{ ...tdCenter, width: "120px" }}>
                  {s.product_type ?? "-"}
                </td>
                <td style={{ ...tdCenter, width: "140px" }}>
                  <div>
                    {format(new Date(s.start_date), "yyyy-MM-dd")}
                    <br />~ {format(new Date(s.end_date), "yyyy-MM-dd")}
                  </div>
                </td>
                <td style={{ ...tdCenter, width: "100px" }}>{s.instructor}</td>
                <td style={{ ...tdCenter, width: "100px" }}>
                  {s.price != null
                    ? `${Number(s.price).toLocaleString()}원`
                    : "-"}
                </td>
                <td style={{ ...tdCenter, width: "60px" }}>
                  <div
                    onClick={() => handleToggleActive(s.id, s.is_active)}
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: "42px",
                      height: "24px",
                      cursor: "pointer",
                      overflow: "hidden", // ✅ 핵심: 튀어나온 점 잘라냄
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={s.is_active}
                      readOnly
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                        position: "absolute",
                        pointerEvents: "none",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: s.is_active ? "#28a745" : "#ccc",
                        borderRadius: "24px",
                        transition: "0.4s",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          width: "18px",
                          height: "18px",
                          left: s.is_active ? "21px" : "3px",
                          bottom: "3px",
                          backgroundColor: "white",
                          borderRadius: "50%",
                          transition: "0.4s",
                        }}
                      />
                    </span>
                  </div>
                </td>
                <td style={{ ...tdCenter, width: "140px" }}>
                  {formatDateTime(s.created_at)}
                </td>
                <td style={{ ...tdCenter, width: "140px" }}>
                  {s.updated_at ? formatDateTime(s.updated_at) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

const tdCenter = {
  padding: "12px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  height: "60px",
  verticalAlign: "middle",
};

const thCenter = {
  ...tdCenter,
  fontWeight: "bold",
  cursor: "pointer",
};

const renderArrow = (key, config) => {
  const baseStyle = {
    marginLeft: "6px",
    fontSize: "12px",
    display: "inline-block",
    width: "18px",
    textAlign: "center",
  };
  if (config.key !== key)
    return <span style={{ ...baseStyle, color: "#ccc" }}>↕</span>;
  return (
    <span style={{ ...baseStyle, color: "#000" }}>
      {config.direction === "asc" ? "▲" : "▼"}
    </span>
  );
};

const tdLink = {
  ...tdCenter,
  color: "#0070f3",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: "500",
};
