import { useRouter } from "next/router";
import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import "react-datepicker/dist/react-datepicker.css";
import SearchFilter from "@/components/common/SearchFilter";
import ReviewModal from "@/components/mypage/ReviewModal"; // 상단 import 추가
function formatKoreanDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

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

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  const handleOpenReviewModal = (item) => {
    setReviewTarget(item);
    setReviewModalVisible(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    setReviewTarget(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/mypage/courses", {
          params: { all: true }, // ✅ 전체 수강 데이터 요청
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

  const filteredCourses = useMemo(() => {
    const query = searchValue.toLowerCase();

    const result = courses.filter((item) => {
      // 🔍 검색 필드 필터
      const value = item[searchType];
      if (value && typeof value === "string") {
        if (!value.toLowerCase().includes(query)) return false;
      }

      // 📆 날짜 필터
      if (searchType === "date" && (dateRange[0] || dateRange[1])) {
        const start = new Date(item.start_date);
        if (dateRange[0] && start < dateRange[0]) return false;
        if (dateRange[1] && start > dateRange[1]) return false;
      }

      return true;
    });

    console.log("✅ filteredCourses.length:", result.length); // 🔍 이 위치가 핵심

    return result;
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
  }, [courses, sortConfig]);

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    // router.push 안 함
  };
  const pagedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedCourses.slice(startIndex, endIndex);
  }, [sortedCourses, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchType("title");
    setSearchValue("");
    setDateRange([null, null]);
    setSortConfig({ key: "", direction: "" });
    setCurrentPage(1);
  };
  const handleDownloadCertificate = async (item) => {
    try {
      const res = await api.get(
        `/user/certificates/${item.certificate_id}/download`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${item.title}_수료증.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("❌ 수료증 다운로드 실패:", err);
      alert("수료증 다운로드 중 오류가 발생했습니다.");
    }
  };

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

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

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>수강정보</h2>

      {/* 🔍 필터 영역 */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
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
        />
        <button onClick={resetFilters} style={buttonStyle("#ccc", "#333")}>
          초기화
        </button>
      </div>

      {/* 📋 테이블 */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            fontSize: "15px",
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              {[
                "No",
                "title",
                "date",
                "location",
                "instructor",
                "status",
                "certificate",
                "review", // ✅ 후기 컬럼 추가
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
                    {isSortable && (
                      <span
                        style={{
                          ...sortArrowStyle,
                          color: isActive ? "#000" : "#ccc",
                        }}
                      >
                        {isActive
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} style={tdCenter}>
                  수강 내역이 없습니다.
                </td>
              </tr>
            ) : (
              pagedCourses.map((item, idx) => {
                const now = new Date();
                const start = new Date(item.start_date);
                const end = new Date(item.end_date);
                const status = item.status;

                return (
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
                      style={{
                        ...tdCenter,
                        cursor: "pointer",
                        color: "#0070f3",
                      }}
                      onClick={() =>
                        router.push(
                          `/education/${item.type}/${item.schedule_id}`
                        )
                      }
                    >
                      {item.title}
                      {item.category ? ` (${item.category})` : ""}
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

                    <td style={tdCenter}>{item.location}</td>
                    <td style={tdCenter}>{item.instructor}</td>
                    <td style={tdCenter}>{renderStatusBadge(status)}</td>
                    <td style={tdCenter}>
                      {item.certificate_id ? (
                        <button
                          style={{
                            ...certButtonStyle,
                            backgroundColor: "#0070f3",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={() => handleDownloadCertificate(item)}
                        >
                          다운로드
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td style={tdCenter}>
                      {status === "완료" ? (
                        <button
                          style={{
                            ...reviewButtonStyle,
                            backgroundColor: item.is_reviewed
                              ? "#999"
                              : "#0070f3",
                          }}
                          onClick={() =>
                            handleOpenReviewModal({
                              ...item,
                              reviewId: item.review_id,
                              initialData: {
                                rating: item.review_rating,
                                comment: item.review_comment,
                                title: item.title, // 강의명
                                created_at: item.review_created_at, // 작성일시 (백엔드에서 내려줘야 함
                                updated_at: item.review_updated_at,
                              },
                            })
                          }
                          onMouseOver={(e) => {
                            if (!item.is_reviewed)
                              e.currentTarget.style.backgroundColor = "#0057c2";
                          }}
                          onMouseOut={(e) => {
                            if (!item.is_reviewed)
                              e.currentTarget.style.backgroundColor = "#0070f3";
                          }}
                        >
                          {item.is_reviewed ? "수정" : "작성"}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ⏩ 페이지네이션 */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {totalPages > 0 ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
          ))
        ) : (
          <span style={{ color: "#888", fontSize: "14px" }}>1페이지</span>
        )}
      </div>

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

const columnMap = {
  No: "No",
  title: "강의",
  date: "일정",
  location: "장소",
  instructor: "강사",
  status: "상태",
  certificate: "수료증",
  review: "후기", // ✅ 추가
};

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "140px",
};

const buttonStyle = (bg, color) => ({
  padding: "8px 14px",
  backgroundColor: bg,
  color: color,
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
});

const thCenter = {
  padding: "10px",
  textAlign: "center",
  fontWeight: "bold",
  cursor: "pointer",
  height: "60px", // ✅ 추가
  verticalAlign: "middle", // ✅ 추가
};

const tdCenter = {
  padding: "12px",
  textAlign: "center",
  height: "60px", // ✅ 추가
  verticalAlign: "middle", // ✅ 추가 (텍스트 중앙 정렬)
};

const sortArrowStyle = {
  fontSize: "11px",
  marginLeft: "4px",
  verticalAlign: "middle",
};

const certButtonStyle = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "1px solid #aaa",
  backgroundColor: "#eee",
  color: "#666",
  cursor: "not-allowed",
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
