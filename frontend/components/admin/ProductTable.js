// ✅ 수정 후: ProductTable.js (SchedulesTable처럼 구조 통일)
import React, { useState, useEffect, useMemo } from "react";
import SearchFilter from "@/components/common/SearchFilter";
import ProductSchedulesModal from "./ProductSchedulesModal";
import api from "@/lib/api";
import PaginationControls from "@/components/common/PaginationControls";
import { toast } from "react-toastify";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";

export default function ProductTable({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchField, setSearchField] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  // ✅ 기본 정렬을 is_active로 변경
  const [sortConfig, setSortConfig] = useState({
    key: "is_active",
    direction: "desc", // 활성 먼저 보이도록
  });

  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async () => {
    try {
      const res = await api.get("admin/products", { params: { all: true } });
      if (res.data.success) {
        setProducts(res.data.products);
        const types = [
          ...new Set(res.data.products.map((p) => p.type).filter(Boolean)),
        ];
        setProductTypes(types);
      }
    } catch (err) {
      toast.error("상품 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 위치: fetchProducts() 호출 useEffect 아래쪽
  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      if (searchField === "id") return String(product.id).includes(query);
      if (searchField === "title")
        return product.title?.toLowerCase().includes(query);
      if (searchField === "type")
        return product.type?.toLowerCase().includes(query);
      if (searchField === "price") return String(product.price).includes(query);
      if (searchField === "is_active") {
        if (!query) return true;
        return String(product.is_active) === query;
      }
      if (searchField === "created_at") {
        if (!startDate && !endDate) return true;
        const created = new Date(product.created_at);
        if (startDate && created < startDate) return false;
        if (endDate && created > endDate) return false;
        return true;
      }
      if (searchField === "updated_at") {
        if (!startDate && !endDate) return true;
        const updated = new Date(product.updated_at);
        if (startDate && updated < startDate) return false;
        if (endDate && updated > endDate) return false;
        return true;
      }
      return true;
    });
  }, [products, searchField, searchQuery, startDate, endDate]);

  const sortedProducts = useMemo(() => {
    if (!sortConfig) return filteredProducts;
    const { key, direction } = sortConfig;

    return [...filteredProducts].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "is_active" || key === "id" || typeof aValue === "number") {
        aValue = Number(aValue);
        bValue = Number(bValue);
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredProducts, sortConfig]);

  const pagedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  useEffect(() => {
    fetchProducts();
  }, [pageSize]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
    setCurrentPage(1);
  };

  const renderArrow = (key) => {
    const baseStyle = { marginLeft: "6px", fontSize: "12px" };
    if (!sortConfig || sortConfig.key !== key)
      return <span style={{ ...baseStyle, color: "#ccc" }}>↕</span>;
    return (
      <span style={{ ...baseStyle, color: "#000" }}>
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const isAllChecked =
    pagedProducts.length > 0 &&
    pagedProducts.every((p) => selectedIds.includes(p.id));

  const toggleAll = (checked) => {
    setSelectedIds(checked ? pagedProducts.map((p) => p.id) : []);
  };

  const toggleOne = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("정말로 선택한 상품을 삭제하시겠습니까?")) return;
    try {
      await api.delete("admin/products", { data: { ids: selectedIds } });
      toast.success("삭제되었습니다.");
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error("삭제 실패");
    }
  };

  const handleToggleActive = async (id) => {
    const updatedList = products.map((p) =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    );
    setProducts(updatedList); // ✅ 내부 상태 직접 반영
    try {
      await api.patch(`admin/products/${id}/active`);
      toast.success("상태가 변경되었습니다.");
    } catch (err) {
      toast.error("상태 변경 실패");
      fetchProducts(); // 실패 시 다시 fetch로 원상복구
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
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
            }}
          />

          <button
            onClick={handleReset}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "6px",
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
          {/* ✅ 페이지당 항목 수 드롭다운 */}
          <PageSizeSelector
            value={pageSize}
            onChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
          <ExcelDownloadButton
            fileName="상품목록"
            sheetName="상품목록"
            headers={["상품명", "유형", "가격", "등록일", "수정일"]}
            data={sortedProducts.map((product) => ({
              상품명: product.title,
              유형: product.type,
              가격: `${Number(product.price).toLocaleString()}원`,
              등록일시: new Date(product.created_at).toLocaleString(),
              수정일시: product.updated_at
                ? new Date(product.updated_at).toLocaleString()
                : "-",
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
                        신청일: new Date(stu.created_at).toLocaleString(),
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
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
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
            <th style={thStyle}>
              <label
                onClick={() => handleSort("is_active")}
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "42px",
                  height: "24px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor:
                      sortConfig?.key !== "is_active"
                        ? "#bbb"
                        : sortConfig.direction === "asc"
                          ? "#bbb"
                          : "#28a745",
                    borderRadius: "24px",
                    transition: "0.3s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      height: "18px",
                      width: "18px",
                      left:
                        sortConfig?.key === "is_active" &&
                        sortConfig.direction === "desc"
                          ? "21px"
                          : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.3s",
                    }}
                  />
                </span>
              </label>
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
                opacity: product.is_active ? 1 : 0.4,
                height: 80, // ✅ 모든 row 고정 height
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
                  <div
                    style={{
                      height: 60,
                      border: "1px dashed #ccc",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#aaa",
                      fontSize: 12,
                      width: "100%", // ✅ td 영역 전체 기준
                    }}
                  >
                    썸네일 없음
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
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "42px",
                    height: "24px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={product.is_active}
                    onChange={() => handleToggleActive(product.id)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: product.is_active ? "#28a745" : "#ccc",
                      borderRadius: "24px",
                      transition: "0.4s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        width: "18px",
                        height: "18px",
                        left: product.is_active ? "21px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        transition: "0.4s",
                      }}
                    />
                  </span>
                </label>
              </td>
              <td style={tdStyle}>
                {new Date(product.created_at).toLocaleString()}
              </td>
              <td style={tdStyle}>
                {product.updated_at
                  ? new Date(product.updated_at).toLocaleString()
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

      {selectedProductId && (
        <ProductSchedulesModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}

const thStyle = {
  padding: "10px",
  textAlign: "center",
  cursor: "pointer",
};
const tdStyle = {
  padding: "10px",
  textAlign: "center",
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
