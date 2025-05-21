import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ko from "date-fns/locale/ko";
import "react-big-calendar/lib/css/react-big-calendar.css";

import TextContent from "../../components/layout/contents/TextContent";
import CustomEvent from "../../components/schedules/CustomEvent";
import MySingleAgendaView from "../../components/schedules/MySingleAgendaView";
import axios from "axios"; // ✅ SSR self-fetch

function formatKoreanAMPM(date) {
  if (!(date instanceof Date)) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours < 12 ? "오전" : "오후";
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  const mm = String(minutes).padStart(2, "0");
  return `${ampm} ${hour12}:${mm}`;
}

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

const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) =>
    format(date, formatStr, { ...(options || {}), locale: ko }),
  parse: (dateString, formatStr, options) =>
    parse(dateString, formatStr, { ...(options || {}), locale: ko }),
  startOfWeek: (date) => startOfWeek(date, { locale: ko }),
  getDay,
  locales: { ko },
});

const messagesKo = {
  allDay: "종일",
  previous: "이전",
  next: "다음",
  today: "오늘",
  month: "월",
  week: "주",
  myAgenda: "목록",
  date: "날짜",
  time: "시간",
  event: "이벤트",
  noEventsInRange: "이 기간에는 일정이 없습니다.",
};

const formats = {
  monthHeaderFormat: (date) =>
    `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
  dayRangeHeaderFormat: ({ start, end }) =>
    `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${
      end.getMonth() + 1
    }월 ${end.getDate()}일`,
  weekdayFormat: (date) => {
    const dayMap = ["일", "월", "화", "수", "목", "금", "토"];
    return dayMap[date.getDay()];
  },
  timeGutterFormat: (date) => formatKoreanAMPM(date),
  eventTimeRangeFormat: ({ start, end }) =>
    `${formatKoreanAMPM(start)} ~ ${formatKoreanAMPM(end)}`,
  agendaTimeRangeFormat: ({ start, end }) =>
    `${formatKoreanAMPM(start)} ~ ${formatKoreanAMPM(end)}`,
  agendaTimeFormat: (date) => formatKoreanAMPM(date),
};

function EventDetailPanel({ event }) {
  const router = useRouter();

  if (!event) {
    return (
      <div style={{ padding: 16 }}>일정을 클릭하면 정보를 표시합니다.</div>
    );
  }

  const formatDetailDate = (d) => {
    if (!(d instanceof Date)) return "";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}년 ${m}월 ${day}일 ${formatKoreanAMPM(d)}`;
  };

  const startDate = formatDetailDate(event.start);
  const endDate = formatDetailDate(event.end);

  return (
    <div style={{ padding: 16, fontSize: "14px" }}>
      <p>
        <strong>기간:</strong>
        <br />
        {startDate} ~ {endDate}
      </p>
      <p>
        <strong>제목:</strong>
        <br />
        {event.title}
      </p>
      <p>
        <strong>장소:</strong>
        <br />
        {event.location}
      </p>
      <p>
        <strong>강사:</strong>
        <br />
        {event.instructor}
      </p>
      <p>
        <strong>내용:</strong>
        <br />
        {event.description}
      </p>
      <p>
        <strong>정원:</strong>
        <br />
        {event.total_spots || "-"}
      </p>
      <button onClick={() => router.push(`/education/calendar/${event.id}`)}>
        자세히 보기
      </button>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const cookie = context.req.headers.cookie || "";

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules`,
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
      props: { eventsData: data.schedules },
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
    }))
  );

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31));
  const [calendarDate, setCalendarDate] = useState(new Date());

  const handleSelectEvent = (event) => setSelectedEvent(event);

  useEffect(() => {
    if (searchType === "교육기간") {
      setCalendarDate(startDate);
    }
  }, [searchType, startDate]);

  const handleNavigate = (newDate) => setCalendarDate(newDate);

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

  const paragraphs = [
    "이 페이지는 DB에서 가져온 교육 일정을 달력 형태로 보여줍니다.",
    "날짜/시간 표기를 한국어(오전/오후) 형태로 표시합니다.",
  ];
  const subTabs = [
    { label: "calendar", href: "/education/calendar" },
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ];

  return (
    <>
      <TextContent
        title="calendar"
        subtitle="교육 일정 달력"
        paragraphs={paragraphs}
        tabs={subTabs}
      />

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

      {/* 달력 + 우측 패널 */}
      <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
        <div style={{ flex: 1, fontSize: "14px" }}>
          <Calendar
            localizer={localizer}
            culture="ko"
            messages={messagesKo}
            formats={formats}
            events={filteredEvents}
            date={calendarDate}
            onNavigate={handleNavigate}
            style={{ height: 600 }}
            views={{
              month: true,
              week: true,
              myAgenda: MySingleAgendaView,
            }}
            components={{ event: CustomEvent }}
            onSelectEvent={handleSelectEvent}
            startAccessor="start"
            endAccessor="end"
          />
        </div>

        <div
          style={{
            width: "300px",
            minHeight: "600px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <EventDetailPanel event={selectedEvent} />
        </div>
      </div>
    </>
  );
}
