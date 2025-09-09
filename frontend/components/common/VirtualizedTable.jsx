import { useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * VirtualizedTable
 * - columns: [{ key, title, width, headerRender?, onClickHeader? }]
 * - items: any[]
 * - rowHeight: number (px)
 * - height: number (px) // 스크롤 높이
 * - overscan?: number
 * - renderRowCells: ({ item, index }) => ReactNode  // <td>... 요소들 반환
 * - resetKey?: any  // 바뀔 때 스크롤 최상단 복귀
 * - tableClassName?: string
 */
export default function VirtualizedTable({
  columns = [],
  items = [],
  rowHeight = 48,
  height = 560,
  overscan = 8,
  renderRowCells,
  resetKey,
  tableClassName = "admin-table",
}) {
  const scrollRef = useRef(null);

  const colSpan = columns.length;
  const colGroup = useMemo(
    () => (
      <colgroup>
        {columns.map((c, i) => (
          <col key={c.key ?? i} style={{ width: c.width, minWidth: c.width }} />
        ))}
      </colgroup>
    ),
    [columns]
  );

  // 가상 리스트
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length
    ? totalSize - virtualItems[virtualItems.length - 1].end
    : 0;

  // reset 시 스크롤 상단으로
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [resetKey]);

  return (
    <div style={{ overflowX: "auto" }}>
      {/* 헤더 전용 테이블 */}
      <table className={tableClassName} style={{ tableLayout: "fixed", width: "100%" }}>
        {colGroup}
        <thead style={{ backgroundColor: "#f9f9f9" }}>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.key ?? i}
                className="admin-th"
                onClick={c.onClickHeader}
                style={c.onClickHeader ? { cursor: "pointer" } : undefined}
              >
                {typeof c.headerRender === "function" ? c.headerRender() : c.title}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* 바디 전용 + 스크롤 컨테이너 */}
      <div ref={scrollRef} style={{ height, overflowY: "auto" }}>  {/* ← 고정 높이 */}
  <table className={tableClassName} style={{ tableLayout: "fixed", width: "100%" }}>
    {colGroup}
    <tbody>
            {/* 패딩 상단 */}
            {paddingTop > 0 && (
              <tr style={{ height: paddingTop, display: "table", width: "100%" }}>
                <td colSpan={colSpan} style={{ padding: 0, border: "none", height: paddingTop }} />
              </tr>
            )}

            {/* 가시 구간만 렌더 */}
            {virtualItems.map((vi) => {
              const index = vi.index;
              const item = items[index];
              if (!item) return null;
              return (
                <tr
                key={item.id ?? index}
                style={{ height: rowHeight }}   // ← display/tableLayout/width 제거
              >
                {renderRowCells({ item, index })}
              </tr>
              
              );
            })}

            {/* 패딩 하단 */}
            {paddingBottom > 0 && (
              <tr style={{ height: paddingBottom, display: "table", width: "100%" }}>
                <td colSpan={colSpan} style={{ padding: 0, border: "none", height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
