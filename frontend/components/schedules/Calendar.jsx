import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment/locale/ko"; // ✅ 한국어 지원

import MySingleAgendaView from "./MySingleAgendaView";
import CustomToolbar from "./CustomToolbar";
import CustomEvent from "./CustomEvent";
import CustomAgendaEvent from "./CustomAgendaEvent";

moment.locale("ko"); // ✅ moment 한국어 설정
const localizer = momentLocalizer(moment);

// ✅ 메시지 한글화
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

export default function Calendar({
  schedules,
  onClickCreate,
  onSelectEvent,
  formats,
}) {
  return (
    <BigCalendar
      localizer={localizer}
      culture="ko"
      messages={messagesKo}
      events={schedules}
      defaultView="month"
      views={{ month: true, week: true, myAgenda: MySingleAgendaView }}
      components={{
        toolbar: (props) => (
          <CustomToolbar {...props} openModalForCreate={onClickCreate} />
        ),
        event: CustomEvent,
        agenda: {
          event: CustomAgendaEvent,
        },
      }}
      startAccessor="start"
      endAccessor="end"
      onSelectEvent={onSelectEvent}
      style={{ height: 600 }}
      formats={formats}
    />
  );
}
