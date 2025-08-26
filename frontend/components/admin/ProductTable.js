// /frontend/components/admin/ProductTable.js
import { useMemo, useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { formatPrice } from "@/lib/format";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import dynamic from "next/dynamic";
import SelectableCard from "@/components/common/SelectableCard";

// ✅ 내부 툴바/필터/엑셀/페이지네이션
import AdminToolbar from "@/components/common/AdminToolbar";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";

/** 로컬시간 포맷 (YYYY-MM-DD HH:mm:ss) */
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

// ✅ 모달(안전 가드)
const ProductSchedulesModal = dynamic(
  () =>
    import("@/components/admin/ProductSchedulesModal").then((m) => {
      const C = m?.default ?? m?.ProductSchedulesModal;
      return typeof C === "function" ? C : () => null;
    }),
  { ssr: false }
);

export default function ProductTable({
  onEdit,       // 선택: 행 클릭 시 수정 열기 콜백
  onLoaded,     // 선택: 목록/카운트 수신 시 상단 카드 등과 동기화
  onExcelData,  // 선택: 외부에서 엑셀 버튼 따로 쓸 때
}) {
  const isTabletOrBelow = useIsTabletOrBelow();
  const { showAlert } = useGlobalAlert?.() ?? { showAlert: () => {} };
  const { showConfirm } = useGlobalConfirm?.() ?? { showConfirm: async () => true };

  // Hydration 가드
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isNarrow = mounted && isTabletOrBelow;

  // 🔹 모바일 첫 진입도 자동 로드
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  useEffect(() => {
    if (!mounted) return;
    setAutoFetchEnabled(true);
  }, [mounted]);

  // 상태(페이지/정렬/검색)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: "updated_at", direction: "desc" });

  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(null);

  // 목록/총합/로딩/에러
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  // 선택/모달
  const [selectedIds, setSelectedIds] = useState([]);
  const [scheduleProductId, setScheduleProductId] = useState(null);

  const isAllChecked = rows.length > 0 && rows.every((p) => selectedIds.includes(p.id));
  const toggleAll = (checked) => setSelectedIds(checked ? rows.map((p) => p.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  // rows 변경 시 선택 정합성 보정
  useEffect(() => {
    const ids = new Set((rows || []).map((p) => p.id));
    setSelectedIds((prev) => prev.filter((id) => ids.has(id)));
  }, [rows]);

  // 표시값 가공
  const processedRows = useMemo(() => {
    const toText = (v, fallback = "-") =>
      v == null
        ? fallback
        : typeof v === "string"
        ? v
        : typeof v === "number"
        ? String(v)
        : v?.label ?? v?.name ?? fallback;

    return (rows || []).map((p) => {
      const code = toText(p.code, `P-${p.id}`);
      const title = toText(p.title, toText(p.name, "(제목 없음)"));
      const type = toText(p.type, "-");
      const priceText = `${formatPrice(Number(p.price ?? 0))}원`;
      const isActive = Number(p.is_active) === 1;
      const thumb =
        p.image_url ||
        p.thumbnail_url ||
        p.thumb_url ||
        (Array.isArray(p.images) ? p.images[0] : "") ||
        "";
      return { ...p, code, title, type, priceText, isActive, thumb };
    });
  }, [rows]);

  // 엑셀
  const excelHeaders = useMemo(
    () => ["ID", "코드", "상품명", "유형", "가격", "상태", "등록일시", "수정일시"],
    []
  );
  const excelRows = useMemo(
    () =>
      rows.map((p) => ({
        ID: p.id,
        코드: p.code ?? `P-${p.id}`,
        상품명: p.title ?? p.name ?? "(제목 없음)",
        유형: p.type ?? "-",
        가격: Number(p.price ?? 0),
        상태: Number(p.is_active) === 1 ? "활성" : "비활성",
        등록일시: formatDateLocal(p.created_at),
        수정일시: formatDateLocal(p.updated_at),
      })),
    [rows]
  );
  useEffect(() => {
    if (typeof onExcelData === "function") {
      onExcelData({ headers: excelHeaders, data: excelRows });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelRows]);

  // fetch 트리거 키
  const refreshKey = useMemo(
    () =>
      [
        page,
        pageSize,
        sortConfig.key,
        sortConfig.direction,
        searchField,
        searchQuery,
        startDate,
        endDate,
        isNarrow,
      ].join("|"),
    [page, pageSize, sortConfig.key, sortConfig.direction, searchField, searchQuery, startDate, endDate, isNarrow]
  );

  // 목록 조회(AbortController)
  const abortRef = useRef(null);
  const fetchProducts = async (signal) => {
    try {
      setIsFetching(true);
      setLoadError("");

      const toDate = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v || undefined);

      const params = {
        page,
        pageSize,
        // 정렬 호환
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
        sort: sortConfig.key,
        order: sortConfig.direction,
        // 검색
        searchField,
        searchQuery,
      };

      if (["created_at", "updated_at"].includes(searchField)) {
        const sd = toDate(startDate);
        const ed = toDate(endDate);
        if (sd) params.start_date = sd;
        if (ed) params.end_date = ed;
      }

      const res = await api.get("admin/products", { params, signal });
      if (res.data?.success) {
        const list = res.data.products || res.data.items || res.data.rows || [];
        const tc =
          res.data.total ??
          res.data.totalCount ??
          res.data.pagination?.total ??
          (Array.isArray(list) ? list.length : 0);

        setRows(list);
        setTotal(Number(tc) || 0);
        onLoaded?.({ totalCount: Number(tc) || 0 });
      } else {
        setLoadError("상품 목록을 불러오지 못했습니다.");
      }
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setLoadError("상품 목록 조회 실패");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!mounted || !autoFetchEnabled) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchProducts(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, autoFetchEnabled, refreshKey]);

  // 변경 요청(runOp): 삭제/토글 경합 방지
  const opAbortRef = useRef(null);
  const runOp = async (fn) => {
    if (opAbortRef.current) opAbortRef.current.abort();
    const controller = new AbortController();
    opAbortRef.current = controller;
    try {
      return await fn(controller.signal);
    } finally {
      if (opAbortRef.current === controller) opAbortRef.current = null;
    }
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const ok = await showConfirm("정말로 선택한 상품을 삭제하시겠습니까?");
    if (!ok) return;

    const ids = Array.from(new Set(selectedIds.map(Number))).filter((n) => n > 0);
    try {
      await runOp(async (signal) => {
        await api.request({
          method: "delete",
          url: "admin/products",
          headers: { "Content-Type": "application/json" },
          data: { ids },
          signal,
        });
      });
      showAlert("삭제되었습니다.");
      setSelectedIds([]);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchProducts(controller.signal);
    } catch (e1) {
      if (e1?.response?.status === 409 && e1?.response?.data?.code === "HAS_DEPENDENCIES") {
        const det = e1.response.data.details || {};
        const sc = (det.scheduleBlocks || []).reduce((a, b) => a + (b.schedule_count || 0), 0);
        const rc = (det.reviewBlocks || []).reduce((a, b) => a + (b.review_count || 0), 0);
        const lines = ["삭제 불가: 연결된 데이터가 있습니다."];
        if (Number(sc) > 0) lines.push(`• 일정: ${sc}건`);
        if (Number(rc) > 0) lines.push(`• 후기: ${rc}건`);
        lines.push("관련 데이터를 먼저 정리한 후 삭제하세요.");
        showAlert(lines.join("\n"));
        return;
      }

      try {
        await runOp(async (signal) => {
          await api.delete("admin/products", { params: { ids: ids.join(",") }, signal });
        });
        showAlert("삭제되었습니다.");
        setSelectedIds([]);

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        fetchProducts(controller.signal);
      } catch {
        showAlert("삭제 실패");
      }
    }
  };

  // 단축 삭제 이벤트
  useEffect(() => {
    const handler = () => {
      if (!selectedIds || selectedIds.length === 0) return;
      (async () => {
        await handleDeleteSelected();
      })();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("products:deleteSelected", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("products:deleteSelected", handler);
      }
    };
  }, [selectedIds]);

  // 상태 토글
  const handleToggleActive = async (product) => {
    const nextActive = Number(product.is_active) === 1 ? 0 : 1;
    const ok = await showConfirm("상태를 변경하시겠습니까?");
    if (!ok) return;

    try {
      await runOp(async (signal) => {
        await api.put(
          `admin/products/${product.id}/active`,
          { is_active: nextActive },
          { signal }
        );
      });
      showAlert("상태가 변경되었습니다.");

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchProducts(controller.signal);
    } catch {
      showAlert("상태 변경 실패");
    }
  };

  // 초기화
  const handleReset = () => {
    setPage(1);
    setPageSize(20);
    setSortConfig({ key: "updated_at", direction: "desc" });
    setSearchQuery("");
    setSearchField("title");
    setStartDate(null);
    setEndDate(null);
  };

  // 페이징
  const totalPages = useMemo(() => Math.ceil((total || 0) / pageSize), [total, pageSize]);

  // 열 너비(colgroup)
  const COL_W = {
    sel: 44,
    no: 60,
    code: 100,
    thumb: 84,
    title: 240,
    type: 120,
    price: 120,
    created: 160,
    updated: 160,
    schedule: 100,
    status: 96,
  };
  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: COL_W.sel, minWidth: COL_W.sel }} />
      <col style={{ width: COL_W.no, minWidth: COL_W.no }} />
      <col style={{ width: COL_W.code, minWidth: COL_W.code }} />
      <col style={{ width: COL_W.thumb, minWidth: COL_W.thumb }} />
      <col style={{ width: COL_W.title, minWidth: COL_W.title }} />
      <col style={{ width: COL_W.type, minWidth: COL_W.type }} />
      <col style={{ width: COL_W.price, minWidth: COL_W.price }} />
      <col style={{ width: COL_W.created, minWidth: COL_W.created }} />
      <col style={{ width: COL_W.updated, minWidth: COL_W.updated }} />
      <col style={{ width: COL_W.schedule, minWidth: COL_W.schedule }} />
      <col style={{ width: COL_W.status, minWidth: COL_W.status }} />
    </colgroup>
  );

  return (
    <div>
      {/* 상단 툴바 */}
      <AdminToolbar>
    <div className="toolbar-left">
      {mounted && (
        <AdminSearchFilter
          searchType={searchField}
          setSearchType={setSearchField}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onSearchClick={({ type, query }) => {
            setSearchField(type ?? "title");
            setSearchQuery(query ?? "");
            setPage(1);
            setAutoFetchEnabled(true);
          }}
          searchOptions={[
            { value: "title", label: "상품명", type: "text" },
            { value: "code", label: "코드", type: "text" },
            { value: "type", label: "유형", type: "text" },
            { value: "price", label: "가격", type: "number" },
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
      )}


    <button onClick={handleReset} style={resetBtn}>
      초기화
    </button>
  </div>

        <div className="toolbar-right">
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
              setAutoFetchEnabled(true);
            }}
          />

          <ExcelDownloadButton
            fileName="상품목록"
            sheetName="Products"
            headers={excelHeaders}
            data={excelRows}
          />
        </div>
      </AdminToolbar>

      {/* 본문 */}
      {isFetching ? (
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
        <div style={errorBox}>
          {loadError}
          <button
            style={{ ...primaryBtn, marginLeft: 10, background: "#e53e3e" }}
            onClick={() => {
              if (abortRef.current) abortRef.current.abort();
              const controller = new AbortController();
              abortRef.current = controller;
              fetchProducts(controller.signal);
            }}
          >
            다시 시도
          </button>
        </div>
      ) : total === 0 && rows.length === 0 ? (
        <div style={emptyBox}>상품이 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.</div>
      ) : !isNarrow ? (
        // 데스크톱: 테이블
        <>
          <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ tableLayout: "fixed", width: "100%" }}>
              {renderColGroup()}
              <thead style={{ backgroundColor: "#f9f9f9" }}>
                <tr>
                  <th className="admin-th">
                    <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "id",
                        direction: p.key === "id" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    No
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "code",
                        direction: p.key === "code" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    코드
                  </th>
                  <th className="admin-th">썸네일</th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "title",
                        direction: p.key === "title" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    상품명
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "type",
                        direction: p.key === "type" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    유형
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "price",
                        direction: p.key === "price" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    가격
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "created_at",
                        direction: p.key === "created_at" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    등록일시
                  </th>
                  <th
                    className="admin-th"
                    onClick={() => {
                      setPage(1);
                      setSortConfig((p) => ({
                        key: "updated_at",
                        direction: p.key === "updated_at" && p.direction === "asc" ? "desc" : "asc",
                      }));
                    }}
                  >
                    수정일시
                  </th>
                  <th className="admin-th">일정</th>
                  <th className="admin-th">상태</th>
                </tr>
              </thead>

              <tbody>
                {processedRows.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                      opacity: p.isActive ? 1 : 0.6,
                    }}
                  >
                    <td className="admin-td">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => toggleOne(p.id, e.target.checked)}
                      />
                    </td>
                    <td className="admin-td">{(page - 1) * pageSize + (idx + 1)}</td>
                    <td
                      className="admin-td"
                      title={p.code}
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {p.code}
                    </td>

                    <td className="admin-td">
  {p.thumb ? (
    <img
      src={p.thumb}
      alt="thumbnail"
      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
      loading="lazy"
    />
  ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            border: "1px dashed #ddd",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#aaa",
                            fontSize: 12,
                          }}
                        >
                          썸네일
                          <br />
                          없음
                        </div>
                      )}
                    </td>

                    <td
                      className="admin-td"
                      title={p.title}
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={() => onEdit?.(p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") onEdit?.(p);
                        }}
                        style={{ color: "#0070f3", cursor: "pointer", textDecoration: "none" }}
                      >
                        {p.title}
                      </span>
                    </td>
                    <td className="admin-td">{p.type}</td>
                    <td className="admin-td">{p.priceText}</td>
                    <td className="admin-td">{formatDateLocal(p.created_at)}</td>
                    <td className="admin-td">{formatDateLocal(p.updated_at)}</td>
                    <td className="admin-td">
                      <button style={ghostBtn} onClick={() => setScheduleProductId(p.id)}>
                        일정
                      </button>
                    </td>

                    <td className="admin-td">
                      {typeof ToggleSwitch === "function" ? (
                        <ToggleSwitch
                          size="sm"
                          checked={p.isActive}
                          onChange={() => handleToggleActive(p)}
                          onLabel="ON"
                          offLabel="OFF"
                        />
                      ) : (
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <input type="checkbox" checked={p.isActive} onChange={() => handleToggleActive(p)} />
                          <span style={{ fontSize: 12, color: "#555" }}>{p.isActive ? "ON" : "OFF"}</span>
                        </label>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
    ) : (
      // 모바일/태블릿: 카드형
      <>
        <div style={{ display: "grid", gap: 12 }}>
          {processedRows.map((p, idx) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <SelectableCard
                key={p.id}
                selected={isSelected}
                onToggle={() => toggleOne(p.id, !isSelected)}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  opacity: p.isActive ? 1 : 0.6,
                }}
              >
                {/* 상단 체크 + No + 코드 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleOne(p.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ fontSize: 13, color: "#666" }}>
                      No. {(page - 1) * pageSize + (idx + 1)}
                    </div>
                    <div style={{ fontSize: 13, color: "#999" }}>
                      P-{p.id}
                    </div>
                  </div>
    
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch
                      size="sm"
                      checked={p.isActive}
                      onChange={() => handleToggleActive(p)}
                      onLabel="ON"
                      offLabel="OFF"
                    />
                  </div>
                </div>
    
                {/* 제목(텍스트만 클릭) */}
                <div style={{ color: "#222", fontWeight: 700, cursor: "default" }}>
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(p);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit?.(p);
                      }
                    }}
                    style={{
                      color: "#0070f3",
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                  >
                    {p.title}
                  </span>
                </div>
    
                {/* 썸네일 + 라벨/값 */}
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <div style={{ width: 72, height: 72, position: "relative", flex: "0 0 72px" }}>
                    {p.thumb ? (
                     <img
                     src={p.thumb}
                     alt="thumbnail"
                     style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                     loading="lazy"
                   />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          border: "1px dashed #ddd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#aaa",
                          fontSize: 12,
                        }}
                      >
                        no image
                      </div>
                    )}
                  </div>
    
                  <div style={{ flex: 1, fontSize: 14, color: "#374151" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
                      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>유형</span>
                      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>{p.type || "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
                      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>가격</span>
                      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>{p.priceText}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
                      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>등록</span>
                      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>{formatDateLocal(p.created_at)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
                      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>수정</span>
                      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>{formatDateLocal(p.updated_at)}</span>
                    </div>
                  </div>
                </div>
    
                {/* 액션 */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 10,
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setScheduleProductId(p.id)} style={ghostBtn}>
                      일정
                    </button>
                    <button onClick={() => onEdit?.(p)} style={primaryBtn}>
                      수정
                    </button>
                  </div>
                </div>
              </SelectableCard>
            );
          })}
        </div>
    
        <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      </>
    )}
    

      {/* 일정 모달 */}
      {scheduleProductId && typeof ProductSchedulesModal === "function" && (
        <ProductSchedulesModal productId={scheduleProductId} onClose={() => setScheduleProductId(null)} />
      )}
    </div>
  );
}

/* 공통 카드 라벨/값 한 줄 */
function Row({ label, value }) {
  const toText = (v) =>
    v == null ? "-" : typeof v === "string" || typeof v === "number" ? String(v) : v?.label ?? v?.name ?? "-";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px dashed #f0f0f0",
      }}
    >
      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>{toText(label)}</span>
      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>{toText(value)}</span>
    </div>
  );
}

/* 버튼/상태박스 */
const primaryBtn = {
  padding: "6px 10px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const ghostBtn = {
  padding: "6px 10px",
  backgroundColor: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
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
