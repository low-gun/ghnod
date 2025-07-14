import { useState } from "react";
import { useRouter } from "next/router";
import SearchFilterBox from "@/components/common/SearchFilterBox";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import ScheduleSubTabs from "@/components/education/ScheduleSubTabs";
import MobileSearchFilterBox from "@/components/education/MobileSearchFilterBox";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";
import { useQuery } from "@tanstack/react-query";

export default function FacilitationPage() {
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const [searchType, setSearchType] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const router = useRouter();
  const type = "facilitation";
  const isMobileOrTablet = useIsTabletOrBelow();

  const subTabs = [
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ];

  // react-query fetchSchedules
  const fetchSchedules = async ({ queryKey }) => {
    const [_key, type, sort, order] = queryKey;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=${type}&sort=${sort}&order=${order}`,
      { credentials: "include" }
    );
    return res.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", type, sort, order],
    queryFn: fetchSchedules,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const schedules = data?.schedules || [];
  const today = new Date();

  const filteredSchedules = schedules.filter((s) => {
    const isPast = new Date(s.start_date) < today;
    if (!showPast && isPast) return false;

    const keyword = searchKeyword.trim().toLowerCase();

    if (searchType === "전체" || searchType === "교육명") {
      return s.title?.toLowerCase().includes(keyword);
    }

    if (searchType === "교육기간" && dateRange.startDate && dateRange.endDate) {
      const selectedStart =
        dateRange.startDate.toDate?.() || dateRange.startDate;
      const selectedEndRaw = dateRange.endDate.toDate?.() || dateRange.endDate;
      const selectedEnd = new Date(selectedEndRaw.getTime() + 86400000 - 1);

      const scheduleStart = new Date(s.start_date);
      return scheduleStart >= selectedStart && scheduleStart <= selectedEnd;
    }

    return true;
  });

  return (
    <div style={{ padding: 32 }}>
      <ScheduleSubTabs tabs={subTabs} />

      <div
        style={{
          position: "relative",
          textAlign: "left",
          marginBottom: 16,
        }}
      >
        <img
          src="/images/facilitation.webp"
          alt="facilitation 페이지에서는 퍼실리테이션 기법과 활용 사례 등을 다룹니다."
          style={{
            width: "100%",
            maxWidth: 1200,
            height: "auto",
            borderRadius: 8,
            display: "block",
            margin: "0 auto",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "clamp(12px, 3vw, 24px)",
            left: "clamp(16px, 4vw, 32px)",
            color: "#222",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(18px, 4vw, 24px)",
              fontWeight: "bold",
            }}
          >
            facilitation
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(12px, 2.8vw, 14px)",
              color: "#555",
            }}
          >
            퍼실리테이션 기법 및 활용
          </p>
        </div>
      </div>

      {isMobileOrTablet ? (
        <MobileSearchFilterBox
          searchType={searchType}
          setSearchType={setSearchType}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          sort={sort}
          setSort={setSort}
          order={order}
          setOrder={setOrder}
          showPast={showPast}
          setShowPast={setShowPast}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      ) : (
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
