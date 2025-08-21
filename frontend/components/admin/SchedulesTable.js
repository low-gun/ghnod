// ./frontend/components/admin/SchedulesTable.js
import { useEffect, useState, useMemo, useRef } from "react";
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
import SelectableCard from "@/components/common/SelectableCard"; // ← 추가

/** ✅ 로컬시간 포맷(UTC 표기 제거) */
function formatDateLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}
const formatDateOnly = (iso) => (iso ? iso.slice(0, 10) : "-");

export default function SchedulesTable({
  useExternalToolbar = false,
  externalSearchType,
  externalSearchQuery,
  externalStartDate,
  externalEndDate,
  externalInProgress, // ← 추가
  searchSyncKey,
  onExcelData,
}) {
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
  const [startDate, setStartDate] = useState(null); // SearchFilter 시그니처 맞춤 (YYYY-MM-DD)
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
          const opts = res.data.types.map((t) => ({ label: t, value: t }));
          setTypeOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  // ✅ 외부 검색 주입 시 사용할 유효값
  const effSearchField = useExternalToolbar
    ? (externalSearchType ?? "title")
    : searchField;
  const effSearchQuery = useExternalToolbar
    ? (externalSearchQuery ?? "")
    : searchQuery;
  const effStartDate = useExternalToolbar
    ? (externalStartDate ?? null)
    : startDate;
  const effEndDate = useExternalToolbar ? (externalEndDate ?? null) : endDate;
  // ✅ fetch 트리거 키: 외부 검색이면 버튼 클릭 시 올리는 searchSyncKey만 반응
  const refreshKey = useMemo(() => {
    if (useExternalToolbar) {
      return [
        tabType,
        page,
        pageSize,
        sortConfig.key,
        sortConfig.direction,
        searchSyncKey, // 🔑 버튼 클릭
        externalInProgress, // ← 진행중 플래그 변화에도 반응
      ].join("|");
    }

    // 내부 검색 모드일 땐 기존대로 필드/쿼리/기간에 반응
    return [
      tabType,
      page,
      pageSize,
      sortConfig.key,
      sortConfig.direction,
      searchField,
      searchQuery,
      startDate,
      endDate,
    ].join("|");
  }, [
    useExternalToolbar,
    tabType,
    page,
    pageSize,
    sortConfig.key,
    sortConfig.direction,
    searchSyncKey,
    // 내부 검색 모드용
    searchField,
    searchQuery,
    startDate,
    endDate,
  ]);
  // ✅ 목록 조회
  const inFlightRef = useRef(false); // ✅ ref로 변경
  // ✅ 엑셀 내보내기: 헤더/데이터 계산
  const excelHeaders = [
    "일정명",
    "상품명",
    "유형",
    "기간",
    "회차",      // ✅ 추가
    "강사",
    "가격",
    "상태",
    "등록일시",
    "수정일시",
  ];
  
  const excelRows = useMemo(
    () =>
      schedules.map((s) => ({
        일정명: s.title,
        상품명: s.product_title,
        유형: s.product_type,
        기간: `${formatDateOnly(s.start_date)} ~ ${formatDateOnly(s.end_date)}`,
        회차: typeof s.sessions_count === "number" ? s.sessions_count : "", // ✅ 추가
        강사: s.instructor,
        가격: s.price != null ? `${Number(s.price).toLocaleString()}원` : "-",
        상태: s.is_active ? "활성" : "비활성",
        등록일시: formatDateLocal(s.created_at),
        수정일시: s.updated_at ? formatDateLocal(s.updated_at) : "-",
      })),
    [schedules]
  );
  

  const fetchSchedules = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setIsLoading(true);
      setLoadError("");
      const params = {
        pageSize,
        page,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
        searchField: effSearchField,
        searchQuery: effSearchQuery,
        include_sessions: 1, // ✅ 회차수/최초일/최종일 포함 요청
      };

      if (effStartDate) params.start_date = effStartDate;
      if (effEndDate) params.end_date = effEndDate;

      if (tabType && tabType !== "전체") params.type = tabType;

      // 진행중: 날짜 파라미터 제거 + 서버에 in_progress=1 전달
      if (useExternalToolbar && externalInProgress) {
        delete params.start_date;
        delete params.end_date;
        params.in_progress = 1;
      }

      const res = await api.get("admin/schedules", { params });
      if (res.data?.success) {
        setSchedules(res.data.schedules || []);
        const t =
          res.data.total ??
          res.data.totalCount ??
          res.data.pagination?.total ??
          (Array.isArray(res.data.schedules) ? res.data.schedules.length : 0);
        setTotal(Number(t) || 0);
      } else {
        setLoadError("일정 목록을 불러오지 못했습니다.");
      }
    } catch {
      setLoadError("일정 목록 조회 실패");
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); // 🔑 외부: 버튼 클릭 시만, 내부: 필드/쿼리/기간 변경 시
  // ✅ 외부 툴바(페이지 상단) 사용 시, 계산된 엑셀 데이터를 상향 전달
  useEffect(() => {
    if (useExternalToolbar && typeof onExcelData === "function") {
      onExcelData({ headers: excelHeaders, data: excelRows });
    }
    // 🔑 onExcelData는 제외 (부모의 setState는 참조 변경되기 때문에 루프 원인)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useExternalToolbar, excelRows]);

  // ✅ 정렬 (헤더 화살표 제거, 클릭 정렬은 유지)
  const handleSort = (key) => {
    setPage(1);
    setSortConfig((prev) => {
      const isSameKey = prev.key === key;
      const nextDirection =
        isSameKey && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction: nextDirection };
    });
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
    if (selectedIds.length === 0) return;
    const ok = await showConfirm("정말로 선택한 일정을 삭제하시겠습니까?");
    if (!ok) return;

    const ids = Array.from(new Set(selectedIds.map(Number))).filter(
      (n) => n > 0
    );

    try {
      // 1차: DELETE body 방식(백엔드 컨트롤러 deleteSchedules)
      await api.request({
        method: "delete",
        url: "admin/schedules",
        headers: { "Content-Type": "application/json" },
        data: { ids },
      });

      showAlert("삭제되었습니다.");
      setSelectedIds([]);
      fetchSchedules();
    } catch (e1) {
      // FK 차단(주문/수료증) → 409 + details 반환
      if (
        e1?.response?.status === 409 &&
        e1?.response?.data?.code === "HAS_DEPENDENCIES"
      ) {
        const details = e1.response.data.details || {};
        const oc = (details.orderBlocks || []).reduce(
          (a, b) => a + (b.order_count || 0),
          0
        );
        const cc = (details.certBlocks || []).reduce(
          (a, b) => a + (b.cert_count || 0),
          0
        );
        const lines = ["삭제 불가: 연결된 데이터가 있습니다."];

        // 줄마다 접두사 붙여 좌측정렬 느낌 강화
        if (Number(oc) > 0) lines.push(`• 주문내역: ${oc}건`);
        if (Number(cc) > 0) lines.push(`• 수료증: ${cc}건`);

        lines.push("관련 데이터를 먼저 정리한 후 삭제하세요.");

        showAlert(lines.join("\n"));
        return;
      }
      // 폴백: 쿼리스트링 방식 (서버가 body 미수용일 경우)
      try {
        await api.delete("admin/schedules", { params: { ids: ids.join(",") } });
        showAlert("삭제되었습니다.");
        setSelectedIds([]);
        fetchSchedules();
      } catch {
        showAlert("삭제 실패");
      }
    }
  };

  // ✅ 상단 패널의 "- 삭제" 빠른 작업과 연동 (선택 항목이 있을 때만 동작)
  useEffect(() => {
    const handler = () => {
      if (!selectedIds || selectedIds.length === 0) return;
      // 기존 삭제 로직 재사용
      (async () => {
        await handleDeleteSelected();
      })();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("schedules:deleteSelected", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("schedules:deleteSelected", handler);
      }
    };
    // selectedIds 변동 시 최신 선택 상태 반영
  }, [selectedIds]);

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
    setPageSize(20);
    setSortConfig({ key: "updated_at", direction: "desc" });
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
      {/* 상단 툴바 (공통 컴포넌트) — 외부 툴바 사용 시 렌더링 생략 */}
      {!useExternalToolbar && (
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
              headers={excelHeaders}
              data={excelRows}
            />
          </div>
        </AdminToolbar>
      )}

      {/* 본문: 로딩/에러/빈/목록 */}
      {isLoading ? (
        isNarrow ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={3} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={12} rows={6} />
        )
      ) : loadError ? (
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
        <div style={emptyBox}>
          일정이 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
        </div>
      ) : !isNarrow ? (
        // 데스크톱: 테이블
        <>
          <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
            <table
              className="admin-table"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <thead style={{ backgroundColor: "#f9f9f9" }}>
                <tr>
                  <th className="admin-th" style={{ width: "50px" }}>
                    <input
                      type="checkbox"
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={isAllChecked}
                    />
                  </th>
                  <th className="admin-th" style={{ width: "70px" }}>
                    No
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "260px" }}
                    onClick={() => handleSort("title")}
                  >
                    일정명
                  </th>
                  <th className="admin-th" style={{ width: "80px" }}>
                    썸네일
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "160px" }}
                    onClick={() => handleSort("product_title")}
                  >
                    상품명
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "120px" }}
                    onClick={() => handleSort("product_type")}
                  >
                    유형
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "160px" }}
                    onClick={() => handleSort("start_date")}
                  >
                    기간
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "110px" }}
                    onClick={() => handleSort("instructor")}
                  >
                    강사
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "110px" }}
                    onClick={() => handleSort("price")}
                  >
                    가격
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "150px" }}
                    onClick={() => handleSort("created_at")}
                  >
                    등록일시
                  </th>
                  <th
                    className="admin-th"
                    style={{ width: "150px" }}
                    onClick={() => handleSort("updated_at")}
                  >
                    수정일시
                  </th>
                  <th className="admin-th" style={{ width: "90px" }}>
                    상태
                  </th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((s, idx) => {
                  const rowNo = (page - 1) * pageSize + (idx + 1);
                  return (
                    <tr
                      key={s.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                        borderBottom: "1px solid #eee",
                        opacity: s.is_active ? 1 : 0.4,
                        height: 80,
                      }}
                    >
                      <td className="admin-td" style={{ width: "50px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={(e) => toggleOne(s.id, e.target.checked)}
                        />
                      </td>

                      <td className="admin-td" style={{ width: "70px" }}>
                        {rowNo}
                      </td>
                      <td
                        className="admin-td"
                        style={{ width: "260px", textAlign: "center" }}
                      >
                        <span
                          onClick={() =>
                            router.push(`/admin/schedules/${s.id}`)
                          }
                          style={{
                            color: "#0070f3",
                            textDecoration: "none",
                            cursor: "pointer",
                            fontWeight: "500",
                            display: "block",
                          }}
                        >
                          {s.title}
                        </span>
                      </td>
                      <td className="admin-td" style={{ width: "80px" }}>
                        {s.thumbnail || s.image_url || s.product_image ? (
                          <img
                            src={s.thumbnail || s.image_url || s.product_image}
                            alt="일정 썸네일"
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={thumbEmpty}>
                            썸네일
                            <br />
                            없음
                          </div>
                        )}
                      </td>
                      <td className="admin-td" style={{ width: "160px" }}>
                        {s.product_title ?? "-"}
                      </td>
                      <td className="admin-td" style={{ width: "120px" }}>
                        {s.product_type ?? "-"}
                      </td>
                      <td className="admin-td" style={{ width: "160px" }}>
  <div>
    {formatDateOnly(s.start_date)} ~ {formatDateOnly(s.end_date)}
    {typeof s.sessions_count === "number" && s.sessions_count > 0
      ? ` · ${s.sessions_count}회차`
      : ""}
  </div>
</td>

                      <td className="admin-td" style={{ width: "110px" }}>
                        {s.instructor}
                      </td>
                      <td className="admin-td" style={{ width: "110px" }}>
                        {s.price != null
                          ? `${Number(s.price).toLocaleString()}원`
                          : "-"}
                      </td>
                      <td className="admin-td" style={{ width: "150px" }}>
                        {formatDateLocal(s.created_at)}
                      </td>
                      <td className="admin-td" style={{ width: "150px" }}>
                        {s.updated_at ? formatDateLocal(s.updated_at) : "-"}
                      </td>
                      <td className="admin-td" style={{ width: "90px" }}>
                        <ToggleSwitch
                          checked={!!s.is_active}
                          onChange={() =>
                            handleToggleActive(s.id, !!s.is_active)
                          }
                          size="sm"
                          onLabel="ON"
                          offLabel="OFF"
                        />
                      </td>
                    </tr>
                  );
                })}
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
            {schedules.map((s, idx) => {
              const rowNo = (page - 1) * pageSize + (idx + 1);
              const isSelected = selectedIds.includes(s.id);
              const toggleSelected = () => toggleOne(s.id, !isSelected);

              return (
                <SelectableCard
                  key={s.id}
                  selected={isSelected}
                  onToggle={toggleSelected}
                  style={{ ...cardShell, opacity: s.is_active ? 1 : 0.5 }}
                >
                  {/* 체크 + No + 코드 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleOne(s.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div style={{ fontSize: 13, color: "#666" }}>
                      No. {rowNo}
                    </div>
                    <div style={{ fontSize: 13, color: "#999" }}>S-{s.id}</div>
                  </div>

                  {/* 제목(텍스트 링크만 클릭) */}
                  <div
                    style={{
                      ...cardTitleLink,
                      cursor: "default",
                      color: "#222",
                    }}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation(); // 카드 선택 토글 방지
                        router.push(`/admin/schedules/${s.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/admin/schedules/${s.id}`);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        cursor: "pointer", // ← 텍스트만 클릭
                        display: "inline",
                      }}
                    >
                      {s.title}
                    </span>
                  </div>

                  {/* 썸네일 + 주요 정보 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "88px 1fr",
                      gap: 10,
                    }}
                  >
                    {(() => {
                      const src = s.thumbnail || s.image_url || s.product_image;
                      const hasThumb = !!src;
                      return (
                        <div>
                          {hasThumb ? (
                            <img
                              src={src}
                              alt="일정 썸네일"
                              style={{
                                width: 88,
                                height: 88,
                                objectFit: "cover",
                                borderRadius: 6,
                                cursor: "default", // ← 클릭 아님
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              style={{ ...thumbEmpty, width: 88, height: 88 }}
                            >
                              없음
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
    {formatDateOnly(s.start_date)} ~ {formatDateOnly(s.end_date)}
    {typeof s.sessions_count === "number" && s.sessions_count > 0
      ? ` · ${s.sessions_count}회차`
      : ""}
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
                        <span style={cardLabel}>등록</span>
                        <span style={cardValue}>
                          {formatDateLocal(s.created_at)}
                        </span>
                      </div>
                      <div style={cardRow}>
                        <span style={cardLabel}>수정</span>
                        <span style={cardValue}>
                          {s.updated_at ? formatDateLocal(s.updated_at) : "-"}
                        </span>
                      </div>
                      <div style={cardRow} onClick={(e) => e.stopPropagation()}>
                        <span style={cardLabel}>상태</span>
                        <ToggleSwitch
                          checked={!!s.is_active}
                          onChange={() =>
                            handleToggleActive(s.id, !!s.is_active)
                          }
                          size="sm"
                          onLabel="ON"
                          offLabel="OFF"
                        />
                      </div>
                    </div>
                  </div>
                </SelectableCard>
              );
            })}
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
