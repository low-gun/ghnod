// frontend/components/schedules/CustomAgendaEvent.jsx
import { format, isSameDay } from "date-fns";

export default function CustomAgendaEvent({ event }) {
  // Agenda(목록) 뷰에서 일정 표시
  const sameDay = isSameDay(event.start, event.end);
  const startStr = format(event.start, "yyyy-MM-dd HH:mm");
  const endStr = format(event.end, "yyyy-MM-dd HH:mm");

  return (
    <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
      <div style={{ fontWeight: "bold" }}>{event.title}</div>
      <div>{sameDay ? startStr : `${startStr} ~ ${endStr}`}</div>
      {event.location && (
        <div>
          장소: {event.location}
          {event.instructor && ` (강사: ${event.instructor})`}
        </div>
      )}
      {/* etc... */}
    </div>
  );
}
