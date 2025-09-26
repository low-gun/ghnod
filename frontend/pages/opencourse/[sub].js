import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/legacy/image";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import Head from "next/head";
import ResponsiveSubTabs from "@/components/common/ResponsiveSubTabs";

const SearchFilterBox = dynamic(
  () => import("@/components/common/SearchFilterBox"),
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

const tabs = [
  { label: "Hogan", slug: "hogan" },
  { label: "Assessment", slug: "assessment" },
  { label: "Development", slug: "development" },
  { label: "Facilitation", slug: "facilitation" },
  { label: "진단 Certification", slug: "certification" },
  { label: "FT", slug: "ft" },
];

export default function OpenCoursePage() {
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const router = useRouter();
  const { sub } = router.query;
  const isMobileOrTablet = useIsTabletOrBelow();

  const fetchSchedules = useCallback(async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?category=공개과정&type=${encodeURIComponent(
        type
      )}&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`;    
  
    console.log("🔍 [fetchSchedules] 요청 URL:", url); // ✅ 어떤 URL 호출하는지
  
    const res = await fetch(url, { credentials: "include" });
  
    if (res.status === 404) {
      console.warn("⚠️ [fetchSchedules] 404: 일정 없음");
      return { schedules: [] };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `fetchSchedules failed: ${res.status} ${res.statusText} ${text}`
      );
    }
  
    const data = await res.json();
    console.log("📦 [fetchSchedules] API 응답:", data); // ✅ 실제 응답 구조 확인
    return data;
  }, []);
  

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", sub, sort, order],
    queryFn: fetchSchedules,
    enabled: !!sub,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const schedules = data?.schedules || [];
  const today = useMemo(() => new Date(), []);

  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return schedules.filter((s) => {
      // 세션이 없을 경우도 대비
      const sessions = Array.isArray(s.sessions) ? s.sessions : [];
  
      const futureSessions = sessions.filter(
        (sess) => new Date(sess.start_date) >= today
      );
  
      // 세션이 있으면 세션 기준, 없으면 스케줄 기본 날짜 기준
      const representative = futureSessions.length
        ? futureSessions.sort(
            (a, b) => new Date(a.start_date) - new Date(b.start_date)
          )[0]
        : null;
  
      const effectiveStart = representative
        ? new Date(representative.start_date)
        : new Date(s.start_date);
  
      const effectiveEnd = representative
        ? new Date(representative.end_date || representative.start_date)
        : new Date(s.end_date || s.start_date);
  
      const isPast = effectiveEnd < today;
      if (!showPast && isPast) return false;
  
      if (searchType === "전체" || searchType === "교육명") {
        return s.title?.toLowerCase().includes(keyword);
      }
      if (
        searchType === "교육기간" &&
        dateRange.startDate &&
        dateRange.endDate
      ) {
        const selectedStart =
          dateRange.startDate.toDate?.() || dateRange.startDate;
        const selectedEndRaw =
          dateRange.endDate.toDate?.() || dateRange.endDate;
        const selectedEnd = new Date(selectedEndRaw.getTime() + 86400000 - 1);
        return effectiveStart >= selectedStart && effectiveStart <= selectedEnd;
      }
      return true;
    });
  }, [schedules, searchType, searchKeyword, dateRange, showPast, today]);
  
  const heroImgBoxStyle = {
    position: "relative",
    width: "100%",
    maxWidth: 1200,
    height: "clamp(220px, 28vw, 360px)",
    borderRadius: 8,
    overflow: "hidden",
    margin: "0 auto",
  };

  const imgTextStyle = {
    position: "absolute",
    top: "clamp(12px, 3vw, 24px)",
    left: "clamp(16px, 4vw, 32px)",
    color: "#222",
  };

  return (
    <>
      <Head>
        <title>공개과정 | ORP컨설팅</title>
        <meta name="description" content="ORP컨설팅 공개과정 일정" />
        <meta property="og:title" content="공개과정 | ORP컨설팅" />
        <meta property="og:description" content="ORP컨설팅 공개과정 일정" />
        <meta property="og:image" content="/images/followup.webp" />
        <meta
          property="og:url"
          content={`https://orpconsulting.co.kr/opencourse/${sub}`}
        />
      </Head>

      <div
        style={{
          paddingTop: "32px",
          paddingLeft: isMobileOrTablet ? 0 : 32,
          paddingRight: isMobileOrTablet ? 0 : 32,
          paddingBottom: isMobileOrTablet ? 0 : 32,
        }}
      >
        <ResponsiveSubTabs tabs={tabs} basePath="/opencourse" />

        {/* hero 이미지 + 타이틀 */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <div style={heroImgBoxStyle}>
            <Image
              src="/images/followup.webp"
              alt="공개과정 페이지 배너 이미지"
              layout="fill"
              objectFit="cover"
              priority
            />
          </div>
          <div style={imgTextStyle}>
            <h1 style={{ margin: 0, fontSize: "clamp(18px, 4vw, 24px)", fontWeight: "bold" }}>
              {sub}
            </h1>
            <p style={{ margin: 0, fontSize: "clamp(12px, 2.8vw, 14px)", color: "#555" }}>
              공개과정
            </p>
          </div>
        </div>

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

        {isLoading ? (
          <p style={{ textAlign: "center", padding: "40px 0" }}>불러오는 중...</p>
        ) : filteredSchedules.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px 0" }}>
            등록된 일정이 없습니다.
          </p>
        ) : (
          <ScheduleCardGrid schedules={filteredSchedules} type={sub} />
        )}
      </div>
    </>
  );
}
