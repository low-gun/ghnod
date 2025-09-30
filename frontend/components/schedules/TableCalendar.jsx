import React, { useState, useEffect } from "react";  // ★ useEffect 추가
import dayjs from "dayjs";
import processEvents from "@/utils/processEvents";
import styles from "./TableCalendar.module.css";  // CSS Module import

export default function TableCalendar({
  events = [],
  holidays = [],
  currentMonth,
  setCurrentMonth,
  onSelectSchedule,
  onShowMore,
}) {
  if (process.env.NODE_ENV !== "production") console.count("Render:TableCalendar");

  // currentMonth가 moment든 dayjs든 대응 (valueOf 있으면 ms로 변환)
  const cm = currentMonth?.valueOf ? dayjs(currentMonth.valueOf()) : dayjs(currentMonth);

  const startMonth = cm.startOf("month");
  const startWeekday = Number(startMonth.format("d")); // 0(일)~6(토)
  const start = startMonth.subtract(startWeekday, "day"); // 일요일로 보정

  const endMonth = cm.endOf("month");
  const endWeekday = Number(endMonth.format("d"));
  const end = endMonth.add(6 - endWeekday, "day").endOf("day"); // 토요일 말까지

  // 날짜 배열
  const days = [];
  let day = start;
  while (day.valueOf() <= end.valueOf()) {
    days.push(day);
    day = day.add(1, "day");
  }

  // 주 단위 배열
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // 이벤트 전처리
// 이벤트 전처리
const { visibleEvents, hiddenEventsMap } = processEvents(events, "type");

// ★ 공휴일 데이터 구조 로깅
useEffect(() => {
  if (process.env.NODE_ENV !== "production") {
    console.group("[Calendar] holidays sample");
    console.log("holidays.length:", holidays?.length);
    (holidays || []).slice(0, 20).forEach((h, idx) => {
      console.log(idx, {
        id: h.id ?? null,
        title: h.title,
        start: h.start,
        end: h.end,
      });
    });
    console.groupEnd();
  }
}, [holidays]);

  // ★ 이벤트 구조 로깅
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        const rows = (visibleEvents || []).slice(0, 50).map((e) => ({
          id: e.id ?? e._id ?? null,
          title: e.title,
          type: e.type ?? e.category ?? null,
          status: e.status ?? e.state ?? null,
          start: e.start ?? e.start_date ?? e.begin ?? null,
          end: e.end ?? e.end_date ?? e.finish ?? null,
          _date: e._date,
          _row: e._row,
          _colSpan: e._colSpan,
        }));
        console.group("[Calendar] visibleEvents schema sample");
        console.table(rows);
        console.log("rows.length:", rows.length);
        const keySet = new Set();
        (visibleEvents || []).forEach((ev) =>
          Object.keys(ev || {}).forEach((k) => keySet.add(k))
        );
        console.log("keys:", Array.from(keySet).sort());
        console.groupEnd();
      } catch (err) {
        console.warn("[Calendar] log error:", err);
      }
    }
  }, [visibleEvents]);

  const [modalDate, setModalDate] = useState(null);

  // ★ 달 이동 핸들러
  const handlePrev = () =>
    setCurrentMonth?.(
      (currentMonth?.valueOf ? dayjs(currentMonth.valueOf()) : dayjs(currentMonth)).subtract(
        1,
        "month"
      )
    );
  const handleNext = () =>
    setCurrentMonth?.(
      (currentMonth?.valueOf ? dayjs(currentMonth.valueOf()) : dayjs(currentMonth)).add(
        1,
        "month"
      )
    );
  const handleToday = () => setCurrentMonth?.(dayjs());

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarHeader}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="이전 달">
          ◀
        </button>
        <span className={styles.monthTitle}>
          {(currentMonth?.valueOf ? dayjs(currentMonth.valueOf()) : dayjs(currentMonth))?.format(
            "YYYY년 M월"
          )}
        </span>
        <button className={styles.navBtn} onClick={handleNext} aria-label="다음 달">
          ▶
        </button>
        <button className={styles.todayBtn} onClick={handleToday}>
          오늘
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <th key={d} className={styles.th}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <React.Fragment key={wi}>
              {/* 날짜 row */}
              <tr className={styles.dayRow}>
              {week.map((day, di) => {
  const dateStr = day.format("YYYY-MM-DD");
  const hidden = hiddenEventsMap?.[dateStr] ?? [];
  const isToday = day.isSame(dayjs(), "day");

  const isOtherMonth = day.month() !== currentMonth.month();
  const holiday = (holidays || []).find((ev) => {
    const match = dayjs(ev.start).isSame(dateStr, "day");
    if (match) {
      console.log("[HOLIDAY MATCH]", { dateStr, evStart: ev.start, evTitle: ev.title });
    }
    return match;
  });
  
  const isHoliday = !!holiday;

  // ★ 콘솔 로그 추가
  if (isHoliday) {
    console.log("[HOLIDAY MATCH]", {
      dateStr,
      evStart: holiday.start,
      evTitle: holiday.title,
    });
  }

  return (
    <td
      key={di}
      className={`
        ${styles.dayCell}
        ${isOtherMonth ? styles.otherMonth : ""}
        ${isHoliday ? styles.holidayCell : ""}
        ${isToday ? `${styles.today} ${styles.todayCol}` : ""}
      `}
    >
      <div className={styles.date}>
        <>
          <span
            className={`${styles.dateNum} ${isHoliday ? styles.holidayDate : ""}`}
          >
            {day.date()}
          </span>
          {isHoliday && (
            <span className={styles.holidayLabel}>{holiday.title}</span>
          )}
        </>
        {hidden.length > 0 && (
          <button
            className={styles.moreBtn}
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.innerWidth <= 640 &&
                typeof onShowMore === "function"
              ) {
                onShowMore(dateStr, hidden);
              } else {
                setModalDate(dateStr);
              }
            }}
          >
            +{hidden.length}
            <span className={styles.moreLabel}> more</span>
          </button>
        )}
      </div>
    </td>
  );
})}

              </tr>

              {/* 이벤트 row */}
              {[0, 1, 2].map((rowIdx) => (
                <tr key={`row-${wi}-${rowIdx}`} className={styles.eventRow}>
                  {(() => {
                    const cells = [];
                    let di = 0;

                    const weekTodayIdx = week.findIndex((d) =>
                      d.isSame(dayjs(), "day")
                    );

                    while (di < 7) {
                      const day = week[di];
                      const dateStr = day.format("YYYY-MM-DD");
                      const isOtherMonth = day.month() !== currentMonth.month();

                      const ev = visibleEvents.find(
                        (e) => e._date === dateStr && e._row === rowIdx
                      );

                      if (ev) {
                        const span = Math.min(ev._colSpan, 7 - di);
                        const today = dayjs().startOf("day");
                        const start = dayjs(ev.start).startOf("day");
                        const end = dayjs(ev.end).endOf("day");
                        const status =
                          start.isAfter(today)
                            ? "upcoming"
                            : end.isBefore(today)
                            ? "ended"
                            : "ongoing";

                        cells.push(
                          <td
                            key={`e-${wi}-${rowIdx}-${di}`}
                            colSpan={span}
                            className={`${styles.td} ${
                              (holidays || []).some((ev) =>
                                dayjs(ev.start).isSame(dateStr, "day")
                              )
                                ? styles.holidayCell
                                : ""
                            }`}
                            data-othermonth={isOtherMonth ? "1" : undefined}
                          >
                            <div
                              className={styles.eventBar}
                              data-type={ev.type}
                              data-status={status}
                              onClick={() => onSelectSchedule?.(ev)}
                            >
                              {ev.title}
                            </div>
                          </td>
                        );

                        di += span;
                      } else {
                        const isTodayCol = weekTodayIdx >= 0 && di === weekTodayIdx;
                        cells.push(
                          <td
                            key={`d-${wi}-${rowIdx}-${di}`}
                            className={`${styles.td} ${
                              isTodayCol ? styles.todayCol : ""
                            } ${
                              (holidays || []).some((ev) =>
                                dayjs(ev.start).isSame(dateStr, "day")
                              )
                                ? styles.holidayCell
                                : ""
                            }`}
                            data-othermonth={isOtherMonth ? "1" : undefined}
                          />
                        );
                        di += 1;
                      }
                    }
                    return cells;
                  })()}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* 모달 */}
      {modalDate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeader}>
              {dayjs(modalDate).format("YYYY년 M월 D일")} 일정
            </h2>

            <ul>
              {(hiddenEventsMap[modalDate] || []).map((ev) => (
                <li
                  key={ev.id}
                  className={styles.modalItem}
                  onClick={() => {
                    onSelectSchedule?.(ev);
                    setModalDate(null);
                  }}
                >
                  {ev.title}
                </li>
              ))}
            </ul>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setModalDate(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
