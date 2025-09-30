// frontend/utils/getKoreanHolidays.js
import dayjs from "dayjs";
import Holidays from "date-holidays";

/**
 * refDate(예: calendarDate) 기준 '해당 월'의 한국 공휴일을 반환합니다.
 * 반환 형식은 기존 일정과 합치기 쉬운 형태로 맞춥니다.
 *
 * @param {Date | string | dayjs.Dayjs} refDate - 기준 날짜(해당 월)
 * @param {Array<{ date: string, name: string }>} extraHolidays - 임시공휴일 등 수동 추가용 (YYYY-MM-DD, 이름)
 * @returns {Array<{id:string,title:string,start:Date,end:Date,type:string,isHoliday:boolean}>}
 */
export function getKoreanHolidaysOfMonth(refDate, extraHolidays = []) {
  const d = dayjs(refDate);
  const year = d.year();
  const month = d.month(); // 0~11

  const hd = new Holidays("KR");
  const raw = hd.getHolidays(year) || [];
  console.log("[HolidayRaw]", year, raw.filter(h => h.date?.includes(`${year}-${month+1}`)));
  
  // date-holidays 결과에서 날짜 파싱(라이브러리 포맷 상관없이 안전하게 처리)
  const yearly = raw
    .map((h) => {
      const base =
        h?.date
          ? dayjs(h.date)
          : h?.start
          ? dayjs(h.start)
          : null;

      if (!base || !base.isValid()) return null;

      return {
        id: `holiday-${base.format("YYYYMMDD")}-${h.name || h.nameLocal || "휴일"}`,
        title: h.name || h.nameLocal || "공휴일",
        start: base.toDate(),
        end: base.toDate(),
        type: "holiday",
        isHoliday: true,
      };
    })
    .filter(Boolean)
    .filter((ev) => {
        const d = dayjs(ev.start);
        return d.isAfter(refDate.start, "day") && d.isBefore(refDate.end, "day");
      });
  // 임시공휴일 수동 추가(있을 때만, 같은 달만)
  const extras = (extraHolidays || [])
    .map((x) => {
      const base = dayjs(x.date);
      if (!base.isValid() || base.month() !== month || base.year() !== year) return null;
      return {
        id: `holiday-${base.format("YYYYMMDD")}-${x.name || "임시공휴일"}`,
        title: x.name || "임시공휴일",
        start: base.toDate(),
        end: base.toDate(),
        type: "holiday",
        isHoliday: true,
      };
    })
    .filter(Boolean);

  // 같은 날짜/제목 중복 제거(필요시)
  const dedupKey = (ev) => `${dayjs(ev.start).format("YYYYMMDD")}::${ev.title}`;
  const map = new Map();
  [...yearly, ...extras].forEach((ev) => map.set(dedupKey(ev), ev));

  return Array.from(map.values());
}
