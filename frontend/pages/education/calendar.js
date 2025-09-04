import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import TableCalendar from "@/components/schedules/TableCalendar";
import axios from "axios";
import { useGlobalAlert } from "@/stores/globalAlert";

export async function getServerSideProps(context) {
  try {
    const cookie = context.req.headers.cookie || "";
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseURL)
      throw new Error("API_BASE_URL 환경변수가 설정되지 않았습니다.");

    const now = dayjs();
const startOfMonth = now.startOf("month").format("YYYY-MM-DD");
const endOfMonth = now.endOf("month").add(1, "month").format("YYYY-MM-DD");

    // getServerSideProps 내
const res = await axios.get(
  `${baseURL}/education/schedules/public/sessions?type=전체&start_date=${startOfMonth}&end_date=${endOfMonth}`,
  { headers: { Cookie: cookie } }
);

return {
  props: {
    eventsData: res.data?.sessions || [],
  },
};

  } catch (error) {
    return { props: { eventsData: [] } };
  }
}

export default function CalendarPage({ eventsData }) {
  console.table(
    (eventsData || [])
      .filter(e => String(e.title || "").includes("테스트")) // 필요시 키워드 변경
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
        ...item,
        id: item.session_id,           // 세션 고유 ID
        schedule_id: item.schedule_id, // 상세 페이지 이동용
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        type: item.type || item.category || null,
      })),
    [eventsData]
  );
  

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
