// ./frontend/components/common/AdminSearchFilter.jsx
import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminSearchFilter({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  searchOptions = [],
  onSearchClick, // ✅ 버튼 클릭 시에만 페치 트리거
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) {
  const currentOption = searchOptions.find((opt) => opt.value === searchType);

  const wrap = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  };

  const control = {
    height: 40,
    padding: "8px 12px",
    fontSize: 14.5,
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    boxSizing: "border-box",
  };

  const fmt = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const handleTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchQuery(""); // 타입 바뀔 때 입력값 초기화
  };

  const handleQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      doSearch();
    }
  };

  // ✅ 검색 버튼 클릭 시에만 부모로 조건 반영 + 트리거
  const doSearch = () => {
    let payload = searchQuery;
    if (currentOption?.type === "date") {
      payload = `${fmt(startDate)}|${fmt(endDate)}`; // "YYYY-MM-DD|YYYY-MM-DD"
    }
    onSearchClick?.(payload); // ✅ 부모에 최종 검색어를 넘기고, 부모가 state 반영 후 트리거
  };

  // ✅ react-datepicker 커스텀 입력 (forwardRef로 안정화)
  const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      style={{
        ...control,
        width: 160,
        textAlign: "left",
        cursor: "pointer",
      }}
      title={placeholder}
    >
      {value || placeholder}
    </button>
  ));
  CustomInput.displayName = "CustomInput";

  return (
    <div style={wrap}>
      {/* 필드 선택 */}
      <select
        value={searchType}
        onChange={handleTypeChange}
        style={{ ...control, width: 140, minWidth: 110 }}
      >
        {searchOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 입력 영역 */}
      {currentOption?.type === "date" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DatePicker
            selected={startDate}
            onChange={(d) => setStartDate?.(d)}
            placeholderText="시작 날짜"
            dateFormat="yyyy-MM-dd"
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate || undefined}
            customInput={<CustomInput placeholder="시작 날짜" />}
          />
          <DatePicker
            selected={endDate}
            onChange={(d) => setEndDate?.(d)}
            placeholderText="종료 날짜"
            dateFormat="yyyy-MM-dd"
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            customInput={<CustomInput placeholder="종료 날짜" />}
          />
        </div>
      ) : currentOption?.type === "select" &&
        Array.isArray(currentOption.options) ? (
        <select
          value={searchQuery}
          onChange={handleQueryChange}
          style={{ ...control, width: 180 }}
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
          onKeyDown={handleKeyDown} // ⏎로도 검색 가능
          style={{
            ...control,
            flex: 1,
            minWidth: 220,
            maxWidth: 520,
            padding: "10px 14px",
          }}
        />
      )}

      {/* 검색 버튼 */}
      <button
        style={{
          ...control,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          height: 40,
        }}
        onClick={doSearch}
      >
        검색
      </button>
    </div>
  );
}
