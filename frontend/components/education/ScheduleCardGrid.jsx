import React from "react";
import ScheduleCard from "./ScheduleCard";

export default function ScheduleCardGrid({ schedules, type }) {
  if (!schedules || schedules.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "40px 0" }}>
        등록된 일정이 없습니다.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
        justifyItems: "center",
      }}
    >
      {schedules.map((s) => (
        <ScheduleCard key={s.id} schedule={s} type={type} />
      ))}
    </div>
  );
}
