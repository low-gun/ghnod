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

    const url = `${baseURL}/education/schedules/public?type=전체&start_date=${startOfMonth}&end_date=${endOfMonth}`;
    const res = await axios.get(url, { headers: { Cookie: cookie } });

    // ✅ 필요한 필드만 슬림화
    const rows = Array.isArray(res.data?.schedules) ? res.data.schedules : [];
    const slim = rows.map((r) => ({
      id: r.id,
      title: r.title,
      start_date: r.start_date,
      end_date: r.end_date,
      type: r.type ?? null,
      category: r.category ?? null,
      product_title: r.product_title ?? null,
    }));

    return { props: { eventsData: slim } };
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
  const cacheRef = React.useRef(new Map()); // (key: "start:end")
  const hasSSRDataRef = React.useRef(
    Array.isArray(eventsData) && eventsData.length > 0
  );
  const skippedFirstDatesSetRef = React.useRef(false);

  const fetchSchedulesByRange = React.useCallback(
    async (startStr, endStr) => {
      /* 기존 그대로 */
    },
    [showLoading, hideLoading]
  );

  const stableOnDatesSet = useCallback(
    (info) => {
      const start = info.startStr.slice(0, 10);
      const end = info.endStr.slice(0, 10);

      // ✅ SSR로 이미 같은 달 데이터가 들어온 첫 렌더에서는 fetch를 건너뜀
      if (hasSSRDataRef.current && !skippedFirstDatesSetRef.current) {
        skippedFirstDatesSetRef.current = true;
        // 현재 보이는 범위를 기록해 이후 동일 범위 재호출 방지
        lastRangeRef.current = { start, end };
        return;
      }

      fetchSchedulesByRange(start, end);
    },
    [fetchSchedulesByRange]
  );

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
