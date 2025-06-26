import React from "react";

export default function MobileSearchFilterBox({
  searchType,
  setSearchType,
  searchKeyword,
  setSearchKeyword,
  sort,
  setSort,
  order,
  setOrder,
  showPast,
  setShowPast,
  dateRange,
  setDateRange,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={{
            flexShrink: 0,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="전체">전체</option>
          <option value="교육명">교육명</option>
          <option value="교육기간">교육기간</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
          />
          <label htmlFor="showPast">지난 일정</label>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: "none",
              border: "none",
              fontSize: "14px",
              fontWeight: "normal",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            <option value="start_date">최신순</option>
            <option value="title">제목순</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            style={{
              background: "none",
              border: "none",
              fontSize: "14px",
              fontWeight: "normal",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select>
        </div>
      </div>

      {searchType === "교육기간" && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={{ fontSize: "13px", fontWeight: "bold" }}>기간:</label>
          <input
            type="date"
            value={
              dateRange.startDate
                ? new Date(dateRange.startDate).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) =>
              setDateRange({
                ...dateRange,
                startDate: new Date(e.target.value),
              })
            }
            style={{
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
          <span style={{ fontSize: "13px" }}>~</span>
          <input
            type="date"
            value={
              dateRange.endDate
                ? new Date(dateRange.endDate).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) =>
              setDateRange({
                ...dateRange,
                endDate: new Date(e.target.value),
              })
            }
            style={{
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
        </div>
      )}
    </div>
  );
}
