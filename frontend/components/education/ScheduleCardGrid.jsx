import React from "react";
import ScheduleCard from "./ScheduleCard";
import ResponsiveGrid from "@/components/common/ResponsiveGrid";

export default function ScheduleCardGrid({
  schedules,
  type,
  hideEndMessage = false,
  hideBadge = false,
  showDetailButton = false,
}) {
  if (!schedules || schedules.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "40px 0" }}>
        등록된 일정이 없습니다.
      </p>
    );
  }

  return (
    <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap={24} centerItems>
      {schedules.map((s) => (
        <ScheduleCard
          key={s.id}
          schedule={s}
          type={type}
          hideEndMessage={hideEndMessage}
          hideBadge={hideBadge}
          showDetailButton={showDetailButton}
        />
      ))}
    </ResponsiveGrid>
  );
}

