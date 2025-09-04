import React, { useEffect } from "react";
import dayjs from "dayjs";

export default function UserScheduleDetailModal({ schedule, onClose }) {
  if (!schedule) return null;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const formatDateTime = (d) => dayjs(d).format("YYYY.MM.DD A h:mm");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "32px",
          width: "460px",
          maxWidth: "90%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#999",
          }}
        >
          ✕
        </button>

        <h2
          style={{
            marginBottom: "20px",
            fontSize: "22px",
            fontWeight: "bold",
            color: "#111",
            textAlign: "center",
          }}
        >
          {schedule.title}
        </h2>

        <div
          style={{
            fontSize: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <InfoRow label="장소" value={schedule.location || "-"} />
          <InfoRow label="강사" value={schedule.instructor || "-"} />
          {/* 회차별 모집 현황 */}
{Array.isArray(schedule.sessions) && schedule.sessions.length > 0 ? (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    {schedule.sessions.map((s, idx) => (
      <InfoRow
        key={s.id || idx}
        label={`(${idx + 1}회차)`}
        value={`잔여 ${s.remaining_spots ?? "-"}명 / 정원 ${s.total_spots ?? "-"}`}
      />
    ))}
  </div>
) : (
  <InfoRow label="정원" value={schedule.total_spots ?? "-"} />
)}

{/* 기간 */}
<InfoRow
  label="기간"
  value={(() => {
    const start = schedule.start ? dayjs(schedule.start) : null;
    const rawEnd = schedule.end ? dayjs(schedule.end).subtract(1, "day") : null;

    const st = schedule.start_time ? ` ${schedule.start_time?.slice(0,5)}` : "";
    const et = schedule.end_time ? ` ${schedule.end_time?.slice(0,5)}` : "";

    if (start && rawEnd) {
      const a = start.format("YYYY.MM.DD") + st;
      const b = rawEnd.format("YYYY.MM.DD") + et;
      return `${a} ~ ${b}`;
    }
    return "-";
  })()}
/>

          <InfoRow label="설명" value={schedule.description || "-"} />
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            onClick={() =>
              window.open(`/education/calendar/${schedule.id}`, "_blank")
            }
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div style={{ display: "flex" }}>
    <div style={{ width: "80px", fontWeight: "bold", color: "#555" }}>
      {label}
    </div>
    <div style={{ flex: 1, color: "#333" }}>{value}</div>
  </div>
);
