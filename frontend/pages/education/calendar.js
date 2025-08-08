import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import moment from "moment";
import CustomCalendar from "../../components/schedules/CustomCalendar";
import axios from "axios";
import ScheduleDetailModal from "@/components/schedules/ScheduleDetailModal";
import { useGlobalAlert } from "@/stores/globalAlert";
import SearchFilter from "@/components/common/SearchFilter";
import useGlobalLoading from "@/stores/globalLoading"; // ⬅ default import로 변경
function formatYYYYMMDD(date) {
  if (!(date instanceof Date)) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYYYYMMDD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export async function getServerSideProps(context) {
  try {
    const cookie = context.req.headers.cookie || "";
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseURL)
      throw new Error("API_BASE_URL 환경변수가 설정되지 않았습니다.");

    const now = moment();
    const startOfMonth = now.clone().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = now.clone().endOf("month").format("YYYY-MM-DD");

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
  const { showAlert } = useGlobalAlert(); // ⬅ 복구
  const [eventsDataState, setEventsDataState] = useState(eventsData || []);
  const { showLoading, hideLoading } = useGlobalLoading();

  const events = useMemo(
    () =>
      (eventsDataState || []).map((item) => ({
        ...item,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        type: item.type || item.category || null,
      })),
    [eventsDataState] // ⬅ 변경
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
      router.push(`/education/${event.type}/${event.id}`);
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
  // ⬅ CalendarPage 내부 최상단 훅들 아래에 추가
  const lastRangeRef = React.useRef({ start: "", end: "" });
  const cacheRef = React.useRef(new Map()); // ⬅ 추가 (key: "start:end")

  const fetchSchedulesByRange = React.useCallback(
    async (startStr, endStr) => {
      try {
        const key = `${startStr}:${endStr}`;

        if (cacheRef.current.has(key)) {
          setEventsDataState(cacheRef.current.get(key));
          lastRangeRef.current = { start: startStr, end: endStr };
          return;
        }

        if (
          lastRangeRef.current.start === startStr &&
          lastRangeRef.current.end === endStr
        )
          return;

        lastRangeRef.current = { start: startStr, end: endStr };

        showLoading(); // ⬅ 전역 로딩 on

        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = `${baseURL}/education/schedules/public?type=전체&start_date=${startStr}&end_date=${endStr}`;
        const res = await axios.get(url);
        const rows = res.data?.schedules || [];

        cacheRef.current.set(key, rows);
        setEventsDataState(rows);
      } catch (e) {
        console.error("fetchSchedulesByRange error:", e);
      } finally {
        hideLoading(); // ⬅ 전역 로딩 off
      }
    },
    [showLoading, hideLoading]
  );

  const stableOnDatesSet = useCallback(
    (info) => {
      const start = info.startStr.slice(0, 10);
      const end = info.endStr.slice(0, 10);
      fetchSchedulesByRange(start, end);
    },
    [fetchSchedulesByRange]
  );
  useEffect(() => {
    // 첫 렌더에서 현재 달 범위로 1회 보장 호출
    const start = moment().startOf("month").format("YYYY-MM-DD");
    const end = moment().endOf("month").format("YYYY-MM-DD");
    fetchSchedulesByRange(start, end);
    // lastRangeRef가 중복 호출을 막아줌
  }, [fetchSchedulesByRange]);

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
        onDatesSet={stableOnDatesSet}
      />
      {selectedEvent && (
        <ScheduleDetailModal
          schedule={selectedEvent}
          onClose={() =>
            router.push(router.pathname, undefined, { shallow: true })
          }
          mode="user"
        />
      )}
    </div>
  );
}
