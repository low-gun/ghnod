import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import SearchFilterBox from "@/components/common/SearchFilterBox";
import ScheduleSubTabs from "@/components/education/ScheduleSubTabs";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";
import { useQuery } from "@tanstack/react-query";

export default function CertificationPage() {
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const type = "certification";
  const isMobileOrTablet = useIsTabletOrBelow();

  const subTabs = useMemo(() => [
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ], []);

  // fetchSchedules useCallback
  const fetchSchedules = useCallback(async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=${type}&sort=${sort}&order=${order}`,
      { credentials: "include" }
    );
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

  // useMemo로 필터링 캐싱
  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return schedules.filter((s) => {
      const isPast = new Date(s.start_date) < today;
      if (!showPast && isPast) return false;

      if (searchType === "전체" || searchType === "교육명") {
        return s.title?.toLowerCase().includes(keyword);
      }
      if (searchType === "교육기간" && dateRange.startDate && dateRange.endDate) {
        const selectedStart = dateRange.startDate.toDate?.() || dateRange.startDate;
        const selectedEndRaw = dateRange.endDate.toDate?.() || dateRange.endDate;
        const selectedEnd = new Date(selectedEndRaw.getTime() + 86400000 - 1);
        const scheduleStart = new Date(s.start_date);
        return scheduleStart >= selectedStart && scheduleStart <= selectedEnd;
      }
      return true;
    });
  }, [schedules, searchType, searchKeyword, dateRange, showPast, today]);

  // 스타일 상수화
  const imgTitleBoxStyle = {
    position: "relative",
    textAlign: "left",
    marginBottom: 16,
  };
  const imgStyle = {
    width: "100%",
    maxWidth: 1200,
    height: "auto",
    borderRadius: 8,
    display: "block",
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
    <div style={{ padding: 32 }}>
      <ScheduleSubTabs tabs={subTabs} />

      {/* 이미지 + 타이틀 */}
      <div style={imgTitleBoxStyle}>
        <img
          src="/images/certification.webp"
          alt="certification 페이지에서는 자격/써티 관련 교육을 소개합니다."
          style={imgStyle}
        />
        <div style={imgTextStyle}>
          <h1 style={h1Style}>certification</h1>
          <p style={pStyle}>써티 안내</p>
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
  );
}
