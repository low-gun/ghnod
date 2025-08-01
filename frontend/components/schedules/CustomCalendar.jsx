import React, { useMemo, useState, useRef } from "react";
import moment from "moment";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ScheduleDetailModal from "./ScheduleDetailModal";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";

export default function CustomCalendar({
  schedules = [],
  shouldFilterInactive = true,
  onSelectSchedule,
  mode = "user",
}) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();
  const calendarRef = useRef(null);

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

  return (
    <div className="custom-calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        height="auto"
        events={stableSchedules}
        dayMaxEventRows={3} // 하루에 3개까지만 bar 표시
        moreLinkClick="popover" // +more 클릭시 팝오버(기본)
        moreLinkContent={(args) => (
          <span style={{ color: "#222", fontWeight: 600, fontSize: "11px" }}>
            +{args.num}
          </span>
        )}
        eventClick={(info) => {
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
        }}
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
        eventContent={(arg) => {
          // 다양한 색상 10종 분배
          const colorList = [
            "#2563eb", // 파랑
            "#1e40af", // 남색
            "#3b82f6", // 하늘파랑
            "#60a5fa", // 연파랑
            "#1d4ed8", // 진한파랑
            "#38bdf8", // 푸른청록
            "#10b981", // 민트그린
            "#a21caf", // 보라
            "#f59e42", // 오렌지
            "#e11d48", // 핑크
          ];
          // id가 없으면 index 등으로 fallback
          const colorIdx = arg.event.id
            ? Array.from(String(arg.event.id)).reduce(
                (a, b) => a + b.charCodeAt(0),
                0
              ) % colorList.length
            : arg.event._def?.publicId
              ? Array.from(String(arg.event._def.publicId)).reduce(
                  (a, b) => a + b.charCodeAt(0),
                  0
                ) % colorList.length
              : 0;
          const bgColor = colorList[colorIdx];
          return (
            <div
              style={{
                backgroundColor: bgColor,
                color: "#fff",
                borderRadius: "4px",
                padding: "1px 4px",
                fontSize: "12px",
                fontWeight: 500,
                minHeight: 16,
                maxHeight: 16,
                lineHeight: "24px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 4,
                border: "none",
                boxShadow: "none",
                display: "flex", // 추가
                alignItems: "center", // 추가
              }}
              title={arg.event.title}
            >
              {arg.event.title}
            </div>
          );
        }}
        dayCellDidMount={(info) => {
          // 현재 날짜의 이벤트 개수 구하기
          const events = info.view.calendar
            .getEvents()
            .filter(
              (ev) =>
                ev.start &&
                ev.start.getDate() === info.date.getDate() &&
                ev.start.getMonth() === info.date.getMonth() &&
                ev.start.getFullYear() === info.date.getFullYear()
            );
          // 표시된 이벤트 개수 (최대 3)
          const showCount = Math.min(events.length, 3);
          // 부족한 줄 수만큼 빈 bar 생성
          const needEmpty = 3 - showCount;
          if (needEmpty > 0) {
            const container = info.el.querySelector(".fc-daygrid-day-events");
            if (container) {
              for (let i = 0; i < needEmpty; i++) {
                const div = document.createElement("div");
                div.style.minHeight = "14px";
                div.style.maxHeight = "14px";
                div.style.marginBottom = "4px";
                div.style.visibility = "hidden";
                container.appendChild(div);
              }
            }
          }
        }}
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
