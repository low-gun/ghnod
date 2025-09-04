import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import TableCalendar from "@/components/schedules/TableCalendar";
import axios from "axios";
import { useGlobalAlert } from "@/stores/globalAlert";

export async function getServerSideProps({ res }) {
  // Vercel Edge 캐시 적용: 60초 신선, 600초 동안은 stale 서빙하며 백그라운드 재검증
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=600"
  );

  const now = dayjs();
  return {
    props: {
      initialMonth: now.format("YYYY-MM-01"),
    },
  };
}



export default function CalendarPage({ initialMonth }) {
  // SSR → CSR 전환: 클라이언트에서 월 범위로 데이터 로딩
  const [eventsData, setEventsData] = useState([]);

  // (선택) 확인용 로그는 상태 기반으로 그대로 유지
  console.table(
    (eventsData || [])
      .filter(e => String(e.title || "").includes("테스트"))
      .map(e => ({
        title: e.title,
        id: e.id || e.schedule_id,
        start: (e.start_date || "").slice(0,10),
        end:   (e.end_date   || "").slice(0,10),
      }))
  );

  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const events = useMemo(
    () =>
      (eventsData || []).map((item) => ({
        // 불필요한 확장 전개(...) 제거: 필요한 필드만 유지
        id: item.session_id,
        schedule_id: item.schedule_id,
        title: item.title,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        type: item.type || item.category || null,
      })),
    [eventsData]
  );

  useEffect(() => {
    const fetchMonth = async (refDate) => {
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const start = dayjs(refDate).startOf("month").format("YYYY-MM-DD");
      const end   = dayjs(refDate).endOf("month").add(1, "month").format("YYYY-MM-DD");
      try {
        const { data } = await axios.get(
          `${baseURL}/education/schedules/public/sessions`,
          { params: { type: "전체", start_date: start, end_date: end } }
        );
        setEventsData(data?.sessions || []);
      } catch (e) {
        setEventsData([]);
      }
    };

    fetchMonth(initialMonth || dayjs());
  }, [initialMonth]);

  // (기존 rows 로그 유지)
  useEffect(() => {
    const rows = (events || [])
      .filter(e => String(e.title || "").includes("테스트"))
      .map(e => ({
        id: e.id || e.schedule_id,
        start: e.start,
        end: e.end,
      }));
    console.log("🧪 mapped events 샘플:", rows);
  }, [events]);

  const [calendarDate, setCalendarDate] = useState(dayjs());

const handleSelectEvent = useCallback(
    (event) => {
      if (!event?.type) {
        showAlert("교육 타입 정보가 없습니다.");
        return;
      }
      const sid = event.schedule_id || event.id; // ✅ 일정 id 우선
      router.push(`/education/${event.type}/${sid}`);
    },
    [router, showAlert]
  );
    
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      
      <TableCalendar
  events={events}
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

        showAlert(`
          <div>
<strong>${dayjs(date).format("M월 D일")} 일정 더보기 (${hiddenEvents.length}건)</strong><br/>
            ${items}
          </div>
        `, { isHtml: true });
        
    } else {
      // 데스크탑: 모달 그대로
    }
  }}
/>


      
    </div>
  );
}
