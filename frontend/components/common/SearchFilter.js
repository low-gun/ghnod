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
}) {
  const currentOption = searchOptions.find((opt) => opt.value === searchType);

  const commonStyle = {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
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
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {/* 검색 대상 타입 선택 */}
      <select
        value={searchType}
        onChange={handleTypeChange}
        style={{ ...commonStyle, width: "140px" }}
      >
        {searchOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 검색 조건 입력 */}
      {currentOption?.type === "date" ? (
        <>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="시작 날짜"
            dateFormat="yyyy-MM-dd"
            customInput={
              <input
                style={{ ...commonStyle, width: "140px", height: "38px" }}
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
                style={{ ...commonStyle, width: "140px", height: "38px" }}
              />
            }
          />
        </>
      ) : currentOption?.type === "select" &&
        Array.isArray(currentOption.options) ? (
        <select
          value={searchQuery}
          onChange={handleQueryChange}
          style={{ ...commonStyle, width: "180px" }}
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
          style={{ ...commonStyle, width: "240px" }}
        />
      )}
    </div>
  );
}
