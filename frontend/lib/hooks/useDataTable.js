// ./frontend/lib/hooks/useDataTable.js
import { useCallback, useMemo, useState } from "react";

/**
 * 공통 데이터 테이블 훅
 * - page / pageSize / sort / selectedIds
 * - handleSort / toggleAll / toggleOne / isAllChecked / totalPages
 *
 * @param {Object} opts
 * @param {number} opts.pageSizeInitial
 * @param {{key:string,direction:'asc'|'desc'}|null} opts.sortInitial
 * @param {number|null} opts.serverTotal  // 서버 페이징 쓰면 total 전달 (없으면 클라이언트 길이 기반)
 */
export default function useDataTable({
  pageSizeInitial = 20,
  sortInitial = null,
  serverTotal = null,
} = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeInitial);
  const [sort, setSort] = useState(sortInitial);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSort = useCallback((key) => {
    setSort((prev) =>
      !prev || prev.key !== key
        ? { key, direction: "asc" }
        : { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    );
    setPage(1);
  }, []);

  const toggleAll = useCallback((items, idSelector, checked) => {
    const ids = items.map(idSelector);
    setSelectedIds(checked ? ids : []);
  }, []);

  const toggleOne = useCallback((id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const isAllChecked = useCallback(
    (items, idSelector) => {
      if (items.length === 0) return false;
      const ids = items.map(idSelector);
      return ids.every((id) => selectedIds.includes(id));
    },
    [selectedIds]
  );

  const getTotalPages = useCallback(
    (itemsLength) => {
      const total = serverTotal ?? itemsLength;
      return Math.max(1, Math.ceil(total / pageSize));
    },
    [serverTotal, pageSize]
  );

  const pagination = useMemo(
    () => ({ page, setPage, pageSize, setPageSize }),
    [page, pageSize]
  );

  return {
    // state
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    setSort,
    selectedIds,
    setSelectedIds,

    // helpers
    handleSort,
    toggleAll,
    toggleOne,
    isAllChecked,
    getTotalPages,

    // group
    pagination,
  };
}
