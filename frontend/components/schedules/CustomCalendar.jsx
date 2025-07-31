// ✅ 구글 캘린더 스타일 커스텀 캘린더 (멀티데이 + 겹침 레이어 + colSpan + +n more 최적화)
import React, { useState, useMemo } from "react";
import moment from "moment";
import ScheduleListModal from "./ScheduleListModal";
import ScheduleDetailModal from "./ScheduleDetailModal"; // ✅ 추가
import api from "@/lib/api"; // ✅ 맨 위 import 필요
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // 추가

export default function CustomCalendar({
  schedules,
  currentMonth,
  setCurrentMonth,
  onSelectSchedule,
  shouldFilterInactive = true,
  mode = "user", // ✅ 추가 (기본값 user)
}) {
  console.log("🔥 CustomCalendar schedules prop:", schedules);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const { showConfirm } = useGlobalConfirm(); // 추가

  // ✅ 여기!
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

  const dateMatrix = useMemo(() => {
    const matrix = [];
    const start = currentMonth.clone().startOf("month").startOf("week");
    const end = currentMonth.clone().endOf("month").endOf("week");
    let day = start.clone();
    while (day.isSameOrBefore(end, "day")) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day.clone());
        day.add(1, "day");
      }
      matrix.push(week);
    }
    return matrix;
  }, [currentMonth]);

  const getColorById = (id) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#a855f7",
      "#6366f1",
      "#ec4899",
      "#22d3ee",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#eab308",
      "#16a34a",
      "#4ade80",
      "#f43f5e",
    ];
    const hash =
      typeof id === "number"
        ? id
        : id
            .toString()
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleMoreClick = (date, events) => {
    setSelectedDate(date);
    setSelectedEvents(events);
  };

  const stableSchedules = useMemo(() => {
    const filtered = shouldFilterInactive
      ? schedules.filter((s) => s.is_active)
      : schedules;

    return filtered.map((s) => {
      return {
        ...s,
        type: s.type || s.category || null,
        start: moment(s.start),
        end: moment(s.end),
      };
    });
  }, [schedules, shouldFilterInactive]);

  const eventsByDateMap = useMemo(() => {
    const map = {};
    stableSchedules.forEach((e) => {
      const start = moment(e.start).startOf("day");
      const end = moment(e.end).startOf("day");
      const days = end.diff(start, "days") + 1;
      for (let i = 0; i < days; i++) {
        const dateStr = start.clone().add(i, "days").format("YYYY-MM-DD");
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(e);
      }
    });
    return map;
  }, [stableSchedules]);

  const layeredEventsByWeek = useMemo(() => {
    return dateMatrix.map((weekDates) => {
      const layers = [];
      const eventsInWeek = stableSchedules.filter((e) => {
        return (
          e.end.isSameOrAfter(weekDates[0], "day") &&
          e.start.isSameOrBefore(weekDates[6], "day")
        );
      });

      eventsInWeek.forEach((event) => {
        const start = event.start;
        const end = event.end;
        const startIndex =
          weekDates.findIndex((d) => d.isSame(start, "day")) !== -1
            ? weekDates.findIndex((d) => d.isSame(start, "day"))
            : weekDates.findIndex((d) => d.isSameOrAfter(start));

        const endIndex =
          weekDates.findIndex((d) => d.isSame(end, "day")) !== -1
            ? weekDates.findIndex((d) => d.isSame(end, "day"))
            : weekDates.findIndex((d) => d.isSameOrBefore(end));

        let placed = false;
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          const collision = layer.some(
            (e) => !(e.end < startIndex || e.start > endIndex)
          );
          if (!collision) {
            layer.push({ ...event, start: startIndex, end: endIndex });
            placed = true;
            break;
          }
        }
        if (!placed) {
          layers.push([{ ...event, start: startIndex, end: endIndex }]);
        }
      });

      return layers;
    });
  }, [stableSchedules, currentMonth]);
  return (
    <div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <th
                key={d}
                style={{
                  textAlign: "center",
                  padding: "8px",
                  borderBottom: "1px solid #ddd",
                  color: i === 0 || i === 6 ? "#ef4444" : "#111", // ✅ 일/토 빨간색
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dateMatrix.map((weekDates, weekIdx) => (
            <tr key={`week-${weekIdx}`}>
              {weekDates.map((date, dayIdx) => {
                const dateStr = date.format("YYYY-MM-DD");
                const isToday = date.isSame(moment(), "day");
                const isCurrentMonth = date.month() === currentMonth.month();
                const dayEvents = eventsByDateMap[dateStr] || [];

                return (
                  <td
                    key={dateStr}
                    style={{
                      verticalAlign: "top",
                      padding: "6px",
                      border: "1px solid #eee",
                      height: "120px",
                      backgroundColor: isToday
                        ? "#fff"
                        : isCurrentMonth
                          ? "#fff"
                          : "#d1d5db", // ← 예시로 더 어둡게
                      color: isToday
                        ? "#ef4444"
                        : !isCurrentMonth
                          ? "#c0c0c0"
                          : dayIdx === 0 || dayIdx === 6 // ← 여기가 핵심 수정
                            ? "#dc2626"
                            : "#999",

                      fontWeight: isToday ? "bold" : "normal",
                      position: "relative",
                    }}
                  >
                    {/* 날짜 표시 */}
                    <div
                      style={{
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        margin: "0 auto",
                        marginBottom: "8px", // 👈 일정과 거리 확보
                        borderRadius: "50%",
                        backgroundColor: isToday ? "#3b82f6" : "transparent",
                        color: isToday ? "#fff" : undefined,
                        fontWeight: isToday ? "bold" : "normal",
                      }}
                    >
                      {date.date()}
                    </div>

                    {/* 일정들 수직으로 쌓기 */}
                    {dayEvents.slice(0, 3).map((e, i) => {
                      const color = getColorById(e.id);
                      return (
                        <div
                          key={i}
                          onClick={() =>
                            onSelectSchedule
                              ? onSelectSchedule(e)
                              : setSelectedSchedule(e)
                          }
                          style={{
                            background: color,
                            color: "white",
                            borderRadius: "4px",
                            padding: "2px 4px",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: 1,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = 0.85)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = 1)
                          }
                        >
                          {e.title}
                        </div>
                      );
                    })}

                    {/* +n more */}
                    {dayEvents.length > 3 && (
                      <div
                        onClick={() => handleMoreClick(dateStr, dayEvents)}
                        style={{
                          fontSize: "11px",
                          color: "#2563eb",
                          cursor: "pointer",
                        }}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDate && (
        <ScheduleListModal
          open={!!selectedDate}
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
        />
      )}

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
