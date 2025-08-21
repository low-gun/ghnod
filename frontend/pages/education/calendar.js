import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import moment from "moment";
import CustomCalendar from "../../components/schedules/CustomCalendar";
import axios from "axios";
import { useGlobalAlert } from "@/stores/globalAlert";
import SearchFilter from "@/components/common/SearchFilter";

export async function getServerSideProps(context) {
  try {
    const cookie = context.req.headers.cookie || "";
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseURL)
      throw new Error("API_BASE_URL 환경변수가 설정되지 않았습니다.");

    const now = moment();
    const startOfMonth = now.clone().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = now
      .clone()
      .endOf("month")
      .add(1, "month")
      .format("YYYY-MM-DD");

    const res = await axios.get(
      `${baseURL}/education/schedules/public?type=전체&start_date=${startOfMonth}&end_date=${endOfMonth}`,
      { headers: { Cookie: cookie } }
    );

    return {
      props: {
        eventsData: res.data?.schedules || [],
      },
    };
  } catch (error) {
    return { props: { eventsData: [] } };
  }
}

export default function CalendarPage({ eventsData }) {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const events = useMemo(
    () =>
      (eventsData || []).map((item) => ({
        ...item,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        type: item.type || item.category || null,
      })),
    [eventsData]
  );

  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31));
  const [calendarDate, setCalendarDate] = useState(moment());

  const selectedEvent = useMemo(() => {
    const id = router.query.id;
    return events.find((e) => String(e.id) === String(id));
  }, [router.query.id, events]);

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
  

  useEffect(() => {
    if (searchType === "교육기간") setCalendarDate(moment(startDate));
  }, [searchType, startDate]);

  const filteredEvents = useMemo(() => {
    const kw = searchKeyword.toLowerCase();
    return events.filter((evt) => {
      if (searchType === "전체") {
        return (
          !kw ||
          [evt.title, evt.location, evt.instructor, evt.description].some((v) =>
            v?.toLowerCase().includes(kw)
          )
        );
      } else if (searchType === "교육명") {
        return evt.title?.toLowerCase().includes(kw);
      } else if (searchType === "교육기간") {
        return !(evt.end < startDate || evt.start > endDate);
      }
      return true;
    });
  }, [events, searchType, searchKeyword, startDate, endDate]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <SearchFilter
        searchType={searchType}
        setSearchType={setSearchType}
        searchQuery={searchKeyword}
        setSearchQuery={setSearchKeyword}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        searchOptions={[
          { value: "전체", label: "전체", type: "text" },
          { value: "교육명", label: "교육명", type: "text" },
          { value: "교육기간", label: "교육기간", type: "date" },
        ]}
        onSearchUpdate={(type, query) => {
          setSearchType(type);
          setSearchKeyword(query);
          setCalendarDate(moment());
        }}
        isMobile={false}
      />

      <CustomCalendar
        schedules={filteredEvents}
        currentMonth={calendarDate}
        setCurrentMonth={setCalendarDate}
        onSelectSchedule={handleSelectEvent}
        shouldFilterInactive={false}
      />

      
    </div>
  );
}
