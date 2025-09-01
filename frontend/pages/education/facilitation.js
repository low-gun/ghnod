import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import SearchFilterBox from "@/components/common/SearchFilterBox";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import ScheduleSubTabs from "@/components/education/ScheduleSubTabs";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";
import { useQuery } from "@tanstack/react-query";

export default function FacilitationPage() {
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const router = useRouter();
  const type = "facilitation";
  const isMobileOrTablet = useIsTabletOrBelow();

  const subTabs = useMemo(() => [
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ], []);

  // fetchSchedules useCallback
  // (수정 후)
  const fetchSchedules = useCallback(async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=${encodeURIComponent(type)}&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`;
    const res = await fetch(url, { credentials: "include" });
  
    if (res.status === 404) {
      // 컨트롤러가 “결과 없음”을 404로 반환하는 현재 정책 대응
      return { schedules: [] };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`fetchSchedules failed: ${res.status} ${res.statusText} ${text}`);
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

  // useMemo로 필터 캐싱
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
    height: "clamp(220px, 28vw, 360px)",  // ✅ 뷰포트에 따라 높이 커짐(모바일~데스크톱)
    objectFit: "cover",                    // ✅ 비율 유지 + 영역 꽉 채움(필요 시 크롭)
    objectPosition: "center",
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
  console.log("filteredSchedules 기본값:", filteredSchedules);

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
        <img
          src="/images/facilitation.webp"
          alt="facilitation 페이지에서는 퍼실리테이션 기법과 활용 사례 등을 다룹니다."
          style={imgStyle}
        />
        <div style={imgTextStyle}>
          <h1 style={h1Style}>facilitation</h1>
          <p style={pStyle}>퍼실리테이션 기법 및 활용</p>
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
