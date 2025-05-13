// frontend/components/schedules/MySingleAgendaView.jsx
import React from "react";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";

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

export default class MySingleAgendaView extends React.Component {
  render() {
    const { date, events, localizer } = this.props;

    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const filtered = events.filter((evt) => {
      const evtStart = evt.start;
      const evtEnd = evt.end;
      return !(isAfter(evtStart, end) || isBefore(evtEnd, start));
    });

    return (
      <div style={{ padding: "20px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          <thead style={{ backgroundColor: "#f9f9f9" }}>
            <tr>
              <th style={thLeft}>기간</th>
              <th style={thCenter}>제목</th>
              <th style={thCenter}>장소</th>
              <th style={thCenter}>강사</th>
              <th style={thLeft}>내용</th>
              <th style={thCenter}>정원</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "12px" }}
                >
                  일정이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((evt, index) => {
                const sameDay = isSameDay(evt.start, evt.end);
                const startDay = localizer.format(evt.start, "M월 d일");
                const endDay = localizer.format(evt.end, "M월 d일");
                const startTime = formatKoreanAMPM(evt.start);
                const endTime = formatKoreanAMPM(evt.end);

                const rangeElement = sameDay ? (
                  <>
                    {startDay} {startTime}
                    <br />~ {endTime}
                  </>
                ) : (
                  <>
                    {startDay} {startTime}
                    <br />~ {endDay} {endTime}
                  </>
                );

                return (
                  <tr
                    key={evt.id}
                    style={{
                      cursor: "pointer",
                      backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() => this.handleSelectEvent(evt)}
                  >
                    <td style={tdLeft}>{rangeElement}</td>
                    <td style={tdCenter}>{evt.title}</td>
                    <td style={tdCenter}>{evt.location || "-"}</td>
                    <td style={tdCenter}>{evt.instructor || "-"}</td>
                    <td style={tdLeft}>{evt.description || "-"}</td>
                    <td style={tdCenter}>
                      {evt.total_spots ? `${evt.total_spots}명` : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  handleSelectEvent = (evt) => {
    if (this.props.onSelectEvent) {
      this.props.onSelectEvent(evt);
    }
  };

  static navigate(date, action) {
    switch (action) {
      case "PREV":
        return addMonths(date, -1);
      case "NEXT":
        return addMonths(date, 1);
      default:
        return date;
    }
  }

  static range(date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return { start, end };
  }

  static title(date, { localizer }) {
    return localizer.format(date, "yyyy년 M월 교육일정", {});
  }
}

// ✅ 스타일 정의
const thLeft = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: "15px",
};

const thCenter = {
  padding: "12px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "15px",
};

const tdLeft = {
  padding: "12px",
  textAlign: "left",
  fontSize: "15px",
};

const tdCenter = {
  padding: "12px",
  textAlign: "center",
  fontSize: "15px",
};
