import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SearchFilterBox from "@/components/common/SearchFilterBox"; // ✅ 추가

export default function FollowupPage() {
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
  const type = "followup";

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
        if (data.success) setSchedules(data.schedules);
      })
      .catch(() => alert("일정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [type, sort, order]);

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
      {/* 상단 탭 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24 }}>
          {subTabs.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              style={{
                fontWeight: router.pathname === tab.href ? "bold" : "normal",
                borderBottom:
                  router.pathname === tab.href ? "2px solid #333" : "none",
                paddingBottom: 4,
                fontSize: 14,
                color: "#333",
                textDecoration: "none",
              }}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* 이미지 + 타이틀 */}
      <div
        style={{ position: "relative", textAlign: "left", marginBottom: 16 }}
      >
        <img
          src="/images/followup.png"
          alt="Followup is crucial to ensure that training outcomes are carried into real-world practice and lead to lasting improvements."
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
            top: 24,
            left: 32,
            color: "#222",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>
            followup
          </h1>
        </div>
      </div>

      {/* ✅ SearchFilterBox 적용 */}
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

      {/* 일정 카드 리스트 */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0" }}>불러오는 중...</p>
      ) : filteredSchedules.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px 0" }}>
          등록된 일정이 없습니다.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            justifyItems: "start",
          }}
        >
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              onClick={() => router.push(`/education/${type}/${schedule.id}`)}
              style={{
                width: 260,
                border: "1px solid #ddd",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                cursor: "pointer",
                filter:
                  new Date(schedule.start_date) < today
                    ? "grayscale(0.1) brightness(0.8)"
                    : "none",
              }}
            >
              {schedule.image_url ? (
                <img
                  src={schedule.image_url}
                  alt={schedule.title}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "contain",
                  }}
                />
              ) : schedule.product_image ? (
                <img
                  src={schedule.product_image}
                  alt={schedule.title}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 140,
                    background: "#f2f2f2",
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

              <div style={{ padding: 12 }}>
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
                  {new Date(schedule.start_date) < today && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        backgroundColor: "#f3dcdc",
                        color: "#d9534f",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginLeft: 6,
                        whiteSpace: "nowrap",
                      }}
                    >
                      지난 일정
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "#666",
                  }}
                >
                  {formatScheduleDate(schedule.start_date, schedule.end_date)}
                </p>

                {new Date(schedule.start_date) < today && (
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
          ))}
        </div>
      )}
    </div>
  );
}
