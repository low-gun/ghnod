import React, { useEffect } from "react";
import dayjs from "dayjs";

export default function ScheduleListModal({ open, onClose, date, events }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "8px",
          width: "360px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        {/* 우측 상단 X 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 28,
            fontWeight: "bold",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <h3
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}
        >
{dayjs(date).format("YYYY년 M월 D일")} 일정
</h3>

        <ul
          style={{
            maxHeight: "240px",
            overflowY: "auto",
            marginBottom: "16px",
          }}
        >
          {events.map((e, idx) => (
            <li
              key={idx}
              onClick={() => {
                if (e?.type) {
                  window.open(`/education/${e.type}/${e.id}`, "_blank");
                } else {
                  window.open(`/education/calendar/${e.id}`, "_blank");
                }
              }}
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                cursor: "pointer",
                color: "#2563eb", // 파란 글씨 (강조용)
              }}
            >
              • {e.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
