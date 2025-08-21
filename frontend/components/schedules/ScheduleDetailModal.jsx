import React, { useEffect } from "react";
import moment from "moment";

export default function ScheduleDetailModal({
  schedule,
  onClose,
  onEdit,
  onDelete,
  mode = "user",
}) {
  if (!schedule) return null;

  console.log("📌 ScheduleDetailModal schedule:", schedule);
  console.log("📌 schedule.type:", schedule?.type);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const formatDateTime = (d) => moment(d).format("YYYY.MM.DD A h:mm");
  const formatPrice = (price) =>
    typeof price === "number" ? price.toLocaleString() + "원" : "-";

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
          {mode === "admin" && (
  <InfoRow label="상품명" value={schedule.product_title || schedule.productTitle || "-"} />
)}

          <InfoRow label="장소" value={schedule.location || "-"} />
          <InfoRow label="강사" value={schedule.instructor || "-"} />
          <InfoRow label="정원" value={schedule.total_spots ?? "-"} />
          <InfoRow
  label="기간"
  value={(() => {
    const start = schedule.start ? moment(schedule.start) : null;
    // dayGrid end는 배타 → 1일 보정
    const rawEnd = schedule.end ? moment(schedule.end).clone().subtract(1, "day") : null;

    // 회차 시간이 내려온 경우(선택 회차) 시간까지 표시
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

          {mode === "admin" && (
            <InfoRow label="가격" value={formatPrice(schedule.price)} />
          )}
          <InfoRow label="설명" value={schedule.description || "-"} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          {mode === "admin" && onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: "6px 12px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              삭제
            </button>
          )}
          {mode === "admin" && onEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: "6px 12px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              수정
            </button>
          )}
          {mode === "user" && (
            <button
            onClick={() => {
              const sid = schedule.schedule_id || schedule.id; // ✅ 일정 id 우선
              if (schedule?.type) {
                window.open(`/education/${schedule.type}/${sid}`, "_blank");
              } else {
                window.open(`/education/calendar/${sid}`, "_blank");
              }
            }}
            
              style={{
                padding: "6px 12px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              상세 보기
            </button>
          )}
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
