import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import moment from "moment";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ScheduleDetailModal from "./ScheduleDetailModal";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";

function CustomCalendar({
  schedules = [],
  shouldFilterInactive = true,
  onSelectSchedule,
  onDatesSet,
  mode = "user",
}) {
  console.log("render <CustomCalendar>", schedules?.length ?? 0);

  const [selectedSchedule, setSelectedSchedule] = useState(null);
const showAlert = useGlobalAlert((s) => s.showAlert);
const showConfirm = useGlobalConfirm((s) => s.showConfirm);
const calendarRef = useRef(null);
const lastRangeRef = useRef({ start: "", end: "" }); // ★ 추가: 같은 범위 재요청 방지
const [isMobile, setIsMobile] = useState(false);

// ✅ 회차 단위 이벤트를 담을 상태
const [sessionEvents, setSessionEvents] = useState([]);

// ✅ 회차 목록 로더
const fetchSessionEvents = useCallback(async (startYmd, endYmd) => {
  try {
    const { data } = await api.get("/education/schedules/public/sessions", {
      params: { start_date: startYmd, end_date: endYmd, limit: 1000 },
    });

    const list = Array.isArray(data?.sessions) ? data.sessions : [];
    console.table(
      list.slice(0, 8).map(ss => ({
        session_id: ss.session_id,
        schedule_id: ss.schedule_id,
        title: ss.title,
        start_date: ss.start_date,
        end_date: ss.end_date,
        start_time: ss.start_time,
        end_time: ss.end_time,
        type: ss.type,
      }))
    );
    console.log("🔎 [sessions sample]",
      list.slice(0, 8).map(ss => ({
        session_id: ss.session_id,
        schedule_id: ss.schedule_id,
        title: ss.title,
        start_date: ss.start_date,
        end_date: ss.end_date,
        start_time: ss.start_time,
        end_time: ss.end_time,
        type: ss.type,
      }))
    ); // ★ 추가

    setSessionEvents(list);
  } catch (e) {
    console.error("❌ 공개 회차 목록 조회 실패:", e);
    showAlert("일정 불러오기 실패");
  }
}, [showAlert]);


  useEffect(() => {
    if (typeof window === "undefined") return; // SSR 가드

    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);

    apply();

    // 브라우저 호환 처리
    if (mq.addEventListener) {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      mq.addListener(apply);
      return () => mq.removeListener(apply);
    }
  }, []);

  const handleEdit = (item) => {
    const targetId = item.schedule_id || item.id; // ✅ 일정 id 우선
    window.location.href = `/admin/schedules/${targetId}`;
  };
  const handleDelete = async (item) => {
    const targetId = item.schedule_id || item.id; // ✅
    const ok = await showConfirm("정말 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await api.request({
        method: "delete",
        url: "admin/schedules",
        headers: { "Content-Type": "application/json" },
        data: { ids: [targetId] },
      });      showAlert("삭제되었습니다.");
      setSelectedSchedule(null);
      window.location.reload();
    } catch (err) {
      console.error("삭제 실패:", err);
      showAlert("삭제 실패");
    }
  };
  
  // ✅ 세션(회차) → FC 이벤트
  const stableEvents = useMemo(() => {
    return sessionEvents.map((ss) => {
      let start, end, allDay = false;
  
      if (ss.start_time === "00:00:00" && ss.end_time === "00:00:00") {
        // ▶ 종일 일정
        allDay = true;
        start = moment(`${ss.start_date} 00:00:00`).toISOString();
        end   = moment(`${ss.end_date} 00:00:00`).add(1, "day").toISOString();
      } else {
        // ▶ 시간 있는 일정
        const st = ss.start_time ?? "00:00:00";
        const et = ss.end_time   ?? "00:00:00";
        start = moment(`${ss.start_date} ${st}`).toISOString();
        end   = moment(`${ss.end_date} ${et}`).toISOString();
      }
  
      return {
        id: ss.session_id,
        title: ss.title,
        start,
        end,
        allDay,
        extendedProps: {
          schedule_id: ss.schedule_id,
          type: ss.type ?? null,
          productTitle: ss.product_title ?? null,
          start_time: ss.start_time,
          end_time: ss.end_time,
          image_url: ss.image_url,
        },
      };
    });
  }, [sessionEvents]);
  
  
  
  
const stableOnDatesSet = useCallback(
  (info) => {
    // info.start ~ info.end은 6주 격자 범위이므로,
    // 중간 지점을 기준으로 '보이는 달'을 계산
    const mid = moment(info.start).add(2, "weeks");
    const monthStart = mid.clone().startOf("month");
    const monthEndEx = mid.clone().endOf("month").add(1, "day"); // end exclusive

    const startYmd = monthStart.format("YYYY-MM-DD");
    const endYmd   = monthEndEx.format("YYYY-MM-DD");

    // 같은 범위 재요청 방지
    if (lastRangeRef.current.start === startYmd && lastRangeRef.current.end === endYmd) {
      return;
    }
    lastRangeRef.current = { start: startYmd, end: endYmd };

    console.log("🔎 [FC safe month range]", { startYmd, endYmd });

    // ★ 단 한 번만 호출
    fetchSessionEvents(startYmd, endYmd);

    if (onDatesSet) onDatesSet(info);
  },
  [onDatesSet, fetchSessionEvents]
);



  const colorList = useMemo(
    () => [
      "#F28B82", // 부드러운 레드
      "#F6AD55", // 따뜻한 오렌지
      "#F6E58D", // 파스텔 옐로우
      "#A3D9A5", // 톤다운 민트/그린
      "#7EB6F3", // 파스텔 블루
      "#A29BFE", // 연보라 (퍼플)
      "#D7A9E3", // 라일락 핑크 퍼플
    ],
    []
  );

  // ✅ 같은 일정(schedules)을 같은 색으로 보이게: schedule_id 기준
const getColor = useCallback(
  (scheduleId) => {
    const key = String(scheduleId ?? "");
    const idx = key ? Array.from(key).reduce((a, b) => a + b.charCodeAt(0), 0) % colorList.length : 0;
    return colorList[idx];
  },
  [colorList]
);
const renderEventContent = useCallback(
  (arg) => {
    const isPopover = arg.el?.closest?.(".fc-popover");
    const title = arg.event.title;
    const sid = arg.event.extendedProps?.schedule_id;
    const bgColor = getColor(sid);
    return isPopover ? (
      <div className="gh-popover-item">
        <span className="gh-popover-title">{title}</span>
      </div>
    ) : (
      <div
        className="gh-event-chip"
        style={{ backgroundColor: bgColor }}
        title={title}
      >
        {title}
      </div>
    );
  },
  [getColor]
);

const handleEventClick = useCallback(
  (info) => {
    const eventData = {
      // 세션 클릭 시: id는 session_id, schedule_id는 extendedProps
      id: info.event.id, // session_id
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps, // schedule_id, type 등
    };
    if (onSelectSchedule) {
      onSelectSchedule(eventData);
    } else {
      setSelectedSchedule(eventData);
    }
  },
  [onSelectSchedule]
);

  return (
    <div className="custom-calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        height="auto"
        datesSet={stableOnDatesSet}
        events={stableEvents}        // ✅ 회차 단위 이벤트 사용
        /* 모바일: 더 촘촘하게(2개만 bar) / 데스크탑: 3개 */
        dayMaxEvents={isMobile ? 2 : 3}
        /* 요일 헤더를 더 짧게 */
        dayHeaderFormat={
          isMobile ? { weekday: "narrow" } : { weekday: "short" }
        }
        /* +n 라벨: 모바일은 간결하게 */
        moreLinkClick="popover"
        moreLinkContent={(args) => (
          <span
            className="fc-more-link-custom"
            title={`${args.num}개의 추가 일정 보기`}
          >
            +{args.num}
          </span>
        )}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
        eventContent={renderEventContent}
      />

      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onEdit={() => handleEdit(selectedSchedule)}
          onDelete={() => handleDelete(selectedSchedule)}
          mode={mode}
        />
      )}
    </div>
  );
}
export default React.memo(CustomCalendar);
