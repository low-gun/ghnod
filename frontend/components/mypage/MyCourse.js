import { useRouter } from "next/router";
import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "react-datepicker/dist/react-datepicker.css";
import ReviewModal from "@/components/mypage/ReviewModal";
import { useIsCardLayout } from "@/lib/hooks/useIsDeviceSize";
import SearchFilter from "@/components/common/SearchFilter";

function formatKoreanDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

const columnMap = {
  No: "No",
  title: "강의명",
  date: "일정",
  location: "장소",
  instructor: "강사",
  status: "상태",
  review: "후기",
};

const thCenter = {
  padding: "10px",
  textAlign: "center",
  fontWeight: "normal",
  cursor: "pointer",
  verticalAlign: "middle",
};

const tdCenter = {
  padding: "12px",
  textAlign: "center",
  height: "60px",
  verticalAlign: "middle",
};

const sortArrowStyle = {
  fontSize: "11px",
  marginLeft: "4px",
  verticalAlign: "middle",
};

const pageButtonStyle = {
  padding: "6px 10px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  margin: "0 4px",
  cursor: "pointer",
};
const reviewButtonStyle = {
  padding: "6px 12px",
  fontSize: "13px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#0070f3",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s",
};
const titleStyle = {
  fontSize: "1.4rem",
  fontWeight: "bold",
  marginBottom: "20px",
};
const mobileCardStyle = {
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

export default function MyCourse() {
  const router = useRouter();
  const [searchType, setSearchType] = useState("title");
  const [searchValue, setSearchValue] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const isCardLayout = useIsCardLayout();
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth && windowWidth <= 480;

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      setIsMediumScreen(isCardLayout && width > 500 && width < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [isCardLayout]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/mypage/courses", {
          params: { all: true },
        });
        if (res.data.success) {
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error("❌ 수강 데이터 불러오기 실패", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 모든 필터, 정렬
  const filteredCourses = useMemo(() => {
    const query = searchValue.toLowerCase();
    return courses.filter((item) => {
      const value = item[searchType];
      if (value && typeof value === "string") {
        if (!value.toLowerCase().includes(query)) return false;
      }
      if (searchType === "date" && (dateRange[0] || dateRange[1])) {
        const start = new Date(item.start_date);
        if (dateRange[0] && start < dateRange[0]) return false;
        if (dateRange[1] && start > dateRange[1]) return false;
      }
      return true;
    });
  }, [courses, searchType, searchValue, dateRange]);

  const sortedCourses = useMemo(() => {
    let result = [...filteredCourses];
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (sortConfig.key === "start_date") {
          return sortConfig.direction === "asc"
            ? new Date(aVal) - new Date(bVal)
            : new Date(bVal) - new Date(aVal);
        }
        if (typeof aVal === "string") {
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }
    return result;
  }, [filteredCourses, sortConfig]);

  const pagedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCourses.slice(start, start + pageSize);
  }, [sortedCourses, currentPage, pageSize]);

  const containerStyle = {
    padding: isCardLayout ? 0 : 20,
    marginTop: isMediumScreen ? "16px" : 0,
    minHeight: 440,
  };

  const handleOpenReviewModal = (item) => {
    setReviewTarget(item);
    setReviewModalVisible(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    setReviewTarget(null);
  };

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearchType("title");
    setSearchValue("");
    setDateRange([null, null]);
    setSortConfig({ key: "", direction: "" });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sortedCourses.length / pageSize);

  const renderStatusBadge = (status) => {
    const colors = {
      예정: "#0070f3",
      진행중: "#f59e0b",
      완료: "#10b981",
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || "#ccc",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
        }}
      >
        {status}
      </span>
    );
  };

  // 수강내역 없음 안내
  const renderEmpty = () => (
    <div
      style={{
        padding: isMobile ? "56px 0 40px 0" : "70px 0 60px 0",
        textAlign: "center",
        color: "#bbb",
        fontSize: isMobile ? "1rem" : "1.1rem",
        minHeight: 200,
        fontWeight: 400,
      }}
    >
      <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>
        📚
      </span>
      아직 수강내역이 없습니다
      <div style={{ fontSize: "0.97rem", color: "#ccc", marginTop: 4 }}>
        첫 강의를 신청해보세요!
      </div>
    </div>
  );

  // 실제 화면 렌더
  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>수강정보</h2>
      {!isCardLayout && courses.length > 0 && (
        <SearchFilter
          searchType={searchType}
          setSearchType={setSearchType}
          searchQuery={searchValue}
          setSearchQuery={setSearchValue}
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          setStartDate={(date) => setDateRange([date, dateRange[1]])}
          setEndDate={(date) => setDateRange([dateRange[0], date])}
          searchOptions={[
            { value: "title", label: "강의명", type: "text" },
            { value: "location", label: "장소", type: "text" },
            { value: "instructor", label: "강사", type: "text" },
            {
              value: "status",
              label: "상태",
              type: "select",
              options: [
                { value: "예정", label: "예정" },
                { value: "진행중", label: "진행중" },
                { value: "완료", label: "완료" },
              ],
            },
            { value: "date", label: "일정", type: "date" },
          ]}
          onSearchUpdate={(type, query) => {
            setSearchType(type);
            setSearchValue(query);
            setCurrentPage(1);
          }}
          isMobile={false}
        />
      )}

      {sortedCourses.length === 0 ? (
        renderEmpty()
      ) : isCardLayout ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "100%",
          }}
        >
          {sortedCourses.map((item) => (
            <div
              key={item.order_item_id}
              style={{
                marginBottom: "14px",
                borderRadius: "11px",
                background: "#fff",
                boxShadow: "0 2px 10px 0 rgba(0,0,0,0.06)",
                padding: "18px 14px 16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minHeight: 120,
                cursor: "pointer", // 손가락 커서
                transition: "box-shadow 0.15s",
              }}
              onClick={() =>
                router.push(`/education/${item.type}/${item.schedule_id}`)
              }
            >
              {/* 카드 상단: 강의명, 상태 */}
              <div
  style={{
    display: "flex",
    alignItems: "center",
    marginBottom: 5,
    minWidth: 0, // ⬅ flex 자식 말줄임 허용
  }}
>
  <span
    style={{
      fontWeight: 600,
      fontSize: "1.08rem",
      flex: 1,
      minWidth: 0,                // ⬅ 말줄임에 필요
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    {item.title}
  </span>
  {renderStatusBadge(item.status)}
</div>

              {/* 일정 */}
              <div
                style={{ color: "#455", fontSize: "0.98rem", marginBottom: 2 }}
              >
                <span style={{ marginRight: 7, fontWeight: 500 }}>일정</span>
                {new Date(item.start_date).toISOString().slice(0, 10) ===
                new Date(item.end_date).toISOString().slice(0, 10)
                  ? formatKoreanDate(item.start_date)
                  : `${formatKoreanDate(item.start_date)} ~ ${formatKoreanDate(item.end_date)}`}
              </div>
              {/* 장소/강사 */}
              <div
  style={{
    color: "#5a5a5a",
    fontSize: "0.98rem",
    display: "flex",
    gap: 14,
    minWidth: 0, // ⬅ 말줄임 허용
  }}
>
  <span
    style={{
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    📍 {item.location}
  </span>
  <span
    style={{
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    👤 {item.instructor}
  </span>
</div>

              {/* 후기 버튼(오른쪽 하단) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                {item.status === "완료" ? (
                  <button
                    style={{
                      ...reviewButtonStyle,
                      backgroundColor: item.is_reviewed ? "#bbb" : "#0070f3",
                      fontSize: "0.96rem",
                      padding: "6px 16px",
                      minWidth: 70,
                    }}
                    onClick={() => handleOpenReviewModal({ ...item })}
                  >
                    {item.is_reviewed ? "후기수정" : "후기작성"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // PC(테이블형)
        <div style={{ minHeight: 340 }}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width:"100%", fontSize:"15px", borderCollapse:"collapse", marginBottom:0, tableLayout:"fixed" }}>
  {/* ⬇ 열 너비 고정 (whitespace 방지: map으로 렌더링) */}
  <colgroup>{
    ["6%","30%","18%","18%","12%","9%","7%"].map((w, i) => <col key={i} style={{ width: w }} />)
  }</colgroup><thead style={{ background: "#f9f9f9" }}>
    <tr>
      {[
        "No",
        "title",
        "date",
        "location",
        "instructor",
        "status",
        "review",
      ].map((key) => {
        const sortKey =
          key === "No" ? null : key === "date" ? "start_date" : key;
        const isSortable = !["No", "certificate"].includes(key);
        const isActive = sortConfig.key === sortKey;
        return (
          <th
            key={key}
            onClick={() => {
              if (isSortable) handleSort(sortKey);
            }}
            style={thCenter}
          >
            {columnMap[key]}{" "}
            {isSortable && isActive && (
              <span
                style={{
                  ...sortArrowStyle,
                  color: "#000",
                }}
              >
                {sortConfig.direction === "asc" ? "▲" : "▼"}
              </span>
            )}
          </th>
        );
      })}
    </tr>
  </thead>
  <tbody>
    {courses.length === 0 ? (
      <tr>
        <td colSpan={8} style={tdCenter}>
          {renderEmpty("아직 수강내역이 없습니다")}
        </td>
      </tr>
    ) : sortedCourses.length === 0 ? (
      <tr>
        <td colSpan={8} style={tdCenter}>
          {renderEmpty("해당되는 내용이 없습니다")}
        </td>
      </tr>
    ) : (
      pagedCourses.map((item, idx) => (
        <tr
          key={item.order_item_id}
          style={{
            backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
          }}
        >
          <td style={tdCenter}>
            {(currentPage - 1) * pageSize + idx + 1}
          </td>
          <td
            style={{ ...tdCenter, cursor: "pointer", color: "#0070f3" }}
            onClick={() =>
              router.push(`/education/${item.type}/${item.schedule_id}`)
            }
            title={`${item.title}${item.category ? ` (${item.category})` : ""}`}
          >
            <span
              style={{
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "middle",
              }}
            >
              {item.title}
              {item.category ? ` (${item.category})` : ""}
            </span>
          </td>
          <td style={tdCenter}>
            {new Date(item.start_date).toISOString().slice(0, 10) ===
            new Date(item.end_date).toISOString().slice(0, 10) ? (
              formatKoreanDate(item.start_date)
            ) : (
              <>
                {formatKoreanDate(item.start_date)} <br />~{" "}
                {formatKoreanDate(item.end_date)}
              </>
            )}
          </td>
          <td style={tdCenter} title={item.location || ""}>
            <span
              style={{
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "middle",
              }}
            >
              {item.location}
            </span>
          </td>
          <td style={tdCenter} title={item.instructor || ""}>
            <span
              style={{
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "middle",
              }}
            >
              {item.instructor}
            </span>
          </td>
          <td style={tdCenter}>{renderStatusBadge(item.status)}</td>
          <td style={tdCenter}>
            {item.status === "완료" ? (
              <button
                style={{
                  ...reviewButtonStyle,
                  backgroundColor: item.is_reviewed ? "#999" : "#0070f3",
                }}
                onClick={() =>
                  handleOpenReviewModal({
                    ...item,
                    reviewId: item.review_id,
                    initialData: {
                      rating: item.review_rating,
                      comment: item.review_comment,
                      title: item.title,
                      created_at: item.review_created_at,
                      updated_at: item.review_updated_at,
                    },
                  })
                }
              >
                {item.is_reviewed ? "수정" : "작성"}
              </button>
            ) : (
              "-"
            )}
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>

          </div>
          {/* ⏩ 페이지네이션 */}
          {pagedCourses.length !== 0 && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      ...pageButtonStyle,
                      fontWeight: currentPage === page ? "bold" : "normal",
                      backgroundColor: currentPage === page ? "#eee" : "#fff",
                    }}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      <ReviewModal
        visible={reviewModalVisible}
        onClose={handleCloseReviewModal}
        productId={reviewTarget?.product_id}
        scheduleId={reviewTarget?.schedule_id}
        reviewId={reviewTarget?.reviewId}
        initialData={reviewTarget?.initialData}
        onSuccess={() => router.replace(router.asPath)}
      />
    </div>
  );
}
