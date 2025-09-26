import DateRangeSelector from "@/components/common/DateRangeSelector";

export default function SearchFilterBox({
  searchType,
  setSearchType,
  searchKeyword,
  setSearchKeyword,
  dateRange,
  setDateRange,
  sort,
  setSort,
  order,
  setOrder,
  showPast,
  setShowPast,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
        marginBottom: 20,
      }}
    >
      {/* 좌측: 검색 조건 */}
      <div style={{ display: "flex", gap: 12, flex: 1 }}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={{
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          <option value="전체">전체</option>
          <option value="교육명">교육명</option>
          <option value="교육기간">교육기간</option>
        </select>

        {(searchType === "전체" || searchType === "교육명") && (
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                padding: "4px 8px",
                paddingRight: 24,
                borderRadius: 4,
                border: "1px solid #ccc",
                fontSize: 14,
                width: "100%",
              }}
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#999",
                  padding: 0,
                }}
                aria-label="검색어 초기화"
              >
                ×
              </button>
            )}
          </div>
        )}

        {searchType === "교육기간" && (
          <DateRangeSelector
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
  {showPast !== undefined && setShowPast && (
    <label style={{ fontSize: 13, color: "#333" }}>
      <input
        type="checkbox"
        checked={showPast}
        onChange={() => setShowPast(!showPast)}
        style={{ marginRight: 6 }}
      />
      지난 일정 포함
    </label>
  )}

  <select
    value={sort}
    onChange={(e) => setSort(e.target.value)}
    style={{
      padding: "6px 10px",
      borderRadius: 6,
      border: "1px solid #ccc",
      fontSize: 14,
    }}
  >
    <option value="start_date">최신순</option>
    <option value="created_at">등록일순</option>
  </select>

  <select
    value={order}
    onChange={(e) => setOrder(e.target.value)}
    style={{
      padding: "6px 10px",
      borderRadius: 6,
      border: "1px solid #ccc",
      fontSize: 14,
    }}
  >
    <option value="asc">오름차순</option>
    <option value="desc">내림차순</option>
  </select>
</div>

    </div>
  );
}
