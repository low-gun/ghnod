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
    key: "updated_at",
    direction: "desc",
  });
  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabType, setTabType] = useState("전체");
  const [typeOptions, setTypeOptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [total, setTotal] = useState(0);

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
        pageSize,
        page,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
        searchField,
        searchQuery,
      },
    });
    if (res.data.success) {
      setSchedules(res.data.schedules);    // 한 페이지 데이터만
      setTotal(res.data.total);            // 총 갯수(페이징 계산용)
    }
  };
  

  useEffect(() => {
    fetchSchedules();
  }, [tabType, sortConfig, page, pageSize, searchField, searchQuery]);

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
  
  
  const totalPages = useMemo(() => {
    return Math.ceil(schedules.length / pageSize);
  }, [schedules, pageSize]);
  
  const pagedSchedules = schedules;
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
            data={schedules.map((s) => ({
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
                  for (const s of schedules) {
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
    textAlign: "center",
  }}
>
  {renderArrow("is_active", sortConfig)}
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
  {s.thumbnail ? (
    <img
      src={s.thumbnail}
      alt="일정 썸네일"
      style={{ width: 60, height: 60, objectFit: "cover" }}
      loading="lazy"
    />
  ) : s.image_url ? (
    <img
      src={s.image_url}
      alt="일정 썸네일"
      style={{ width: 60, height: 60, objectFit: "cover" }}
      loading="lazy"
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
  <label style={{
    display: "inline-block",
    position: "relative",
    width: 38,
    height: 22,
    cursor: "pointer",
    verticalAlign: "middle",
  }}>
    <input
      type="checkbox"
      checked={s.is_active}
      onChange={() => handleToggleActive(s.id, s.is_active)}
      style={{
        opacity: 0,
        width: 0,
        height: 0,
      }}
    />
    <span style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: s.is_active ? "#28a745" : "#ccc",
      borderRadius: 22,
      transition: "0.3s",
      boxShadow: "0 0 3px rgba(0,0,0,0.05)",
    }} />
    <span style={{
      position: "absolute",
      top: 3,
      left: s.is_active ? 18 : 3,
      width: 16,
      height: 16,
      backgroundColor: "#fff",
      borderRadius: "50%",
      transition: "0.3s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }} />
  </label>
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
  // whiteSpace: "nowrap", // 삭제 또는 주석 처리
  // overflow: "hidden",   // 삭제 또는 주석 처리
  // textOverflow: "ellipsis", // 삭제 또는 주석 처리
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
