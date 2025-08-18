// ./frontend/components/admin/ProductTable.js
import React, { useState, useEffect, useMemo } from "react";
import SearchFilter from "@/components/common/SearchFilter";
import ProductSchedulesModal from "./ProductSchedulesModal";
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

export default function ProductTable({ onEdit }) {
  const isTabletOrBelow = useIsTabletOrBelow();

  // ✅ SSR 안정: 초기에는 데스크톱 DOM로 렌더 → 마운트 후 반응형 분기
  const [mounted, setMounted] = useState(false);
  const [showFilter, setShowFilter] = useState(false); // 초기 SSR과 동일하게 false
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    setShowFilter(!isTabletOrBelow); // 데스크톱=보임, 모바일=접힘
  }, [isTabletOrBelow, mounted]);

  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "updated_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  // 로딩/에러/빈 상태
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ 최초 데이터 로드
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const res = await api.get("admin/products", { params: { all: true } });
      if (res.data?.success) {
        setProducts(res.data.products);
        setProductTypes([
          ...new Set(res.data.products.map((p) => p.type).filter(Boolean)),
        ]);
      } else {
        setLoadError("상품 데이터를 불러오지 못했습니다.");
        showAlert("상품 데이터를 불러오지 못했습니다.");
      }
    } catch {
      setLoadError("상품 데이터를 불러오지 못했습니다.");
      showAlert("상품 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 검색/필터
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter((product) => {
      if (searchField === "id") return String(product.id).includes(q);
      if (searchField === "title")
        return (product.title || "").toLowerCase().includes(q);
      if (searchField === "type")
        return (product.type || "").toLowerCase().includes(q);
      if (searchField === "price")
        return String(product.price || "").includes(q);
      if (searchField === "is_active") {
        if (!q) return true;
        return String(product.is_active) === q; // '1'/'0' 방식이면 API에서 맞춰서 내려줌
      }
      if (searchField === "created_at" || searchField === "updated_at") {
        const date = product[searchField]
          ? new Date(product[searchField])
          : null;
        if (!date) return false;
        const startOnly = startDate
          ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
          : null;
        const endOnly = endDate
          ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
          : null;
        if (startOnly && date < startOnly) return false;
        if (endOnly && date > endOnly) return false;
        return true;
      }
      return true;
    });
  }, [products, searchField, searchQuery, startDate, endDate]);

  // ✅ 정렬
  const sortedProducts = useMemo(() => {
    if (!sortConfig) return filteredProducts;
    const { key, direction } = sortConfig;
    const getVal = (row) => {
      if (key === "is_active") return Number(!!row.is_active);
      return row[key];
    };
    return [...filteredProducts].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null && bv == null) return 0;
      if (av == null) return direction === "asc" ? -1 : 1;
      if (bv == null) return direction === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }
      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filteredProducts, sortConfig]);

  // ✅ 페이징
  const totalPages = useMemo(
    () => Math.ceil(sortedProducts.length / pageSize),
    [sortedProducts.length, pageSize]
  );
  const pagedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedProducts.slice(startIdx, startIdx + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // ✅ 체크박스
  const isAllChecked =
    pagedProducts.length > 0 &&
    pagedProducts.every((p) => selectedIds.includes(p.id));
  const toggleAll = (checked) =>
    setSelectedIds(checked ? pagedProducts.map((p) => p.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );

  // ✅ 정렬 핸들러/아이콘
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setCurrentPage(1);
  };
  const renderArrow = (key) => {
    if (sortConfig.key !== key)
      return <span style={{ marginLeft: 6, color: "#ccc" }}>↕</span>;
    return (
      <span style={{ marginLeft: 6, color: "#000" }}>
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  // ✅ 검색 초기화
  const handleReset = () => {
    setSearchField("title");
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // ✅ 삭제
  const handleDeleteSelected = async () => {
    const ok = await showConfirm("정말로 선택한 상품을 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await api.delete("admin/products", { data: { ids: selectedIds } });
      showAlert("삭제되었습니다.");
      setSelectedIds([]);
      await fetchProducts();
    } catch {
      showAlert("삭제 실패");
    }
  };

  // ✅ 활성/비활성 토글 (낙관적 업데이트)
  const handleToggleActive = async (id) => {
    const snapshot = products;
    const updated = products.map((p) =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    );
    setProducts(updated);
    try {
      await api.patch(`admin/products/${id}/active`);
      showAlert("상태가 변경되었습니다.");
    } catch {
      showAlert("상태 변경 실패");
      setProducts(snapshot); // 실패 시 원복
    }
  };

  const loading = isLoading;

  return (
    <div>
      {/* 상단 툴바 (공통) */}
      <AdminToolbar>
        <div className="toolbar-left">
          {mounted && showFilter ? (
            <div style={{ width: "100%" }}>
              <SearchFilter
                searchType={searchField}
                setSearchType={setSearchField}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                searchOptions={[
                  { value: "id", label: "코드", type: "text" },
                  { value: "title", label: "상품명", type: "text" },
                  {
                    value: "type",
                    label: "유형",
                    type: "select",
                    options: productTypes.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  },
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
                onSearchUpdate={(type, query) => {
                  setSearchField(type);
                  setSearchQuery(query);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
            <div style={{ height: 8 }} />
          )}
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
            onChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />

          <ExcelDownloadButton
            fileName="상품목록"
            sheetName="상품목록"
            headers={["상품명", "유형", "가격", "등록일시", "수정일시", "상태"]}
            data={sortedProducts.map((product) => ({
              상품명: product.title,
              유형: product.type,
              가격:
                typeof product.price === "number"
                  ? `${product.price.toLocaleString()}원`
                  : "-",
              등록일시: formatDateUTC(product.created_at),
              수정일시: product.updated_at
                ? formatDateUTC(product.updated_at)
                : "-",
              상태: product.is_active ? "활성" : "비활성",
            }))}
            extraSheets={[
              {
                name: "상품별_신청자목록",
                fetch: async () => {
                  const allRows = [];
                  for (const product of sortedProducts) {
                    const res = await api.get(
                      `admin/products/${product.id}/schedules`
                    );
                    const schedules = res.data.schedules || [];
                    for (const s of schedules) {
                      const r = await api.get(
                        `admin/schedules/${s.id}/students`
                      );
                      const students = r.data.students || [];
                      const mapped = students.map((stu) => ({
                        상품명: product.title,
                        일정명: s.title,
                        이름: stu.username,
                        이메일: stu.email,
                        수량: stu.quantity,
                        구분: stu.source,
                        신청일: formatDateUTC(stu.created_at),
                      }));
                      allRows.push(...mapped);
                    }
                  }
                  return allRows;
                },
              },
            ]}
          />
        </div>
      </AdminToolbar>

      {/* 본문: 로딩/에러/빈/목록 */}
      {loading ? (
        mounted && isTabletOrBelow ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={3} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={10} rows={6} />
        )
      ) : loadError ? (
        <div style={errorBox}>
          {loadError}
          <button
            style={{ ...primaryBtn, marginLeft: 10, background: "#e53e3e" }}
            onClick={fetchProducts}
          >
            다시 시도
          </button>
        </div>
      ) : products.length === 0 ? (
        <div style={emptyBox}>상품이 없습니다. 상품을 등록해 보세요.</div>
      ) : mounted && isTabletOrBelow ? (
        // ✅ 모바일/태블릿: 카드형
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {pagedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  ...cardShell,
                  opacity: product.is_active ? 1 : 0.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => toggleOne(product.id, e.target.checked)}
                  />
                  <div style={{ fontSize: 13, color: "#666" }}>
                    P-{product.id}
                  </div>
                </div>

                <div
                  style={{
                    color: "#0070f3",
                    fontWeight: 600,
                    marginTop: 8,
                    marginBottom: 6,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                  onClick={() => onEdit(product)}
                >
                  {product.title}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt="썸네일"
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          ...thumbEmpty,
                          width: 72,
                          height: 72,
                          borderRadius: 6,
                        }}
                      >
                        없음
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={cardRow}>
                      <span style={cardLabel}>유형</span>
                      <span style={cardValue}>{product.type || "-"}</span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>가격</span>
                      <span style={cardValue}>
                        {typeof product.price === "number"
                          ? `${product.price.toLocaleString()}원`
                          : "-"}
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>상태</span>
                      <span style={cardValue}>
                        <ToggleSwitch
                          checked={!!product.is_active}
                          onChange={() => handleToggleActive(product.id)}
                          aria-label="활성 전환"
                        />
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>등록</span>
                      <span style={cardValue}>
                        {formatDateUTC(product.created_at)}
                      </span>
                    </div>
                    <div style={cardRow}>
                      <span style={cardLabel}>수정</span>
                      <span style={cardValue}>
                        {product.updated_at
                          ? formatDateUTC(product.updated_at)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedProductId(product.id)}
                    style={scheduleButtonStyle}
                  >
                    일정
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        // ✅ 데스크톱: 테이블
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                <th style={thStyle}>
                  <input
                    type="checkbox"
                    onChange={(e) => toggleAll(e.target.checked)}
                    checked={isAllChecked}
                  />
                </th>
                <th style={thStyle} onClick={() => handleSort("id")}>
                  코드 {renderArrow("id")}
                </th>
                <th style={thStyle}>썸네일</th>
                <th style={thStyle} onClick={() => handleSort("title")}>
                  상품명 {renderArrow("title")}
                </th>
                <th style={thStyle} onClick={() => handleSort("type")}>
                  유형 {renderArrow("type")}
                </th>
                <th style={thStyle} onClick={() => handleSort("price")}>
                  가격 {renderArrow("price")}
                </th>
                <th style={thStyle} onClick={() => handleSort("is_active")}>
                  상태 {renderArrow("is_active")}
                </th>
                <th style={thStyle} onClick={() => handleSort("created_at")}>
                  등록일시 {renderArrow("created_at")}
                </th>
                <th style={thStyle} onClick={() => handleSort("updated_at")}>
                  수정일시 {renderArrow("updated_at")}
                </th>
                <th style={thStyle}>일정</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((product, index) => (
                <tr
                  key={product.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                    opacity: product.is_active ? 1 : 0.45,
                    height: 80,
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => toggleOne(product.id, e.target.checked)}
                    />
                  </td>
                  <td style={tdStyle}>P-{product.id}</td>
                  <td style={tdStyle}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt="썸네일"
                        style={{ width: 60, height: 60, objectFit: "cover" }}
                      />
                    ) : (
                      <div style={thumbEmpty}>
                        썸네일
                        <br />
                        없음
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span
                      onClick={() => onEdit(product)}
                      style={{ color: "#0070f3", cursor: "pointer" }}
                    >
                      {product.title}
                    </span>
                  </td>
                  <td style={tdStyle}>{product.type}</td>
                  <td style={tdStyle}>
                    {typeof product.price === "number"
                      ? `${product.price.toLocaleString()}원`
                      : "-"}
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ToggleSwitch
                        checked={!!product.is_active}
                        onChange={() => handleToggleActive(product.id)}
                        aria-label="활성 전환"
                      />
                    </div>
                  </td>
                  <td style={tdStyle}>{formatDateUTC(product.created_at)}</td>
                  <td style={tdStyle}>
                    {product.updated_at
                      ? formatDateUTC(product.updated_at)
                      : "-"}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setSelectedProductId(product.id)}
                      style={scheduleButtonStyle}
                    >
                      일정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {selectedProductId && (
        <ProductSchedulesModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      <style jsx>{`
        .admin-toolbar {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 12px 16px;
          margin-bottom: 16px;
        }
        .toolbar-left {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .filter-toggle {
          display: none;
        }
        @media (max-width: 980px) {
          .admin-toolbar {
            grid-template-columns: 1fr;
          }
          .toolbar-left,
          .toolbar-right {
            width: 100%;
          }
          .toolbar-right {
            justify-content: space-between;
            gap: 8px;
          }
          .filter-toggle {
            display: inline-flex;
          }
        }
      `}</style>
    </div>
  );
}

/* 테이블 공통 */
const thStyle = {
  padding: "10px",
  textAlign: "center",
  cursor: "pointer",
};
const tdStyle = {
  padding: "10px",
  textAlign: "center",
};

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
const scheduleButtonStyle = {
  padding: "6px 10px",
  backgroundColor: "#6c63ff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
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
