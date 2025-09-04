import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";

export default function DateRangeSelector({ value, onChange }) {
  const [openTarget, setOpenTarget] = useState(null); // "start" or "end"
  const ref = useRef();
  const [month, setMonth] = useState(dayjs());

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenTarget(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectDate(date) {
    if (openTarget === "start") {
      onChange({ ...value, startDate: date });
    } else if (openTarget === "end") {
      onChange({ ...value, endDate: date });
    }
    setOpenTarget(null);
  }

  const handleReset = () => {
    onChange({ startDate: null, endDate: null });
  };

  const { startDate, endDate } = value || {};

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        position: "relative",
        minWidth: 480,
      }}
    >
      {/* 시작일 */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpenTarget(openTarget === "start" ? null : "start")}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: 14,
            background: "#fff",
            cursor: "pointer",
            width: 120,
            textAlign: "center",
          }}
        >
          {startDate ? startDate.format("YYYY.MM.DD") : "시작일"}
        </button>

        {openTarget === "start" && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
              width: 220,
            }}
          >
            <Calendar
              month={month}
              setMonth={setMonth}
              selected={startDate}
              onSelect={selectDate}
            />
          </div>
        )}
      </div>
      ~{/* 종료일 */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpenTarget(openTarget === "end" ? null : "end")}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: 14,
            background: "#fff",
            cursor: "pointer",
            width: 120,
            textAlign: "center",
          }}
        >
          {endDate ? endDate.format("YYYY.MM.DD") : "종료일"}
        </button>

        {openTarget === "end" && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
              width: 220,
            }}
          >
            <Calendar
              month={month}
              setMonth={setMonth}
              selected={endDate}
              onSelect={selectDate}
            />
          </div>
        )}
      </div>
      {/* 초기화 버튼 (값이 있을 때만 노출) */}
      {(startDate || endDate) && (
        <button
          onClick={handleReset}
          style={{
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: 13,
            background: "#f9f9f9",
            cursor: "pointer",
            height: 34,
          }}
        >
          초기화
        </button>
      )}
    </div>
  );
}

function Calendar({ month, setMonth, selected, onSelect }) {
  const startMonth = month.startOf("month");
const startWeekday = Number(startMonth.format("d")); // 0(일)~6(토)
const startOfMonth = startMonth.subtract(startWeekday, "day");

const endMonth = month.endOf("month");
const endWeekday = Number(endMonth.format("d"));
const endOfMonth = endMonth.add(6 - endWeekday, "day").endOf("day");

const days = [];
let day = startOfMonth;
while (day.valueOf() <= endOfMonth.valueOf()) {
  days.push(day);
  day = day.add(1, "day");
}


const today = dayjs();

  return (
    <div>
      {/* 월 이동 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <button
onClick={() => setMonth(month.subtract(1, "month"))}
style={{
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ◀
        </button>
        <strong style={{ fontSize: 14 }}>{month.format("YYYY년 M월")}</strong>
        <button
onClick={() => setMonth(month.add(1, "month"))}
style={{
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ▶
        </button>
      </div>

      {/* 요일 + 날짜 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 12,
              textAlign: "center",
              fontWeight: "bold",
              color: d === "일" ? "#dc2626" : d === "토" ? "#2563eb" : "#333",
            }}
          >
            {d}
          </div>
        ))}

        {days.map((date) => {
const isToday = date.isSame(dayjs(), "day");
const isSelected = selected && date.isSame(selected, "day");
const isCurrentMonth = date.month() === month.month();
const dayOfWeek = Number(date.format("d"));

          let textColor = "#333";
          if (!isCurrentMonth) textColor = "#ccc";
          else if (dayOfWeek === 0) textColor = "#dc2626";
          else if (dayOfWeek === 6) textColor = "#2563eb";

          return (
            <div
              key={date.format("YYYY-MM-DD")}
              onClick={() => onSelect(date)}
              style={{
                fontSize: 12,
                padding: 6,
                textAlign: "center",
                borderRadius: 4,
                backgroundColor: isSelected
                  ? "#3b82f6"
                  : isToday
                    ? "#e0f2fe"
                    : "transparent",
                color: isSelected ? "white" : textColor,
                fontWeight: isToday ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {date.date()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
