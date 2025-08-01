import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SearchFilter({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  searchOptions = [],
  onSearchUpdate,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  isMobile = false, // 필요하면 부모에서 전달
}) {
  const currentOption = searchOptions.find((opt) => opt.value === searchType);

  const commonStyle = {
    padding: isMobile ? "10px 12px" : "8px",
    fontSize: isMobile ? "15px" : "14px",
    borderRadius: "7px",
    border: "1px solid #ccc",
    marginBottom: isMobile ? "8px" : 0,
    width: isMobile ? "100%" : undefined,
    boxSizing: "border-box",
    background: "#fff",
  };

  const wrapStyle = isMobile
    ? {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "stretch",
        width: "100%",
        background: "#f8f9fa",
        borderRadius: 10,
        padding: "14px 10px",
        marginBottom: 12,
      }
    : {
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexWrap: "wrap",
        background: "#f8f9fa",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 20,
      };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setSearchType(newType);
    setSearchQuery("");
    onSearchUpdate(newType, "");
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchUpdate(searchType, value);
  };

  return (
    <div className="search-filter-root" style={wrapStyle}>
      {/* 검색 대상 타입 선택 */}
      <select
        value={searchType}
        onChange={handleTypeChange}
        style={{
          ...commonStyle,
          width: isMobile ? "100%" : "140px",
          minWidth: isMobile ? undefined : 80,
          background: "#fff",
          color: "#222",
          fontWeight: 500,
        }}
      >
        {searchOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 검색 조건 입력 */}
      {currentOption?.type === "date" ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: isMobile ? "100%" : undefined,
          }}
        >
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="시작 날짜"
            dateFormat="yyyy-MM-dd"
            customInput={
              <input
                style={{
                  ...commonStyle,
                  width: isMobile ? "100%" : "140px",
                  height: "40px",
                  background: "#fff",
                }}
              />
            }
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="종료 날짜"
            dateFormat="yyyy-MM-dd"
            customInput={
              <input
                style={{
                  ...commonStyle,
                  width: isMobile ? "100%" : "140px",
                  height: "40px",
                  background: "#fff",
                }}
              />
            }
          />
        </div>
      ) : currentOption?.type === "select" &&
        Array.isArray(currentOption.options) ? (
        <select
          value={searchQuery}
          onChange={handleQueryChange}
          style={{
            ...commonStyle,
            width: isMobile ? "100%" : "180px",
            height: "40px",
            background: "#fff",
            color: "#222",
            fontWeight: 500,
          }}
        >
          <option value="">전체</option>
          {currentOption.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="검색어 입력"
          value={searchQuery}
          onChange={handleQueryChange}
          style={{
            ...commonStyle,
            width: isMobile ? "100%" : "340px", // 넉넉하게
            minWidth: isMobile ? undefined : "220px", // 줄여도 220px 이하 안 내려감
            maxWidth: isMobile ? "100%" : "450px",
            padding: isMobile ? "10px 12px" : "10px 18px",
            fontSize: isMobile ? "15px" : "15.5px",
            fontWeight: 500,
            height: "40px",
            border: "1.5px solid #d2dbe7",
            background: "#fff",
            color: "#222",
            letterSpacing: 0.01,
          }}
        />
      )}
    </div>
  );
}
