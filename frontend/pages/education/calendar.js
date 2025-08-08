import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/router";
import moment from "moment";
import CustomCalendar from "../../components/schedules/CustomCalendar";
import axios from "axios";
import ScheduleDetailModal from "@/components/schedules/ScheduleDetailModal";
import { useGlobalAlert } from "@/stores/globalAlert";
import SearchFilter from "@/components/common/SearchFilter";
import useGlobalLoading from "@/stores/globalLoading";

// (참고 함수: 필요 시 유지)
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

export default function CalendarPage() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const { showLoading, hideLoading } = useGlobalLoading();

  // ✅ CSR: 빈 배열로 시작
  const [eventsDataState, setEventsDataState] = useState([]);
  const initializedRef = React.useRef(false);
  const [initialized, setInitialized] = useState(false); // ⬅ 추가
  // ✅ 검색/필터 상태
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31));
  const [calendarDate, setCalendarDate] = useState(moment());

  // ✅ 범위/캐시/초기 페치 제어
  const lastRangeRef = useRef({ start: "", end: "" });
  const cacheRef = useRef(new Map()); // key: "start:end" -> rows
  const didInitialFetchRef = useRef(false); // 첫 datesSet 스킵용

  // ✅ 이벤트 변환
  const events = useMemo(
    () =>
      (eventsDataState || []).map((item) => ({
        ...item,
        start: new Date(item.start_date),
        end: new Date(item.end_date),
        type: item.type || item.category || null,
      })),
    [eventsDataState]
  );

  // ✅ 상세 모달용 선택 이벤트
  const selectedEvent = useMemo(() => {
    const id = router.query.id;
    return events.find((e) => String(e.id) === String(id));
  }, [router.query.id, events]);

  // ✅ 일정 클릭
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

  // ✅ 교육기간 검색 시 캘린더 이동
  useEffect(() => {
    if (searchType === "교육기간") setCalendarDate(moment(startDate));
  }, [searchType, startDate]);

  // ✅ 필터 적용
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

  // ✅ 범위별 스케줄 로드 (캐시 포함)
  const fetchSchedulesByRange = useCallback(
    async (startStr, endStr) => {
      try {
        const key = `${startStr}:${endStr}`;

        // 캐시 적중
        if (cacheRef.current.has(key)) {
          setEventsDataState(cacheRef.current.get(key));
          lastRangeRef.current = { start: startStr, end: endStr };
          if (!initializedRef.current) {
            // ⬅ 추가
            initializedRef.current = true;
            setInitialized(true);
          }
          return;
        }

        // 동일 범위 중복 방지
        if (
          lastRangeRef.current.start === startStr &&
          lastRangeRef.current.end === endStr
        )
          return;

        lastRangeRef.current = { start: startStr, end: endStr };

        showLoading();

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
        if (!initializedRef.current) {
          // ⬅ 추가
          initializedRef.current = true;
          setInitialized(true);
        }
      }
    },
    [showLoading, hideLoading]
  );

  // ✅ 달력 범위 변경 시: 첫 트리거는 스킵(초기 CSR 페치가 이미 실행됨)
  const stableOnDatesSet = useCallback(
    (info) => {
      const start = info.startStr.slice(0, 10);
      const end = info.endStr.slice(0, 10);

      if (!didInitialFetchRef.current) {
        lastRangeRef.current = { start, end };
        didInitialFetchRef.current = true;
        return; // 첫 datesSet 스킵
      }

      fetchSchedulesByRange(start, end);
    },
    [fetchSchedulesByRange]
  );

  // ✅ 첫 진입: 현재 달 한 번만 CSR로 로드
  useEffect(() => {
    const start = moment().startOf("month").format("YYYY-MM-DD");
    const end = moment().endOf("month").format("YYYY-MM-DD");
    fetchSchedulesByRange(start, end);
    lastRangeRef.current = { start, end };
    didInitialFetchRef.current = true;
    // 혹시 응답이 실패해도 스켈레톤이 영원히 남지 않도록 3초 타임아웃 가드(선택)
    const t = setTimeout(() => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setInitialized(true);
      }
    }, 3000);
    return () => clearTimeout(t);
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

      {/* 초기 로딩 스켈레톤(간단 문구) */}
      {!initialized ? (
        <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
          달력 불러오는 중…
        </div>
      ) : (
        <CustomCalendar
          schedules={filteredEvents} // 0건이어도 달력은 렌더됨(정상)
          currentMonth={calendarDate}
          setCurrentMonth={setCalendarDate}
          onSelectSchedule={handleSelectEvent}
          shouldFilterInactive={false}
          onDatesSet={stableOnDatesSet}
        />
      )}

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
