import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Image from "next/legacy/image";
import { useQuery } from "@tanstack/react-query";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

const SearchFilterBox = dynamic(
  () => import("@/components/common/SearchFilterBox"),
  { ssr: false, loading: () => null }
);

const ScheduleSubTabs = dynamic(
  () => import("@/components/education/ScheduleSubTabs"),
  { ssr: false, loading: () => null }
);

const ScheduleCardGrid = dynamic(
  () => import("@/components/education/ScheduleCardGrid"),
  {
    ssr: false,
    loading: () => (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        카드 불러오는 중…
      </div>
    ),
  }
);

export default function FollowupPage() {
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const router = useRouter();
  const type = "followup";
  const isMobileOrTablet = useIsTabletOrBelow();

  // ✅ DEBUG 플래그 & 안전 Date 파서
  const DEBUG = true;
  const toDate = (v) => {
    const d = v?.toDate ? v.toDate() : v;
    const parsed = d instanceof Date ? d : (d ? new Date(d) : null);
    return parsed && !isNaN(parsed.getTime()) ? parsed : null;
  };

  const subTabs = useMemo(() => [
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ], []);

  // fetchSchedules useCallback
  const fetchSchedules = useCallback(async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const url =
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public` +
  `?sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`;
  
    const res = await fetch(url, { credentials: "include" });
  
    // ✅ 1) 상태/URL 로깅
    console.log("[fetchSchedules] status:", res.status, res.statusText, "url:", url);
  
    if (res.status === 404) {
      console.warn("[fetchSchedules] 404 Not Found - 경로/쿼리 확인 필요");
      return { schedules: [] };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`fetchSchedules failed: ${res.status} ${res.statusText} ${text}`);
    }
  
    const json = await res.json().catch((e) => {
      console.error("[fetchSchedules] JSON parse error:", e);
      return null;
    });
  
    // ✅ 2) 응답 구조/키/길이 로깅
    if (json && typeof json === "object") {
      const keys = Object.keys(json);
      const len =
        Array.isArray(json.schedules) ? json.schedules.length :
        Array.isArray(json.data) ? json.data.length :
        Array.isArray(json.rows) ? json.rows.length : "N/A";
      console.log("[fetchSchedules] keys:", keys, "lengthGuess:", len);
    } else {
      console.warn("[fetchSchedules] empty or invalid JSON:", json);
    }
  
    return json;
  }, []);
  

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", type, sort, order],
    queryFn: fetchSchedules,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });
  
  // ✅ 디버그: 서버 응답/타입 분포/필터 단계별 개수
  
  const schedules = data?.schedules || [];
const today = useMemo(() => new Date(), []);
// ✅ 오늘 00:00 기준일
const startOfToday = useMemo(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}, []);


  // ✅ 서버 응답 스냅샷
  useEffect(() => {
    if (!DEBUG) return;
    console.log("[followup] raw schedules length:", schedules.length);
    if (schedules.length) {
      console.table(
        schedules.slice(0, 10).map((s) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          start: s.start_date,
          end: s.end_date,
          active: s.active,
        }))
      );
    }
  }, [DEBUG, schedules]);

// ✅ 서버에서 받은 type 분포 확인
const typeCounts = useMemo(() => {
  const map = {};
  schedules.forEach((s) => {
    const t = (s?.type ?? "").toString();
    map[t] = (map[t] || 0) + 1;
  });
  return map;
}, [schedules]);

useEffect(() => {
  console.log("[followup] typeCounts:", typeCounts);
}, [typeCounts]);


  // 필터링 useMemo로 캐싱
  const filteredStats = useMemo(() => {
    const norm = (v) => (v ?? "").toString().trim().toLowerCase();
    const keyword = searchKeyword.trim().toLowerCase();

    // 1) 타입 필터
    const byType = schedules.filter((s) => norm(s.type) === norm(type));

    // 2) 과거 여부 (start_date 기준)
    // 2) 과거 여부 (end_date 우선, 없으면 start_date) 기준
const afterPast = byType.filter((s) => {
  const start = toDate(s.start_date);
  const end = toDate(s.end_date);
  // end가 정상이고 start보다 빠르지 않으면 end를 비교 기준으로 사용, 아니면 start 사용
  const compareBase = end && (!start || end >= start) ? end : start;
  const isPast = compareBase ? compareBase < startOfToday : false;
  return showPast ? true : !isPast;
});


    // 3) 키워드
    const afterKeyword =
      searchType === "교육명" || searchType === "전체"
        ? afterPast.filter((s) => (s.title ?? "").toLowerCase().includes(keyword))
        : afterPast;

    // 4) 기간
    let afterDate = afterKeyword;
    if (searchType === "교육기간" && dateRange.startDate && dateRange.endDate) {
      const selectedStart = toDate(dateRange.startDate);
      const selectedEndSrc = toDate(dateRange.endDate);
      const selectedEnd = selectedEndSrc ? new Date(selectedEndSrc.getTime() + 86400000 - 1) : null;
      if (selectedStart && selectedEnd) {
        afterDate = afterKeyword.filter((s) => {
          const scheduleStart = toDate(s.start_date);
          return scheduleStart && scheduleStart >= selectedStart && scheduleStart <= selectedEnd;
        });
      }
    }

    return {
      total: schedules.length,
      byType: byType.length,
      afterPast: afterPast.length,
      afterKeyword: afterKeyword.length,
      afterDate: afterDate.length,
      result: afterDate,
    };
  }, [schedules, type, searchType, searchKeyword, dateRange, showPast, today]);

  const filteredSchedules = filteredStats.result;

  // ✅ 필터 파라미터/단계별 개수 로깅
  useEffect(() => {
    if (!DEBUG) return;
    console.log("[followup] params:", {
      type,
      showPast,
      searchType,
      searchKeyword,
      dateRange: {
        start: dateRange.startDate ? toDate(dateRange.startDate)?.toISOString() : null,
        end: dateRange.endDate ? toDate(dateRange.endDate)?.toISOString() : null,
      },
      today: today.toISOString(),
    });
    console.log("[followup] filterStats:", {
      total: filteredStats.total,
      byType: filteredStats.byType,
      afterPast: filteredStats.afterPast,
      afterKeyword: filteredStats.afterKeyword,
      afterDate: filteredStats.afterDate,
    });

    // 추가: 과거로 판정된 항목 샘플
    if (schedules.length) {
      const norm = (v) => (v ?? "").toString().trim().toLowerCase();
      const byTypeSample = schedules.filter((s) => norm(s.type) === norm(type));
      const pastSample = byTypeSample.filter((s) => {
        const start = toDate(s.start_date);
        return start ? start < today : false;
      });
      if (pastSample.length) {
        console.table(
          pastSample.slice(0, 10).map((s) => ({
            id: s.id,
            title: s.title,
            start: s.start_date,
            end: s.end_date,
          }))
        );
      }
    }
  }, [DEBUG, filteredStats, type, showPast, searchType, searchKeyword, dateRange, today, schedules]);
  // 스타일 상수화
  const imgTitleBoxStyle = {
    position: "relative",
    textAlign: "left",
    marginBottom: 16,
    width: "100%",
    maxWidth: "100%",
    margin: 0,
  };
  const heroImgBoxStyle = {
    position: "relative",
    width: "100%",
    height: "clamp(220px, 28vw, 360px)",
    borderRadius: 8,
    overflow: "hidden",
  };
  
  const imgTextStyle = {
    position: "absolute",
    top: "clamp(12px, 3vw, 24px)",
    left: "clamp(16px, 4vw, 32px)",
    color: "#222",
  };
  const h1Style = {
    margin: 0,
    fontSize: "clamp(18px, 4vw, 24px)",
    fontWeight: "bold",
  };
  const pStyle = {
    margin: 0,
    fontSize: "clamp(12px, 2.8vw, 14px)",
    color: "#555",
  };

  return (
<div
  style={{
    paddingTop: isMobileOrTablet ? "32px" : "32px",
    paddingLeft: isMobileOrTablet ? 0 : 32,
    paddingRight: isMobileOrTablet ? 0 : 32,
    paddingBottom: isMobileOrTablet ? 0 : 32,
  }}
>
      <ScheduleSubTabs tabs={subTabs} />

      {/* 이미지 + 타이틀 */}
      
<div style={imgTitleBoxStyle}>
<div style={heroImgBoxStyle}>
  <Image
    src="/images/followup.webp"
    alt="followup 페이지에서는 팔로우업 교육 프로그램을 소개합니다."
    layout="fill"
    objectFit="cover"
    priority
  />
</div>
  <div style={imgTextStyle}>
    <h1 style={h1Style}>followup</h1>
    <p style={pStyle}>팔로우업</p>
  </div>
</div>

      {/* SearchFilterBox */}
      {!isMobileOrTablet && (
  <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
    <SearchFilterBox
      searchType={searchType}
      setSearchType={setSearchType}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
      dateRange={dateRange}
      setDateRange={setDateRange}
      sort={sort}
      setSort={setSort}
      order={order}
      setOrder={setOrder}
      showPast={showPast}
      setShowPast={setShowPast}
    />
  </div>
)}


      {/* 일정 카드 리스트 */}
{isLoading ? (
  <p>불러오는 중...</p>
) : !data ? (
  null
) : Array.isArray(data.schedules) && data.schedules.length === 0 ? (
  <p>등록된 일정이 없습니다.(서버 0건)</p>
) : (
  <ScheduleCardGrid schedules={filteredSchedules} type={type} />
)}


    </div>
  );
}
