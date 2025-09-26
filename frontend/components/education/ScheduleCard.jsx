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
  // ✅ 대표 일정: sessions 중 가장 가까운 미래 회차 선택
function getRepresentativeSession(sessions, today = new Date()) {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;
  const future = sessions.filter(sess => new Date(sess.start_date) >= today);
  if (future.length > 0) {
    return future.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
  }
  // 모두 지난 경우 → 가장 마지막 회차
  return sessions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
}

const today = new Date();
const representative = getRepresentativeSession(schedule.sessions, today);

const repStart = representative ? new Date(representative.start_date) : new Date(schedule.start_date);
const repEnd = representative ? new Date(representative.end_date || representative.start_date) : new Date(schedule.end_date || schedule.start_date);
const status = getScheduleStatus(repStart, repEnd);


  // 이미지 소스
  const imgSrc = schedule.image_url || schedule.product_image || EMPTY_PX;
  const hasImg = imgSrc !== EMPTY_PX;

  const badge = {
    ended: { text: "종료", bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
    ongoing: { text: "진행중", bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
    upcoming: { text: "예정", bg: "#EEF5FF", color: "#1D4ED8", border: "#BFDBFE" },
  }[status];

  const categorySlugMap = {
    "진단": "diagnosis",
    "조직개발": "orgdev",
    "리더십개발": "leadership",
    "공개과정": "opencourse",
    "공론화": "forum",
  };
  const slugCategory = categorySlugMap[schedule.category] || "opencourse";
  
  const handleClick = () => {
    const targetId = (schedule.schedule_id ?? schedule.id);
    const targetType = (schedule.type ?? type);
  
    const path = `/${slugCategory}/${targetType}/${targetId}`;
    console.group("[ScheduleCard.handleClick]");
    console.log("schedule.category:", schedule.category);
    console.log("slugCategory:", slugCategory);
    console.log("schedule.type:", schedule.type, "prop type:", type);
    console.log("targetId:", targetId);
    console.log("→ push path:", path);
    console.groupEnd();
  
    router.push(path);
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
  {formatRangeWithWeekday(repStart, repEnd)}
  {Array.isArray(schedule.sessions) && schedule.sessions.length > 1 && (
    <span
      style={{ marginLeft: 6, cursor: "pointer", color: "#555", fontWeight: "bold" }}
      title={schedule.sessions
        .map(sess => formatRangeWithWeekday(sess.start_date, sess.end_date || sess.start_date))
        .join("\n")}
    >
      ❕
    </span>
  )}
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

        {/* ✅ 태그 표시 */}
        {Array.isArray(schedule.tags) && schedule.tags.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {schedule.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "#f3f4f6",
                  color: "#374151",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

