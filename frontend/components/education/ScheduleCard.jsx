import React from "react";
import { useRouter } from "next/router";

export default function ScheduleCard({ schedule, type }) {
  const router = useRouter();
  const isPast = new Date(schedule.start_date) < new Date();

  const handleClick = () => {
    router.push(`/education/${type}/${schedule.id}`);
  };

  const formatScheduleDate = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const format = (d) =>
      `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    return startDate.toDateString() === endDate.toDateString()
      ? format(startDate)
      : `${format(startDate)} ~ ${format(endDate)}`;
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100%",
        maxWidth: 360,
        border: "1px solid #ddd",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        filter: isPast ? "grayscale(0.1) brightness(0.8)" : "none",
      }}
    >
      {/* 썸네일 */}
      {schedule.image_url || schedule.product_image ? (
        <img
          src={schedule.image_url || schedule.product_image}
          alt={schedule.title}
          style={{ width: "100%", height: 200, objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 200,
            background: "#f2f2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: 13,
          }}
        >
          썸네일 없음
        </div>
      )}

      {/* 본문 */}
      <div style={{ padding: 12, flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.2,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {schedule.title}
          </h4>
          {isPast && (
            <span
              style={{
                fontSize: 11,
                fontWeight: "bold",
                backgroundColor: "#f3dcdc",
                color: "#d9534f",
                padding: "2px 6px",
                borderRadius: 4,
                marginLeft: 6,
                whiteSpace: "nowrap",
              }}
            >
              지난 일정
            </span>
          )}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#666" }}>
          {formatScheduleDate(schedule.start_date, schedule.end_date)}
        </p>
        {isPast && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#d9534f",
              fontWeight: "bold",
            }}
          >
            종료된 일정입니다.
          </p>
        )}
      </div>
    </div>
  );
}
