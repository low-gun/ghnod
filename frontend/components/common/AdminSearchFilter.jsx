// ./frontend/components/common/AdminSearchFilter.jsx
import React, { forwardRef, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminSearchFilter({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  searchOptions = [],
  onSearchClick, // 버튼 클릭 시에만 페치 트리거
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) {
  // 1) 과거 값("inquiryCount")이 들어와도 드롭다운이 뜨도록 정규화
  const normalizedType = useMemo(() => {
    return searchType === "inquiryCount" ? "inquiryStatus" : searchType;
  }, [searchType]);

  // 2) 정규화된 키로 옵션 탐색. 없으면 문의내역용 가상 옵션 생성
  // 추가: role 기본 옵션
  const ROLE_OPTIONS = [
    { value: "admin", label: "관리자" },
    { value: "user", label: "회원" },
  ];

  const currentOption = useMemo(() => {
    const found = searchOptions.find((opt) => opt.value === normalizedType);
    if (found) {
      // role이 들어왔는데 type이 select가 아니면 강제로 select로 교정
      if (found.value === "role" && found.type !== "select") {
        return { ...found, type: "select", options: ROLE_OPTIONS };
      }
      return found;
    }

    // 옵션이 아예 없는 경우도 role이면 드롭다운으로 강제
    if (normalizedType === "role") {
      return {
        value: "role",
        label: "권한",
        type: "select",
        options: ROLE_OPTIONS,
      };
    }

    if (searchType === "inquiryCount") {
      return {
        value: "inquiryStatus",
        label: "문의내역",
        type: "select",
        options: [
          { value: "unanswered", label: "미답변" },
          { value: "answered", label: "답변" },
          { value: "none", label: "문의없음" },
        ],
      };
    }
    return undefined;
  }, [searchOptions, normalizedType, searchType]);

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

  const handleTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchQuery(""); // 타입 바뀔 때 입력값 초기화
    setStartDate?.(null);
    setEndDate?.(null);
  };

  const handleQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      doSearch();
    } else if (e.key === "Escape" || e.key === "Esc") {
      // 1) 로컬 입력 초기화
      setSearchType?.("all");
      setSearchQuery?.("");
      setStartDate?.(null);
      setEndDate?.(null);
      // 2) 상위에 '초기값 객체'로 즉시 조회 요청
      onSearchClick?.({
        type: "all",
        query: "",
        startDate: null,
        endDate: null,
      });
    }
  };

  const doSearch = () => {
    const payload = {
      // 백엔드로는 정규화된 키를 보냄
      type: normalizedType || "all",
      query: searchQuery || "",
      startDate: currentOption?.type === "date" ? startDate : null,
      endDate: currentOption?.type === "date" ? endDate : null,
    };
    onSearchClick?.(payload);
  };

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

  const enrichedSelectOptions = useMemo(() => {
    if (
      currentOption?.type === "select" &&
      Array.isArray(currentOption.options)
    ) {
      if (currentOption?.value === "payment_method") {
        const exists = currentOption.options.some((o) => o.value === "easy");
        return exists
          ? currentOption.options
          : [...currentOption.options, { value: "easy", label: "간편결제" }];
      }
      return currentOption.options;
    }
    return [];
  }, [currentOption]);

  // 3) 숫자 조건(이상/이하) 지원 키: 결제합계, 잔여포인트
  const numericOpKeys = new Set(["paymentTotal", "pointBalance"]);

  // 4) 숫자 스테퍼(±) UI 키: 잔여쿠폰, 수강횟수
  const numericStepperKeys = new Set([
    "couponBalance",
    "courseCount",
    "total_quantity",
  ]);

  // 공용 스테퍼 핸들러
  const adjustNumber = (delta) => {
    const next = Math.max(0, (parseInt(searchQuery, 10) || 0) + delta);
    setSearchQuery(String(next));
  };

  return (
    <>
      <div style={wrap}>
        {/* 필드 선택 */}
        <select
          value={normalizedType}
          onChange={handleTypeChange}
          style={{ ...control, width: 160, minWidth: 120 }}
        >
          {searchOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 입력 영역 */}
        {currentOption?.value === "discount_total" ? (
          // 결제화면 전용
          <select
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            style={{ ...control, width: 180 }}
          >
            <option value="">전체</option>
            <option value="applied">적용</option>
            <option value="none">미적용</option>
          </select>
        ) : currentOption?.type === "date" ? (
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
              popperPlacement="bottom-start"
              portalId="__next"
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
              popperPlacement="bottom-start"
              portalId="__next"
              customInput={<CustomInput placeholder="종료 날짜" />}
            />
          </div>
        ) : numericOpKeys.has(currentOption?.value) ? (
          // 숫자형: 이상/이하 + 값 (같음 제거)
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={searchQuery?.split("|")[0] || ""}
              onChange={(e) =>
                setSearchQuery(
                  `${e.target.value}|${searchQuery?.split("|")[1] || ""}`
                )
              }
              style={{ ...control, width: 110 }}
            >
              <option value="">조건</option>
              <option value="gte">이상(≥)</option>
              <option value="lte">이하(≤)</option>
            </select>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="값 입력"
              value={searchQuery?.split("|")[1] || ""}
              onChange={(e) =>
                setSearchQuery(
                  `${searchQuery?.split("|")[0] || ""}|${e.target.value}`
                )
              }
              onKeyDown={handleKeyDown}
              style={{ ...control, width: 160 }}
            />
          </div>
        ) : numericStepperKeys.has(currentOption?.value) ? (
          // 잔여쿠폰/수강횟수: 숫자만 + 스테퍼(±)
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              step={1}
              placeholder={
                currentOption?.value === "couponBalance"
                  ? "쿠폰 수량"
                  : currentOption?.value === "courseCount"
                    ? "수강 횟수"
                    : "수량"
              }
              value={searchQuery || ""}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setSearchQuery(v);
              }}
              onKeyDown={handleKeyDown}
              style={{ ...control, width: 140 }}
            />
            <button
              type="button"
              onClick={() => adjustNumber(-1)}
              style={{ ...control, width: 40, padding: 0 }}
              title="감소"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => adjustNumber(1)}
              style={{ ...control, width: 40, padding: 0 }}
              title="증가"
            >
              ＋
            </button>
          </div>
        ) : currentOption?.value === "inquiryStatus" ? (
          // 문의 상태 드롭다운
          <select
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            style={{ ...control, width: 180 }}
          >
            <option value="">전체</option>
            <option value="unanswered">미답변만</option>
            <option value="answered">답변만</option>
            <option value="none">문의없음</option>
          </select>
        ) : currentOption?.type === "select" &&
          Array.isArray(currentOption.options) ? (
          <select
            value={searchQuery}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            style={{ ...control, width: 200 }}
          >
            <option value="">전체</option>
            {enrichedSelectOptions.map((opt) => (
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
            onKeyDown={handleKeyDown}
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
            background: "#0070f3",
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

      {/* DatePicker 팝업이 테이블 헤드에 안 가리도록 z-index 보강 */}
      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
      `}</style>
    </>
  );
}
