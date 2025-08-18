// ./frontend/components/admin/SchedulesTable.js
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import SearchFilter from "@/components/common/SearchFilter";
import api from "@/lib/api";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

// ✅ 공통 UI
import AdminToolbar from "@/components/common/AdminToolbar";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import ToggleSwitch from "@/components/common/ToggleSwitch";

/** ✅ SSR 안전: UTC 고정 포맷 (서버/클라이언트 동일 표시) */
function formatDateUTC(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const Y = d.getUTCFullYear();
  const M = pad(d.getUTCMonth() + 1);
  const D = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const m = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s} UTC`;
}
const formatDateOnly = (iso) => (iso ? iso.slice(0, 10) : "-");

export default function SchedulesTable() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();
  const isTabletOrBelow = useIsTabletOrBelow();

  // ✅ Hydration 안전장치
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isNarrow = mounted && isTabletOrBelow;

  // ✅ 모바일에서 필터 접기/펼치기 (SSR 안정 초기값)
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    setShowFilter(!isTabletOrBelow); // 데스크톱=펼침, 모바일=접힘
  }, [isTabletOrBelow, mounted]);

  // ✅ 상태
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState({
    key: "updated_at",
    direction: "desc",
  });
  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabType, setTabType] = useState("전체"); // (서버 파라미터용)
  const [typeOptions, setTypeOptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null); // SearchFilter 시그니처 맞춤
  const [endDate, setEndDate] = useState(null);
  const [total, setTotal] = useState(0); // 서버 total
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ 유형 옵션
  useEffect(() => {
    api
      .get("admin/schedules/types")
      .then((res) => {
        if (res.data?.success) {
          setTypeOptions(res.data.types.map((t) => ({ label: t, value: t })));
        }
      })
      .catch(() => {});
  }, []);

  // ✅ 목록 조회
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const params = {
        pageSize,
        page,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
        searchField,
        searchQuery,
      };
      if (tabType && tabType !== "전체") params.type = tabType; // ✅ "전체"일 땐 안 보냄
      const res = await api.get("admin/schedules", { params });
      if (res.data?.success) {
        setSchedules(res.data.schedules || []);
        const t =
          res.data.total ??
          res.data.totalCount ??
          res.data.pagination?.total ??
          (Array.isArray(res.data.schedules) ? res.data.schedules.length : 0);
        setTotal(t);
      } else {
        setLoadError("일정 목록을 불러오지 못했습니다.");
      }
    } catch {
      setLoadError("일정 목록 조회 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tabType,
    page,
    pageSize,
    searchField,
    searchQuery,
    sortConfig.key,
    sortConfig.direction,
  ]);

  // ✅ 정렬
  const handleSort = (key) => {
    setPage(1);
    setSortConfig((prev) => {
      const isSameKey = prev.key === key;
      const nextDirection =
        isSameKey && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction: nextDirection };
    });
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

  // ✅ 선택/삭제/토글
  const isAllChecked =
    schedules.length > 0 && schedules.every((s) => selectedIds.includes(s.id));
  const toggleAll = (checked) =>
    setSelectedIds(checked ? schedules.map((s) => s.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );

  const handleDeleteSelected = async () => {
    const ok = await showConfirm("정말로 선택한 일정을 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await api.delete("admin/schedules", { data: { ids: selectedIds } });
      showAlert("삭제되었습니다.");
      setSelectedIds([]);
      fetchSchedules();
    } catch {
      showAlert("삭제 실패");
    }
  };

  const handleToggleActive = async (id, currentValue) => {
    try {
      await api.patch(`admin/schedules/${id}/active`, {
        is_active: !currentValue,
      });
      fetchSchedules();
    } catch {
      showAlert("상태 변경 실패");
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

  // ✅ 페이징 (서버 total 기준)
  const totalPages = useMemo(
    () => Math.ceil((total || 0) / pageSize),
    [total, pageSize]
  );

  // ========== 렌더 ==========
  return (
    <div>
      {/* 상단 툴바 (공통 컴포넌트) */}
      <AdminToolbar>
        <div className="toolbar-left">
          {mounted && showFilter ? (
            <SearchFilter
              searchType={searchField}
              setSearchType={setSearchField}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              startDate={startDate}
              endDate={endDate}
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
          ) : null}
          <button onClick={handleReset} style={resetBtn}>
            초기화
          </button>
        </div>

        <div className="toolbar-right">
          <button
            className="filter-toggle"
            onClick={() => setShowFilter((v) => !v)}
            style={primaryBtn}
          >
            필터
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            style={{
              ...dangerBtn,
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
              기간: `${formatDateOnly(s.start_date)} ~ ${formatDateOnly(
                s.end_date
              )}`,
              강사: s.instructor,
              가격:
                s.price != null ? `${Number(s.price).toLocaleString()}원` : "-",
              활성화: s.is_active ? "활성" : "비활성",
              등록일시: formatDateUTC(s.created_at),
              수정일시: s.updated_at ? formatDateUTC(s.updated_at) : "-",
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
                      신청일: formatDateUTC(stu.created_at),
                    }));
                    allRows.push(...mapped);
                  }
                  return allRows;
                },
              },
            ]}
          />
        </div>
      </AdminToolbar>

      {/* 본문: 로딩/에러/빈/목록 */}
      {isLoading ? (
        // ✅ Skeleton (공통)
        isNarrow ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={3} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={11} rows={6} />
        )
      ) : loadError ? (
        // Error
        <div style={errorBox}>
          {loadError}
          <button
            style={{ ...primaryBtn, marginLeft: 10, background: "#e53e3e" }}
            onClick={fetchSchedules}
          >
            다시 시도
          </button>
        </div>
      ) : total === 0 && schedules.length === 0 ? (
        // Empty
        <div style={emptyBox}>
          일정이 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
        </div>
      ) : !isNarrow ? (
        // 데스크톱: 테이블
        <>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "15px",
                lineHeight: "1.6",
                tableLayout: "fixed",
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
                      width: "80px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    활성 {renderArrow("is_active", sortConfig)}
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
                {schedules.map((s, idx) => (
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
                      {s.thumbnail || s.image_url || s.product_image ? (
                        <img
                          src={s.thumbnail || s.image_url || s.product_image}
                          alt="일정 썸네일"
                          style={{ width: 60, height: 60, objectFit: "cover" }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={thumbEmpty}>썸네일 없음</div>
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
                        {formatDateOnly(s.start_date)}
                        <br />~ {formatDateOnly(s.end_date)}
                      </div>
                    </td>
                    <td style={{ ...tdCenter, width: "100px" }}>
                      {s.instructor}
                    </td>
                    <td style={{ ...tdCenter, width: "100px" }}>
                      {s.price != null
                        ? `${Number(s.price).toLocaleString()}원`
                        : "-"}
                    </td>
                    <td style={{ ...tdCenter, width: "80px" }}>
                      <ToggleSwitch
                        checked={!!s.is_active}
                        onChange={(next) =>
                          handleToggleActive(s.id, !next ? true : false)
                        }
                        size="sm"
                        onLabel="ON"
                        offLabel="OFF"
                      />
                    </td>
                    <td style={{ ...tdCenter, width: "140px" }}>
                      {formatDateUTC(s.created_at)}
                    </td>
                    <td style={{ ...tdCenter, width: "140px" }}>
                      {s.updated_at ? formatDateUTC(s.updated_at) : "-"}
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
        </>
      ) : (
        // 모바일/태블릿: 카드형
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {schedules.map((s) => (
              <div
                key={s.id}
                style={{
                  ...cardShell,
                  opacity: s.is_active ? 1 : 0.5,
                }}
              >
                {/* 체크 + 코드 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={(e) => toggleOne(s.id, e.target.checked)}
                  />
                  <div style={{ fontSize: 13, color: "#666" }}>S-{s.id}</div>
                </div>

                {/* 제목(링크) */}
                <div
                  style={cardTitleLink}
                  onClick={() => router.push(`/admin/schedules/${s.id}`)}
                >
                  {s.title}
                </div>

                {/* 썸네일 + 주요 정보 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "88px 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    {s.thumbnail || s.image_url || s.product_image ? (
                      <img
                        src={s.thumbnail || s.image_url || s.product_image}
                        alt="일정 썸네일"
                        style={{
                          width: 88,
                          height: 88,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ ...thumbEmpty, width: 88, height: 88 }}>
                        없음
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={cardRow}>
                      <span style={cardLabel}>상품</span>
                      <span style={cardValue}>{s.product_title || "-"}</span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>유형</span>
                      <span style={cardValue}>{s.product_type || "-"}</span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>기간</span>
                      <span style={cardValue}>
                        {formatDateOnly(s.start_date)} ~{" "}
                        {formatDateOnly(s.end_date)}
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>강사</span>
                      <span style={cardValue}>{s.instructor || "-"}</span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>가격</span>
                      <span style={cardValue}>
                        {s.price != null
                          ? `${Number(s.price).toLocaleString()}원`
                          : "-"}
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>활성</span>
                      <ToggleSwitch
                        checked={!!s.is_active}
                        onChange={(next) =>
                          handleToggleActive(s.id, !next ? true : false)
                        }
                        size="sm"
                        onLabel="ON"
                        offLabel="OFF"
                      />
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>등록</span>
                      <span style={cardValue}>
                        {formatDateUTC(s.created_at)}
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>수정</span>
                      <span style={cardValue}>
                        {s.updated_at ? formatDateUTC(s.updated_at) : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

/* 테이블 공통 */
const tdCenter = {
  padding: "12px",
  textAlign: "center",
  height: "60px",
  verticalAlign: "middle",
};
const thCenter = { ...tdCenter, fontWeight: "bold", cursor: "pointer" };

/* 버튼 */
const resetBtn = {
  padding: "8px 14px",
  backgroundColor: "#ccc",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const dangerBtn = {
  padding: "8px 12px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
};
const primaryBtn = {
  padding: "6px 10px",
  fontSize: "13px",
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

/* 썸네일 없음 */
const thumbEmpty = {
  height: 60,
  width: 60,
  border: "1px dashed #ccc",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#aaa",
  fontSize: 12,
};

/* 카드 레이아웃 */
const cardShell = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
};
const cardRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "6px 0",
  borderBottom: "1px dashed #f0f0f0",
};
const cardLabel = { color: "#888", fontSize: 13, minWidth: 80 };
const cardValue = { color: "#222", fontSize: 14, wordBreak: "break-all" };
const cardTitleLink = {
  color: "#0070f3",
  fontWeight: 600,
  marginTop: 8,
  marginBottom: 6,
  cursor: "pointer",
  fontSize: 16,
};

/* 상태 박스 */
const errorBox = {
  border: "1px solid #ffd5d5",
  background: "#fff5f5",
  color: "#c53030",
  padding: "14px 16px",
  borderRadius: 8,
  marginBottom: 16,
};
const emptyBox = {
  border: "1px dashed #d0d7de",
  background: "#fafbfc",
  color: "#57606a",
  padding: "18px 16px",
  borderRadius: 8,
  textAlign: "center",
};
