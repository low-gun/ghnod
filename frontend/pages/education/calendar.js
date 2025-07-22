import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import moment from "moment";
import CustomCalendar from "../../components/schedules/CustomCalendar";
import axios from "axios";
import ScheduleDetailModal from "@/components/schedules/ScheduleDetailModal";

// 날짜 포맷/파싱 함수
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
    if (!baseURL) throw new Error("API_BASE_URL 환경변수가 설정되지 않았습니다.");
    const now = moment();
    const startOfMonth = now.clone().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = now.clone().endOf("month").add(1, "month").format("YYYY-MM-DD");
    const res = await axios.get(
      `${baseURL}/education/schedules/public?type=전체&start_date=${startOfMonth}&end_date=${endOfMonth}`,
      { headers: { Cookie: cookie } }
    );
    const data = res.data;
    return {
      props: {
        eventsData: (data?.schedules || []).map((item) => ({
          id: item.id,
          title: item.title,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          instructor: item.instructor,
          total_spots: item.total_spots,
          type: item.type || item.category || null,
          description: item.description,
        })),
      },
    };
  } catch (error) {
    return { props: { eventsData: [] } };
  }
}

export default function CalendarPage({ eventsData }) {
  const router = useRouter();

  // 상태
  const [events] = useState(() =>
    eventsData.map((item) => ({
      id: item.id,
      title: item.title,
      start: new Date(item.start_date),
      end: new Date(item.end_date),
      location: item.location,
      instructor: item.instructor,
      description: item.description,
      total_spots: item.total_spots,
      type: item.type || item.category || null,
    }))
  );
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31));
  const [calendarDate, setCalendarDate] = useState(moment());

  // 선택 일정 모달(메모이제이션)
  const selectedEvent = useMemo(() => {
    const id = router.query.id;
    return events.find((e) => String(e.id) === String(id));
  }, [router.query.id, events]);

  // 일정 클릭 핸들러
  const handleSelectEvent = useCallback((event) => {
    if (!event?.type) {
      alert("교육 타입 정보가 없습니다.");
      return;
    }
    router.push(`/education/${event.type}/${event.id}`);
  }, [router]);

  // 검색 타입이 바뀌면 날짜 리셋
  useEffect(() => {
    if (searchType === "교육기간") setCalendarDate(moment(startDate));
  }, [searchType, startDate]);

  // 필터링(메모이제이션)
  const filteredEvents = useMemo(() => {
    const kw = searchKeyword.toLowerCase();
    return events.filter((evt) => {
      if (searchType === "전체") {
        if (
          kw &&
          !(
            evt.title?.toLowerCase().includes(kw) ||
            evt.location?.toLowerCase().includes(kw) ||
            evt.instructor?.toLowerCase().includes(kw) ||
            evt.description?.toLowerCase().includes(kw)
          )
        )
          return false;
      } else if (searchType === "교육명" && kw && !evt.title?.toLowerCase().includes(kw)) {
        return false;
      } else if (searchType === "교육기간") {
        if (evt.end < startDate || evt.start > endDate) return false;
      }
      return true;
    });
  }, [events, searchType, searchKeyword, startDate, endDate]);

  // 스타일 상수
  const searchBarStyle = {
    margin: "0 20px 10px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#f9f9f9",
  };

  const calendarHeaderStyle = {
    textAlign: "center",
    margin: "8px 0 16px",
    fontSize: "20px",
    fontWeight: "bold",
  };

  return (
    <>
      {/* 달 이동 컨트롤 */}
      <div style={calendarHeaderStyle}>
        <span
          style={{ marginRight: "20px", cursor: "pointer", fontSize: "24px" }}
          onClick={() => setCalendarDate(calendarDate.clone().subtract(1, "month"))}
        >
          ◀
        </span>
        {calendarDate.format("YYYY년 M월")}
        <span
          style={{ marginLeft: "20px", cursor: "pointer", fontSize: "24px" }}
          onClick={() => setCalendarDate(calendarDate.clone().add(1, "month"))}
        >
          ▶
        </span>
      </div>

      {/* 검색 영역 */}
      <div style={searchBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              setSearchKeyword("");
              setStartDate(new Date());
              setEndDate(new Date(2025, 11, 31));
            }}
            style={{
              padding: "4px 8px",
              border: "none",
              backgroundColor: "transparent",
              fontSize: "14px",
            }}
          >
            <option value="전체">전체</option>
            <option value="교육명">교육명</option>
            <option value="교육기간">교육기간</option>
          </select>

          {(searchType === "전체" || searchType === "교육명") && (
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: "50%",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          )}

          {searchType === "교육기간" && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "50%" }}>
              <input
                type="date"
                value={formatYYYYMMDD(startDate)}
                onChange={(e) => setStartDate(parseYYYYMMDD(e.target.value))}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <span>~</span>
              <input
                type="date"
                value={formatYYYYMMDD(endDate)}
                onChange={(e) => setEndDate(parseYYYYMMDD(e.target.value))}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
        <div style={{ flex: 1, fontSize: "14px" }}>
          <CustomCalendar
            schedules={filteredEvents}
            currentMonth={calendarDate}
            setCurrentMonth={setCalendarDate}
            onSelectSchedule={handleSelectEvent}
            shouldFilterInactive={false}
          />
        </div>
      </div>
      {/* 모달 */}
      <ScheduleDetailModal
        schedule={selectedEvent}
        onClose={() => router.push(router.pathname, undefined, { shallow: true })}
        mode="user"
      />
    </>
  );
}
