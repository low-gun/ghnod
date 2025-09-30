import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import TableCalendar from "@/components/schedules/TableCalendar";
import axios from "axios";
import { useGlobalAlert } from "@/stores/globalAlert";
import { getKoreanHolidaysOfMonth } from "@/utils/getKoreanHolidays";

export async function getServerSideProps({ res }) {
  // Vercel Edge 캐시 적용
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=600"
  );

  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseURL) throw new Error("API_BASE_URL 누락");

  const now = dayjs();
  const start = now.startOf("month").format("YYYY-MM-DD");
  const end   = now.endOf("month").add(1, "month").format("YYYY-MM-DD");

  // ✅ 첫 화면용: 이번 달 일정만 서버에서 미리 받아서 props로 전달
  let initialEvents = [];
  try {
    const { data } = await axios.get(
      `${baseURL}/education/schedules/public/calendar`,
      { params: { type: "전체", start_date: start, end_date: end } }
    );
    initialEvents = data?.sessions || [];
  } catch (e) {
    // SSR 실패해도 페이지는 떠야 함
    initialEvents = [];
  }

  return {
    props: {
      initialMonth: now.format("YYYY-MM-01"),
      initialEvents,
    },
  };
}

export default function CalendarPage({ initialMonth, initialEvents }) {
  // ✅ 첫 진입은 SSR 데이터로 즉시 채움
  const [eventsData, setEventsData] = useState(initialEvents || []);
  const [calendarDate, setCalendarDate] = useState(dayjs(initialMonth));

  // ✅ 달을 바꿨을 때만 CSR fetch
  useEffect(() => {
    const fetchMonth = async (refDate) => {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const start = dayjs(refDate).startOf("month").format("YYYY-MM-DD");
      const end   = dayjs(refDate).endOf("month").add(1, "month").format("YYYY-MM-DD");
      try {
        const { data } = await axios.get(
          `${baseURL}/education/schedules/public/calendar`,
          { params: { type: "전체", start_date: start, end_date: end } }
        );
        setEventsData(data?.sessions || []);
      } catch (e) {
        setEventsData([]);
      }
    };

    if (!dayjs(initialMonth).isSame(calendarDate, "month")) {
      fetchMonth(calendarDate);
    }
  }, [calendarDate, initialMonth]);

  const { scheduleEvents, holidays } = useMemo(() => {
    const scheduleEvents = (eventsData || []).map((item) => ({
      id: item.session_id,
      schedule_id: item.schedule_id,
      title: item.title,
      start: new Date(item.start_date),
      end: new Date(item.end_date),
      type: item.type || item.category || null,
    }));
  
    const start = dayjs(calendarDate).startOf("month").subtract(7, "day"); 
const end   = dayjs(calendarDate).endOf("month").add(7, "day");

const holidays = getKoreanHolidaysOfMonth({ start, end }, [
  { date: "2025-05-05", name: "임시공휴일" },
]);

  
    return { scheduleEvents, holidays };
  }, [eventsData, calendarDate]);
  

  // (기존 rows 로그 유지)
  useEffect(() => {
    const rows = (scheduleEvents || [])
      .filter(e => String(e.title || "").includes("테스트"))
      .map(e => ({
        id: e.id || e.schedule_id,
        start: e.start,
        end: e.end,
      }));
    console.log("🧪 mapped events 샘플:", rows);
  }, [scheduleEvents]);
  

  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const handleSelectEvent = useCallback(
    (event) => {
      if (!event?.type) {
        showAlert("교육 타입 정보가 없습니다.");
        return;
      }
      const sid = event.schedule_id || event.id;
      router.push(`/education/${event.type}/${sid}`);
    },
    [router, showAlert]
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <TableCalendar
   events={scheduleEvents}   // 공휴일은 제외된 일정만
   holidays={holidays}       // 새 props 추가
        currentMonth={calendarDate}
        setCurrentMonth={setCalendarDate}
        onSelectSchedule={handleSelectEvent}
        onShowMore={(date, hiddenEvents) => {
          if (window.innerWidth <= 640) {
            const items = hiddenEvents
              .map(ev => {
                const sid = ev.schedule_id || ev.id;
                return `• <a href="/education/${ev.type}/${sid}" style="color:#2563eb;text-decoration:underline;">${ev.title}</a>`;
              })
              .join("<br/>");

            showAlert(
              `
              <div>
                <strong>${dayjs(date).format("M월 D일")} 일정 더보기 (${hiddenEvents.length}건)</strong><br/>
                ${items}
              </div>
              `,
              { isHtml: true }
            );
          } else {
            // 데스크탑: 모달 그대로
          }
        }}
      />
    </div>
  );
}
