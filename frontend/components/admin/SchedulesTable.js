import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import SearchFilter from "@/components/common/SearchFilter";
import api from "@/lib/api";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import AdminToolbar from "@/components/common/AdminToolbar";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import SelectableCard from "@/components/common/SelectableCard";
import VirtualizedTable from "@/components/common/VirtualizedTable"; // ✅ 추가

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
// ✅ 회차별 모집인원 툴팁
const buildSeatsTooltip = (s) => {
  const arr = Array.isArray(s.sessions) ? s.sessions : [];
  if (!arr || arr.length < 2) return ""; // 2회차 이상일 때만 표시

  return arr.map((x, i) => {
    const total = x.total_spots ?? "-";
    const remaining = x.remaining_spots ?? "-";
    return `(${i + 1}회차) 잔여 ${remaining} / 정원 ${total}`;
  }).join("\n");
};
// ✅ 회차 상세 툴팁(2회차 이상일 때 title로 노출)
const buildSessionsTooltip = (s) => {
  // sessions_detail 우선 사용 (백엔드에서 내려주는 배열)
  const arr = Array.isArray(s.sessions_detail)
    ? s.sessions_detail
    : (Array.isArray(s.sessions) ? s.sessions : []);
  if (!arr || arr.length < 2) return ""; // 2회차 이상일 때만 표시

  const fmt = (d) => {
    if (!d) return "-";
    const iso = d instanceof Date ? d.toISOString() : String(d);
    return iso.slice(0, 10);
  };

  return arr.map((x, i) => {
    const sd = fmt(x.start_date || x.session_date);
    const ed = fmt(x.end_date || x.session_date);
    return `(${i + 1}회차) ${sd} ~ ${ed}`;
  }).join("\n");
};

// ✅ 모집인원(잔여/전체) 표기
const seatsText = (s) => {
  const total = (typeof s.total_spots === "number") ? s.total_spots : null;
  const reserved = (typeof s.reserved_spots === "number")
    ? s.reserved_spots
    : (typeof s.booked_count === "number" ? s.booked_count : null);
  const remaining = (typeof s.remaining_spots === "number")
    ? s.remaining_spots
    : (total != null && reserved != null ? Math.max(total - reserved, 0) : null);

  if (total == null && reserved == null) return "-";
  const a = (reserved != null)  ? reserved  : "-";   // 모집된 인원(이미 주문된 수량)
  const b = (remaining != null) ? remaining : (total!=null && reserved!=null ? Math.max(total-reserved,0) : "-"); // 잔여
  const c = (total != null)     ? total     : "-";   // 전체(등록 시 총 정원)
  return `${a}(${b}/${c})`;
};



export default function SchedulesTable({
  useExternalToolbar = false,
  externalSearchType,
  externalSearchQuery,
  externalStartDate,
  externalEndDate,
  externalInProgress,
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

// ✅ 모바일 최초 진입에선 리스트 자동 로드 끔(외부 툴바 사용 시엔 자동 로드 유지)
const [autoFetchEnabled, setAutoFetchEnabled] = useState(useExternalToolbar ? true : false);
useEffect(() => {
  if (!mounted) return;
  setAutoFetchEnabled(useExternalToolbar ? true : !isTabletOrBelow);
}, [mounted, isTabletOrBelow, useExternalToolbar]);
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
  const [tabType, setTabType] = useState("전체"); // 서버 파라미터용
  const [typeOptions, setTypeOptions] = useState([]);
  // schedules 상태 선언부 주변
const [schedules, setSchedules] = useState([]);

// ✅ 파생표시값 캐싱: 렌더마다 seats/tooltip 재계산 방지
const viewRows = useMemo(() => {
  return (Array.isArray(schedules) ? schedules : []).map((s) => ({
    ...s,
    __seatsText: seatsText(s),               // 예: "3(7/10)" 형태
    __seatsTooltip: buildSeatsTooltip(s),    // 회차별 잔여/정원 tooltip
    __sessionsTooltip: buildSessionsTooltip(s), // 회차별 날짜 tooltip
  }));
}, [schedules]);
const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null); // YYYY-MM-DD
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

  // ✅ 외부 검색 주입값
  const effSearchField = useExternalToolbar
    ? externalSearchType ?? "title"
    : searchField;
  const effSearchQuery = useExternalToolbar
    ? externalSearchQuery ?? ""
    : searchQuery;
  const effStartDate = useExternalToolbar
    ? externalStartDate ?? null
    : startDate;
  const effEndDate = useExternalToolbar ? externalEndDate ?? null : endDate;

  // ✅ fetch 트리거
  const refreshKey = useMemo(() => {
    if (useExternalToolbar) {
      return [
        tabType,
        page,
        pageSize,
        sortConfig.key,
        sortConfig.direction,
        searchSyncKey,
        externalInProgress,
        isNarrow,              // ← 추가: 화면 크기 변화 반영
      ].join("|");
    }
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
      isNarrow,                // ← 추가: 화면 크기 변화 반영
    ].join("|");
  }, [
    useExternalToolbar,
    tabType,
    page,
    pageSize,
    sortConfig.key,
    sortConfig.direction,
    searchSyncKey,
    searchField,
    searchQuery,
    startDate,
    endDate,
    isNarrow,                  // ← 의존성에도 추가
  ]);
  

  // ✅ 목록 조회
  const abortRef = useRef(null);

const fetchSchedules = async (signal) => {
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
      include_sessions: !isNarrow ? 1 : 0, // 데스크톱만 세션 상세 포함
    };
    
    if (effStartDate) params.start_date = effStartDate;
    if (effEndDate) params.end_date = effEndDate;
    if (tabType && tabType !== "전체") params.type = tabType;

    // 진행중: 기간 파라미터 제거 + in_progress=1
    if (useExternalToolbar && externalInProgress) {
      delete params.start_date;
      delete params.end_date;
      params.in_progress = 1;
    }

    const res = await api.get("admin/schedules", { params, signal });
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
  } catch (e) {
    if (e?.name === "CanceledError" || e?.name === "AbortError") return;
    setLoadError("일정 목록 조회 실패");
  } finally {
    setIsLoading(false);
  }
};
  useEffect(() => {
    if (!mounted || !autoFetchEnabled) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchSchedules(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, refreshKey, autoFetchEnabled]);
  // ✅ 엑셀 (원하시면 새 순서/모집인원 포함으로 바꿀 수 있음)
  const excelHeaders = [
    "일정명",
    "상품명",
    "유형",
    "기간",
    "모집인원(잔여/전체)", // ✅ 추가
    "회차",
    "강사",
    "가격",
    "상태",
    "등록일시",
    "수정일시",
  ];
  
  const excelRows = useMemo(
    () =>
      viewRows.map((s) => ({
        일정명: s.title,
        상품명: s.product_title,
        유형: s.product_type,
        기간: `${formatDateOnly(s.start_date)} ~ ${formatDateOnly(s.end_date)}`,
        "모집인원(잔여/전체)": s.__seatsText,                 // ✅ 캐싱값 사용
        회차: typeof s.sessions_count === "number" ? s.sessions_count : "",
        강사: s.instructor,
        가격: s.price != null ? `${Number(s.price).toLocaleString()}원` : "-",
        상태: s.is_active ? "활성" : "비활성",
        등록일시: formatDateLocal(s.created_at),
        수정일시: s.updated_at ? formatDateLocal(s.updated_at) : "-",
      })),
    [viewRows]
  );
  
  
  useEffect(() => {
    if (useExternalToolbar && typeof onExcelData === "function") {
      onExcelData({ headers: excelHeaders, data: excelRows });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useExternalToolbar, excelRows]);

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
      // 1차: DELETE body 방식
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
      // FK 차단 → 409 + details
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
        if (Number(oc) > 0) lines.push(`• 주문내역: ${oc}건`);
        if (Number(cc) > 0) lines.push(`• 수료증: ${cc}건`);
        lines.push("관련 데이터를 먼저 정리한 후 삭제하세요.");
        showAlert(lines.join("\n"));
        return;
      }
      // 2차: 쿼리스트링 방식
      try {
        await api.delete("admin/schedules", {
          params: { ids: ids.join(",") },
        });
        showAlert("삭제되었습니다.");
        setSelectedIds([]);
        fetchSchedules();
      } catch {
        showAlert("삭제 실패");
      }
    }
  };

  // 상단 패널의 단축 삭제 이벤트
  useEffect(() => {
    const handler = () => {
      if (!selectedIds || selectedIds.length === 0) return;
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
  }, [selectedIds]); // 최신 선택 상태 반영

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

    // ========== 렌더 ==========
  return (
    <div>
      {/* 상단 툴바 */}
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
                  setAutoFetchEnabled(true);  // ✅ 검색 버튼 누르면 그때부터 로드
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
) : !autoFetchEnabled ? (
  // ✅ 모바일 최초 진입: 사용자 요청 시 로드
  <div style={emptyBox}>
    목록을 불러오려면 아래 버튼을 누르세요.
    <div style={{ marginTop: 10 }}>
      <button
        style={primaryBtn}
        onClick={() => setAutoFetchEnabled(true)}
      >
        데이터 불러오기
      </button>
    </div>
  </div>
) : total === 0 && schedules.length === 0 ? (
  <div style={emptyBox}>
    일정이 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
  </div>
) : !isNarrow ? (
        // 데스크톱: 테이블
       // 데스크톱: 테이블
<>
  <VirtualizedTable
    tableClassName="admin-table"
    height={560}            // 필요 시 조정
    rowHeight={64}          // 썸네일 60px 기준
    resetKey={refreshKey}
    columns={[
      { key: "sel", title: <input type="checkbox" onChange={(e)=>toggleAll(e.target.checked)} checked={isAllChecked} />, width: 50 },
      { key: "no",  title: "No", width: 70, onClickHeader: () => handleSort("id") },
      { key: "thumb", title: "썸네일", width: 80 },
      { key: "title", title: "일정명", width: 260, onClickHeader: () => handleSort("title") },
      { key: "instructor", title: "강사", width: 110, onClickHeader: () => handleSort("instructor") },
      { key: "period", title: "기간", width: 170, onClickHeader: () => handleSort("start_date") },
      {
        key: "seats",
        title: <>모집인원<br/>(잔여/전체)</>,
        width: 130,
        onClickHeader: () => handleSort("seats_remaining"),
      },
      { key: "price", title: "가격", width: 110, onClickHeader: () => handleSort("price") },
      { key: "product_title", title: "상품명", width: 160, onClickHeader: () => handleSort("product_title") },
      { key: "product_type",  title: "유형", width: 120, onClickHeader: () => handleSort("product_type") },
      { key: "created_at",    title: "등록일시", width: 150, onClickHeader: () => handleSort("created_at") },
      { key: "updated_at",    title: "수정일시", width: 150, onClickHeader: () => handleSort("updated_at") },
      { key: "status", title: "상태", width: 90 },
    ]}
    items={viewRows}
    renderRowCells={({ item: s, index: idx }) => {
      const rowNo = idx + 1;
      const sessionsCount = Number(s.sessions_count || 0);
      const thumbSrc = s.thumbnail || s.image_url || s.product_image;
      return (
        <>
          <td className="admin-td" style={{ width: 50 }}>
            <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={(e)=>toggleOne(s.id, e.target.checked)} />
          </td>
          <td className="admin-td" style={{ width: 70 }}>{rowNo}</td>
          <td className="admin-td" style={{ width: 80 }}>
            {thumbSrc ? (
              <img src={thumbSrc} alt="일정 썸네일" style={{ width: 60, height: 60, objectFit: "cover" }} loading="lazy" />
            ) : (
              <div style={thumbEmpty}>썸네일<br/>없음</div>
            )}
          </td>
          <td className="admin-td" style={{ width: 260, textAlign: "center" }}>
            <span
              onClick={() => router.push(`/admin/schedules/${s.id}`)}
              style={{ color: "#0070f3", textDecoration: "none", cursor: "pointer", fontWeight: 500, display: "block" }}
            >
              {s.title}
            </span>
          </td>
          <td className="admin-td" style={{ width: 110 }}>{s.instructor || "-"}</td>
          <td className="admin-td" style={{ width: 170, whiteSpace: "normal" }}>
            {sessionsCount <= 1 ? (
              <div style={{ lineHeight: 1.3 }}>
                {formatDateOnly(s.start_date)}
                <br />~{formatDateOnly(s.end_date)}
              </div>
            ) : (
              <span title={s.__sessionsTooltip || ""} style={{ display: "inline-block", cursor: "help" }}>
                {`${sessionsCount}회차`}
              </span>
            )}
          </td>
          <td className="admin-td" style={{ width: 130 }}>
            {sessionsCount > 1 ? (
              <span title={s.__seatsTooltip || ""} style={{ cursor: "help" }}>{`${sessionsCount}회차`}</span>
            ) : (
              s.__seatsText
            )}
          </td>
          <td className="admin-td" style={{ width: 110 }}>
            {s.price != null ? `${Number(s.price).toLocaleString()}원` : "-"}
          </td>
          <td className="admin-td" style={{ width: 160 }}>{s.product_title ?? "-"}</td>
          <td className="admin-td" style={{ width: 120 }}>{s.product_type ?? "-"}</td>
          <td className="admin-td" style={{ width: 150 }}>{formatDateLocal(s.created_at)}</td>
          <td className="admin-td" style={{ width: 150 }}>{s.updated_at ? formatDateLocal(s.updated_at) : "-"}</td>
          <td className="admin-td" style={{ width: 90 }}>
            <ToggleSwitch
              checked={!!s.is_active}
              onChange={() => handleToggleActive(s.id, !!s.is_active)}
              size="sm"
              onLabel="ON"
              offLabel="OFF"
            />
          </td>
        </>
      );
    }}
  />
</>

      ) : (
        // 모바일/태블릿: 카드형
        <>
          <div style={{ display: "grid", gap: 12 }}>
          {viewRows.map((s, idx) => {
const rowNo = idx + 1;
const isSelected = selectedIds.includes(s.id);
              const toggleSelected = () => toggleOne(s.id, !isSelected);
              const sessionsCount = Number(s.sessions_count || 0);

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
                    <div style={{ fontSize: 13, color: "#999" }}>
                      S-{s.id}
                    </div>
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
                        e.stopPropagation();
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
                        cursor: "pointer",
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
                      const src =
                        s.thumbnail || s.image_url || s.product_image;
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
                                cursor: "default",
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
                        <span style={cardValue}>
                          {s.product_title || "-"}
                        </span>
                      </div>
                      <div style={cardRow}>
                        <span style={cardLabel}>유형</span>
                        <span style={cardValue}>
                          {s.product_type || "-"}
                        </span>
                      </div>
                      <div style={cardRow}>
                        <span style={cardLabel}>기간</span>
                        <span
  style={cardValue}
  title={sessionsCount >= 2 ? s.__sessionsTooltip : undefined}
>
  {sessionsCount <= 1 ? (
    <>
      {formatDateOnly(s.start_date)}
      <br />~{formatDateOnly(s.end_date)}
    </>
  ) : (
    `${sessionsCount}회차`
  )}
</span>

                      </div>

                      {/* 모집인원 */}
                      <div style={cardRow}>
  <span style={cardLabel}>모집</span>
  <span
    style={{ ...cardValue, cursor: sessionsCount > 1 ? "help" : "default" }}
    title={sessionsCount > 1 ? s.__seatsTooltip : undefined}
  >
    {sessionsCount > 1 ? `${sessionsCount}회차` : s.__seatsText}
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
                          {s.updated_at
                            ? formatDateLocal(s.updated_at)
                            : "-"}
                        </span>
                      </div>
                      <div
                        style={cardRow}
                        onClick={(e) => e.stopPropagation()}
                      >
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
                </>
      )}
    </div>
  );
}
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
