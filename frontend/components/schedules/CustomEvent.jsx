// frontend/components/schedules/CustomEvent.jsx
import { format, isSameDay } from "date-fns";

export default function CustomEvent({ event }) {
  // 여기서는 달력 월/주/일 뷰에서 일정 표시
  // 예: 한 줄짜리 정보
  const sameDay = isSameDay(event.start, event.end);
  // 필요하면 시작~종료 시간 표시
  return (
    <div style={{ fontSize: "0.85rem", lineHeight: 1.4, cursor: "pointer" }}>
      <div style={{ fontWeight: "bold" }}>{event.title}</div>
    </div>
  );
}
