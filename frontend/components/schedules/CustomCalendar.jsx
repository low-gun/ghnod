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
  const [isMobile, setIsMobile] = useState(false);
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

  const handleEdit = (schedule) => {
    window.location.href = `/admin/schedules/${schedule.id}`;
  };

  const handleDelete = async (schedule) => {
    const ok = await showConfirm("정말 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await api.delete(`admin/schedules/${schedule.id}`);
      showAlert("삭제되었습니다.");
      setSelectedSchedule(null);
      window.location.reload();
    } catch (err) {
      console.error("삭제 실패:", err);
      showAlert("삭제 실패");
    }
  };

  const stableSchedules = useMemo(() => {
    const filtered = shouldFilterInactive
      ? schedules.filter((s) => s.is_active !== false)
      : schedules;
    return filtered.map((s) => ({
      ...s,
      start: moment(s.start).toISOString(),
      end: moment(s.end).add(1, "day").toISOString(),
      id: s.id,
      title: s.title,
      type: s.type ?? s.category ?? null,
      productTitle: s.productTitle ?? null,
    }));
  }, [schedules, shouldFilterInactive]);
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

  const getColor = useCallback(
    (id) => {
      const idx = id
        ? Array.from(String(id)).reduce((a, b) => a + b.charCodeAt(0), 0) %
          colorList.length
        : 0;
      return colorList[idx];
    },
    [colorList]
  );
  const stableOnDatesSet = useCallback(
    (info) => {
      if (onDatesSet) onDatesSet(info);
    },
    [onDatesSet]
  );
  const renderEventContent = useCallback(
    (arg) => {
      const isPopover = arg.el?.closest?.(".fc-popover");
      const title = arg.event.title;
      const bgColor = getColor(arg.event.id);

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
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        ...info.event.extendedProps,
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
        events={stableSchedules}
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
