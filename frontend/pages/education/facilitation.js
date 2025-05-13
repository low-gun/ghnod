import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import TextContent from "../../components/layout/contents/TextContent";

export default function FacilitationPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false); // ✅ 지난 일정 포함 여부
  const router = useRouter();
  const type = "facilitation";

  const paragraphs = [
    "facilitation 페이지에서는 퍼실리테이션 기법과 활용 사례 등을 다룹니다.",
    "조직 내 회의, 워크숍, 토론 등을 원활히 이끌기 위해 필요한 기술과 노하우를 소개합니다.",
  ];

  const subTabs = [
    { label: "calendar", href: "/education/calendar" },
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/schedules/public?type=${type}&sort=${sort}&order=${order}`,
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
    return showPast ? true : !isPast;
  });

  return (
    <div style={{ padding: 32 }}>
      <TextContent
        title="facilitation"
        subtitle="퍼실리테이션 기법 및 활용"
        paragraphs={paragraphs}
        imageSrc="/images/facilitation.jpg"
        tabs={subTabs}
      />

      <div style={{ marginTop: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* 정렬 + 지난 일정 토글 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 20, margin: 0 }}>
              진행 중인 퍼실리테이션 일정
            </h3>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, color: "#333" }}>
                <input
                  type="checkbox"
                  checked={showPast}
                  onChange={() => setShowPast(!showPast)}
                  style={{ marginRight: 6 }}
                />
                지난 일정 포함
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: ".375rem .625rem",
                  borderRadius: 6,
                  border: ".0625rem solid #ccc",
                  fontSize: 14,
                }}
              >
                <option value="start_date">최신순</option>
                <option value="created_at">등록일순</option>
              </select>

              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                style={{
                  padding: ".375rem .625rem",
                  borderRadius: 6,
                  border: ".0625rem solid #ccc",
                  fontSize: 14,
                }}
              >
                <option value="asc">오름차순</option>
                <option value="desc">내림차순</option>
              </select>
            </div>
          </div>

          {/* 일정 카드 리스트 */}
          {loading ? (
            <p>불러오는 중...</p>
          ) : filteredSchedules.length === 0 ? (
            <p>등록된 일정이 없습니다.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 24,
                justifyItems: "center",
              }}
            >
              {filteredSchedules.map((s) => {
                const isPast = new Date(s.start_date) < today;

                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/education/${type}/${s.id}`)}
                    style={{
                      width: 260,
                      border: ".0625rem solid #ddd",
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#fff",
                      boxShadow: "0 .125rem .375rem rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      filter: isPast
                        ? "grayscale(0.1) brightness(0.8)"
                        : "none", // ✅ 핵심 변경
                    }}
                  >
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.title}
                        style={{
                          width: "100%",
                          height: 140,
                          objectFit: "contain",
                        }}
                      />
                    ) : s.product_image ? (
                      <img
                        src={s.product_image}
                        alt={s.title}
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
                          {s.title}
                        </h4>
                        {isPast && (
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
                        {formatScheduleDate(s.start_date, s.end_date)}
                      </p>

                      {isPast && (
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
