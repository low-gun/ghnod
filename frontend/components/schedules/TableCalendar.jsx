import React, { useState, useEffect } from "react";  // ★ useEffect 추가
import moment from "moment";
import processEvents from "@/utils/processEvents";
import styles from "./TableCalendar.module.css";  // CSS Module import

export default function TableCalendar({
    events = [],
    currentMonth,
    setCurrentMonth,
    onSelectSchedule,
    onShowMore,   // ★ 추가
  }) {

  const start = currentMonth.clone().startOf("month").startOf("week");
  const end = currentMonth.clone().endOf("month").endOf("week");

  // 날짜 배열
  const days = [];
  const day = start.clone();
  while (day.isSameOrBefore(end)) {
    days.push(day.clone());
    day.add(1, "day");
  }

  // 주 단위 배열
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // 이벤트 전처리
  const { visibleEvents, hiddenEventsMap } = processEvents(events, "type");
// ★ 이벤트 구조 로깅: 실제 필드(type/status/start/end 등) 확인
useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        const rows = (visibleEvents || []).slice(0, 50).map(e => ({
          id: e.id ?? e._id ?? null,
          title: e.title,
          type: e.type ?? e.category ?? null,
          status: e.status ?? e.state ?? null,
          start: e.start ?? e.start_date ?? e.begin ?? null,
          end: e.end ?? e.end_date ?? e.finish ?? null,
          // 내부 전처리 필드(참고)
          _date: e._date,
          _row: e._row,
          _colSpan: e._colSpan,
        }));
        console.group("[Calendar] visibleEvents schema sample");          // ★ 접지 않음
console.table(rows);
console.log("rows.length:", rows.length);                         // ★ 보조 로그
const keySet = new Set();
(visibleEvents || []).forEach(ev => Object.keys(ev || {}).forEach(k => keySet.add(k)));
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
  setCurrentMonth?.(currentMonth.clone().subtract(1, "month"));
const handleNext = () =>
  setCurrentMonth?.(currentMonth.clone().add(1, "month"));
const handleToday = () => setCurrentMonth?.(moment());
  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calendarHeader}>
  <button className={styles.navBtn} onClick={handlePrev} aria-label="이전 달">◀</button>
  <span className={styles.monthTitle}>{currentMonth?.format("YYYY년 M월")}</span>
  <button className={styles.navBtn} onClick={handleNext} aria-label="다음 달">▶</button>
  <button className={styles.todayBtn} onClick={handleToday}>오늘</button>
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
const hidden = hiddenEventsMap?.[dateStr] ?? [];   // ★ 복구: 숨김 일정 배열
const isToday = day.isSame(moment(), "day");

    return (
      <td
        key={di}
        className={
          day.month() === currentMonth.month()
          ? `${styles.dayCell} ${isToday ? `${styles.today} ${styles.todayCol}` : ""}` // ★ 오늘 컬럼 배경까지
          : `${styles.dayCell} ${styles.otherMonth}`
        }
      >
        <div className={styles.date}>
          <span className={styles.dateNum}>{day.date()}</span> {/* ★ 숫자 래핑 */}
          {hidden.length > 0 && (
 <button
 className={styles.moreBtn}
 onClick={() => {
   if (typeof window !== "undefined" && window.innerWidth <= 640 && typeof onShowMore === "function") {
     onShowMore(dateStr, hidden);
   } else {
     setModalDate(dateStr);
   }
 }}
>
 +{hidden.length}<span className={styles.moreLabel}> more</span>
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

      // ★ 이번 주에 '오늘'이 있으면 그 요일 인덱스(0~6), 없으면 -1
      const weekTodayIdx = week.findIndex(d => d.isSame(moment(), "day"));

      while (di < 7) {
        const day = week[di];
const dateStr = day.format("YYYY-MM-DD");
const isOtherMonth = day.month() !== currentMonth.month();   // ★ 추가

        const ev = visibleEvents.find(
          (e) => e._date === dateStr && e._row === rowIdx
        );

        if (ev) {
          const span = Math.min(ev._colSpan, 7 - di);
          const today = moment().startOf("day");
          const start = moment(ev.start).startOf("day");
          const end = moment(ev.end).endOf("day");
          const status =
            start.isAfter(today) ? "upcoming"
            : end.isBefore(today) ? "ended"
            : "ongoing";

          // ★ 이 이벤트 셀이 '오늘' 컬럼을 덮는지 계산
          // ★ '오늘' 오버레이는 제거 → 날짜 숫자만 강조
          cells.push(
            <td
            key={`e-${wi}-${rowIdx}-${di}`}
            colSpan={span}
            className={styles.td}
            data-othermonth={isOtherMonth ? "1" : undefined}   /* ★ 추가 */
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
          // ★ 이벤트가 없는 칸인데 오늘 컬럼이면 배경 표시
          const isTodayCol = weekTodayIdx >= 0 && di === weekTodayIdx;
          cells.push(
            <td
            key={`d-${wi}-${rowIdx}-${di}`}
            className={`${styles.td} ${isTodayCol ? styles.todayCol : ""}`}
            data-othermonth={isOtherMonth ? "1" : undefined}   /* ★ 추가 */
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
              {moment(modalDate).format("YYYY년 M월 D일")} 일정
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
