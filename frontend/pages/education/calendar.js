import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import moment from "moment"; // 상단에 import 추가
import CustomCalendar from "../../components/schedules/CustomCalendar"; // ✅ 교체
import axios from "axios"; // ✅ SSR self-fetch
import ScheduleDetailModal from "@/components/schedules/ScheduleDetailModal";

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
    console.log("👉 baseURL:", process.env.NEXT_PUBLIC_API_BASE_URL);
    const now = moment();
    const startOfMonth = now.clone().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = now
      .clone()
      .endOf("month")
      .add(1, "month")
      .format("YYYY-MM-DD");

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=전체&start_date=${startOfMonth}&end_date=${endOfMonth}`,
      {
        headers: { Cookie: cookie },
      }
    );

    const data = res.data;

    if (!data?.schedules) {
      return {
        props: { eventsData: [] },
      };
    }

    return {
      props: {
        eventsData: data.schedules.map((item) => ({
          id: item.id,
          title: item.title,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          instructor: item.instructor,
          total_spots: item.total_spots,
          type: item.type || item.category || null,
        })),
      },
    };
  } catch (error) {
    console.error("SSR education/calendar error:", error);
    return {
      props: { eventsData: [] },
    };
  }
}

export default function CalendarPage({ eventsData }) {
  const [events, setEvents] = useState(() =>
    eventsData.map((item) => ({
      id: item.id,
      title: item.title,
      start: new Date(item.start_date),
      end: new Date(item.end_date),
      location: item.location,
      instructor: item.instructor,
      description: item.description,
      total_spots: item.total_spots,
      type: item.type || item.category || null, // ✅ 여기서 제대로 넣어줘야 함
    }))
  );

  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31));
  const [calendarDate, setCalendarDate] = useState(moment());

  const router = useRouter();
  const selectedEvent = useMemo(() => {
    const id = router.query.id;
    return events.find((e) => String(e.id) === String(id));
  }, [router.query.id, events]); // 📌 이걸 여기 넣기
  const handleSelectEvent = (event) => {
    console.log("🧪 클릭된 일정:", event);

    if (!event?.type) {
      alert("교육 타입 정보가 없습니다.");
      return;
    }

    router.push(`/education/${event.type}/${event.id}`);
  };

  useEffect(() => {
    if (searchType === "교육기간") {
      setCalendarDate(startDate);
    }
  }, [searchType, startDate]);

  const filteredEvents = events.filter((evt) => {
    const kw = searchKeyword.toLowerCase();

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
    } else if (
      searchType === "교육명" &&
      kw &&
      !evt.title?.toLowerCase().includes(kw)
    ) {
      return false;
    } else if (searchType === "교육기간") {
      const evtStart = evt.start;
      const evtEnd = evt.end;
      if (evtEnd < startDate || evtStart > endDate) return false;
    }
    return true;
  });

  return (
    <>
      {/* 달 이동 컨트롤 */}
      <div
        style={{
          textAlign: "center",
          margin: "8px 0 16px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        <span
          style={{ marginRight: "20px", cursor: "pointer", fontSize: "24px" }}
          onClick={() =>
            setCalendarDate(calendarDate.clone().subtract(1, "month"))
          }
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
      <div
        style={{
          margin: "0 20px 10px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                width: "50%",
              }}
            >
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
      {/* 모달은 바깥에서 렌더링 */}
      <ScheduleDetailModal
        schedule={selectedEvent}
        onClose={() =>
          router.push(router.pathname, undefined, { shallow: true })
        }
        mode="user"
      />
    </>
  );
}
