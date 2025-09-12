import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/legacy/image";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import Head from "next/head";

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

  const subTabs = useMemo(
    () => [
      { label: "followup", href: "/education/followup" },
      { label: "certification", href: "/education/certification" },
      { label: "공개교육", href: "/education/opencourse" },
      { label: "facilitation", href: "/education/facilitation" },
    ],
    []
  );

  const fetchSchedules = useCallback(async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=${encodeURIComponent(
      type
    )}&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`;

    const res = await fetch(url, { credentials: "include" });

    if (res.status === 404) {
      return { schedules: [] };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `fetchSchedules failed: ${res.status} ${res.statusText} ${text}`
      );
    }
    return res.json();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", type, sort, order],
    queryFn: fetchSchedules,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const schedules = data?.schedules || [];
  const today = useMemo(() => new Date(), []);

  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return schedules.filter((s) => {
      const isPast = new Date(s.start_date) < today;
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
        const scheduleStart = new Date(s.start_date);
        return scheduleStart >= selectedStart && scheduleStart <= selectedEnd;
      }
      return true;
    });
  }, [schedules, searchType, searchKeyword, dateRange, showPast, today]);
  
  const imgTitleBoxStyle = {
    position: "relative",
    textAlign: "left",
    marginBottom: 16,
  };
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
    <>
      <Head>
        <title>팔로우업 교육 | ORP컨설팅</title>
        <meta
          name="description"
          content="ORP컨설팅의 Follow-up 교육 과정 - 기존 교육 이후 성과 점검과 역량 보강을 위한 팔로우업 프로그램."
        />
        <meta property="og:title" content="팔로우업 교육 | ORP컨설팅" />
        <meta
          property="og:description"
          content="ORP컨설팅의 Follow-up 교육 프로그램 - 교육 성과를 강화하고 지속적인 성장을 지원합니다."
        />
        <meta property="og:image" content="/images/followup.webp" />
        <meta property="og:url" content="https://orpconsulting.co.kr/education/followup" />
      </Head>

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
          <ScheduleCardGrid schedules={filteredSchedules} type={type} />
        )}
      </div>
    </>
  );
}
