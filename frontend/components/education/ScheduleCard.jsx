import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
const EMPTY_PX = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

// 전체 회차 범위 계산
function getScheduleRange(s) {
  if (Array.isArray(s.sessions) && s.sessions.length > 0) {
    const starts = s.sessions.map(x => new Date(x.start_date));
    const ends = s.sessions.map(x => new Date(x.end_date || x.start_date));
    return {
      start: new Date(Math.min(...starts)),
      end: new Date(Math.max(...ends)),
    };
  }
  const start = new Date(s.start_date);
  const end = new Date(s.end_date || s.start_date);
  return { start, end };
}

// 날짜 포맷 (요일 포함, 동일 연도일 때 뒤쪽 연도 생략)
function formatRangeWithWeekday(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameDay = start.toDateString() === end.toDateString();

  const fmtYMD = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const fmtMD = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
  const fmtW = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });

  const startYmd = fmtYMD.format(start);
  const startW = fmtW.format(start);
  const endW = fmtW.format(end);

  if (sameDay) return `${startYmd} (${startW})`;

  const startStr = `${startYmd} (${startW})`;
  const endStr = sameYear
    ? `${fmtMD.format(end)} (${endW})`
    : `${fmtYMD.format(end)} (${endW})`;

  return `${startStr} ~ ${endStr}`;
}

// 상태 계산
function getScheduleStatus(start, end, now = new Date()) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
  if (end < todayStart) return "ended";
  if (start > todayEnd) return "upcoming";
  return "ongoing";
}

export default function ScheduleCard({
  schedule,
  type,
  hideEndMessage = false,
  hideBadge = false,
  showDetailButton = false,
}) {
  const router = useRouter();
  const { start, end } = getScheduleRange(schedule);
  const status = getScheduleStatus(start, end);

  // 이미지 소스
  const imgSrc = schedule.image_url || schedule.product_image || EMPTY_PX;
  const hasImg = imgSrc !== EMPTY_PX;

  const badge = {
    ended: { text: "종료", bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
    ongoing: { text: "진행중", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
    upcoming: { text: "예정", bg: "#EEF5FF", color: "#1D4ED8", border: "#BFDBFE" },
  }[status];

  const handleClick = () => {
    const targetId = (schedule.schedule_id ?? schedule.id);
    const targetType = (schedule.type ?? type);
    router.push(`/education/${targetType}/${targetId}`);
  };
  

  return (
    <div
      onClick={!showDetailButton ? handleClick : undefined}
      style={{
        width: "100%",
        maxWidth: 360,
        border: "1px solid #ddd",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff", // ✅ 항상 흰색 배경 유지
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        cursor: showDetailButton ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 썸네일 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 3",
          background: hasImg ? "#fff" : "#f2f2f2",
        }}
      >
        <Image
  src={imgSrc}
  alt={schedule.title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
  placeholder={hasImg ? "blur" : undefined}
  blurDataURL={hasImg ? EMPTY_PX : undefined}
  style={{ objectFit: "contain" }}
  priority
  loading="eager"
/>

        {!hasImg && (
          <div
            style={{
              position: "absolute",
              inset: 0,
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
      </div>

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

          {/* ✅ 뱃지 or 상세버튼 */}
          {!hideBadge && !showDetailButton && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`,
                padding: "2px 6px",
                borderRadius: 999,
                marginLeft: 6,
                whiteSpace: "nowrap",
              }}
            >
              {badge.text}
            </span>
          )}

          {showDetailButton && (
            <button
              onClick={handleClick}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0070f3",
                border: "1px solid #0070f3",
                background: "#fff",
                padding: "2px 8px",
                borderRadius: 6,
                cursor: "pointer",
                marginLeft: 6,
              }}
            >
              상세
            </button>
          )}
        </div>

        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#666" }}>
          {formatRangeWithWeekday(start, end)}
        </p>

        {/* 종료 문구 */}
        {status === "ended" && !hideEndMessage && (
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
