import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SearchFilterBox from "@/components/common/SearchFilterBox"; // ✅ 추가
import ScheduleSubTabs from "@/components/education/ScheduleSubTabs";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import MobileSearchFilterBox from "@/components/education/MobileSearchFilterBox";
export default function OpenCoursePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const type = "opencourse";
  const isMobileOrTablet = useIsTabletOrBelow(); // ✅ 이 줄 추가

  const subTabs = [
    { label: "followup", href: "/education/followup" },
    { label: "certification", href: "/education/certification" },
    { label: "공개교육", href: "/education/opencourse" },
    { label: "facilitation", href: "/education/facilitation" },
  ];

  function formatScheduleDate(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const format = (d) =>
      `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    return startDate.toDateString() === endDate.toDateString()
      ? format(startDate)
      : `${format(startDate)} ~ ${format(endDate)}`;
  }

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules/public?type=${type}&sort=${sort}&order=${order}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSchedules(data.schedules);
        }
      })
      .catch(() => alert("일정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [type, sort, order]);

  const today = new Date();

  const filteredSchedules = schedules.filter((s) => {
    const isPast = new Date(s.start_date) < today;
    const keyword = searchKeyword.trim().toLowerCase();

    if (!showPast && isPast) return false;

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
      {/* 상단 탭 */}
      <ScheduleSubTabs tabs={subTabs} />

      {/* 이미지 + 타이틀 */}
      <div
        style={{ position: "relative", textAlign: "left", marginBottom: 16 }}
      >
        <img
          src="/images/opencourse.png"
          alt="opencourse 페이지에서는 누구나 참여할 수 있는 공개교육 프로그램을 소개합니다."
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
            top: "clamp(12px, 3vw, 24px)", // ✅ 반응형 위치
            left: "clamp(16px, 4vw, 32px)",
            color: "#222",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(18px, 4vw, 24px)", // ✅ 반응형 폰트
              fontWeight: "bold",
            }}
          >
            opencourse
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(12px, 2.8vw, 14px)", // ✅ 반응형 폰트
              color: "#555",
            }}
          >
            공개교육 안내
          </p>
        </div>
      </div>

      {/* ✅ SearchFilterBox 적용 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
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
      </div>

      {/* 일정 카드 리스트 */}
      {loading ? (
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
