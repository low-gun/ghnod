import dayjs from "dayjs";
import groupBy from "lodash.groupby";

// 주(week) 시작일(일요일) YYYY-MM-DD 문자열로 계산
function startOfWeekStr(yyyyMMdd) {
  const d = dayjs(yyyyMMdd);
  const weekday = Number(d.format("d")); // 0(일)~6(토)
  return d.subtract(weekday, "day").format("YYYY-MM-DD");
}

// dayjs min 대체
function minDay(a, b) {
  return a.valueOf() <= b.valueOf() ? a : b;
}

const typeMap = {
  followup: "1",
  certification: "2",
  공개교육: "3",
  facilitation: "4",
};
const categoryMap = {
  교육: "1",
  컨설팅: "2",
  진단: "3",
  기타: "4",
};

/**
 * 멀티데이 이벤트 colSpan + 겹침 row 계산 + +n more 처리
 */
export default function processEvents(schedules, colorMode) {
  const expanded = [];

  schedules.forEach((evt) => {
    const start = dayjs(evt.start).startOf("day");
    const end = dayjs(evt.end).startOf("day");

    const debug = process.env.NODE_ENV !== "production";
    const segments = [];

    let cursor = start; // dayjs는 불변 객체 → 재할당로 직전 값 보존
    while (cursor.valueOf() <= end.valueOf()) {
      const weekday = Number(cursor.format("d")); // 0(일)~6(토)
      const weekEnd = cursor.add(6 - weekday, "day").endOf("day"); // 해당 주의 토요일 말
      const spanEnd = minDay(end, weekEnd);
      let span = spanEnd.diff(cursor, "day") + 1;
      if (span < 1) span = 1; // 안전가드

      const seg = {
        ...evt,
        _date: cursor.format("YYYY-MM-DD"),
        _colSpan: span,
      };

      expanded.push(seg);

      // ★ 디버그용 기록
      segments.push({
        title: evt.title,
        segStart: cursor.format("YYYY-MM-DD"),
        segEnd: spanEnd.format("YYYY-MM-DD"),
        colSpan: span,
        weekEnd: weekEnd.format("YYYY-MM-DD"),
      });

      cursor = spanEnd.add(1, "day").startOf("day");
    }

    // ★ 콘솔 출력 (개발환경에서만)
    if (debug) {
      try {
        const focus = evt.title?.includes("일정등록테스트") || evt.title?.includes("ToP : 퍼실리테이션 입문");
        if (focus) {
          console.group(
            `[PE-FOCUS] ${evt.title} (${start.format("YYYY-MM-DD")} ~ ${end.format("YYYY-MM-DD")})`
          );
          console.table(segments);  // segStart, segEnd, colSpan, weekEnd 확인
          console.groupEnd();
        }
      } catch (e) {}
    }
  });
    // === 주(week) 단위로 겹침 계산하여 row 배정 ===
  // 1) 주 시작일(일요일) 기준으로 그룹화
  const weeksGrouped = groupBy(
    expanded,
    (e) => startOfWeekStr(e._date)
  );

  const placed = [];

  for (const [weekStartStr, items] of Object.entries(weeksGrouped)) {
    const weekStart = dayjs(weekStartStr, "YYYY-MM-DD");

    // 주 내 위치/길이 계산
    const segs = items.map((ev) => {
      const startIdx = dayjs(ev._date).diff(weekStart, "day"); // 0~6
      const span = Math.min(ev._colSpan, 7 - startIdx);        // 주 경계 내 colSpan
      const endIdx = startIdx + span - 1;
      return { ...ev, _startIdx: startIdx, _endIdx: endIdx, _colSpan: span };
    });

    // 긴 것 먼저 배치 → 겹침 최소화
    segs.sort((a, b) => {
      if (a._startIdx !== b._startIdx) return a._startIdx - b._startIdx;
      return b._colSpan - a._colSpan;
    });

    // row 배정(그리디)
    const lastEndByRow = []; // 각 row가 마지막으로 점유한 칸 인덱스
    segs.forEach((ev) => {
      let row = 0;
      while (lastEndByRow[row] !== undefined && lastEndByRow[row] >= ev._startIdx) {
        row += 1;
      }
      lastEndByRow[row] = ev._endIdx;
      placed.push({ ...ev, _row: row });
    });
  }

  // 2) 날짜별로 분리하여 표시/숨김 결정(3행까지만 표시)
  const byDate = groupBy(placed, (e) => e._date); // 그대로 사용 (변경 없음)
  const visibleEvents = [];
  const hiddenEventsMap = {};

  for (const [date, items] of Object.entries(byDate)) {
    // 행 번호 & 시작 위치 기준으로 안정 정렬
    items.sort((a, b) => (a._row - b._row) || (a._startIdx - b._startIdx));

    const shown = items.filter((it) => it._row < 3);
    const hidden = items.filter((it) => it._row >= 3);

    shown.forEach((s) => {
      const value =
        colorMode === "type"
          ? typeMap[s.product_type] || "0"
          : categoryMap[s.product_category] || "0";
      visibleEvents.push({ ...s, className: value ? `${colorMode}-${value}` : "" });
    });

    if (hidden.length > 0) hiddenEventsMap[date] = hidden;
  }

  return { visibleEvents, hiddenEventsMap };

}
