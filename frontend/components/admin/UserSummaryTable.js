import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router"; // ✅ 추가
import api from "@/lib/api";
import { formatPrice } from "../../lib/format";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import UserPointModal from "./UserPointModal";
import UserCouponModal from "./UserCouponModal";
import SearchFilter from "@/components/common/SearchFilter";
import CouponTemplateModal from "./CouponTemplateModal";
import PaginationControls from "@/components/common/PaginationControls"; // ✅ 추가
import UserPointGrantModal from "./UserPointGrantModal";
import UserCouponGrantModal from "./UserCouponGrantModal";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import UserInquiryModal from "./UserInquiryModal"; // ✅ 추가
export default function UserSummaryTable() {
  const router = useRouter();
  const [totalCount, setTotalCount] = useState(0); // ✅ 총 개수
  const [summaries, setSummaries] = useState([]);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "username",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForPoint, setSelectedUserForPoint] = useState(null);
  const [selectedUserForCoupon, setSelectedUserForCoupon] = useState(null);
  const [selectedUserForInquiry, setSelectedUserForInquiry] = useState(null); // ✅ 추가
  const [selectedIds, setSelectedIds] = useState([]);
  const [couponTemplates, setCouponTemplates] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCouponGrantModal, setShowCouponGrantModal] = useState(false);
  const [showPointGrantModal, setShowPointGrantModal] = useState(false);

  // ✅ 정렬
  const sortedSummaries = useMemo(() => {
    if (!sortConfig) return summaries;
    const { key, direction } = sortConfig;

    return [...summaries].sort((a, b) => {
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [summaries, sortConfig]);

  // ✅ 페이징
  const pagedSummaries = summaries; // ✅ 서버에서 받은 데이터 그대로 사용

  // ✅ 페이지 수
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize); // ✅ 서버에서 받은 총 개수 기준
  }, [totalCount, pageSize]);

  const fetchSummaries = async () => {
    try {
      const res = await api.get("admin/users/summary", {
        params: {
          page: currentPage,
          pageSize: pageSize,
          type: searchType,
          search: searchQuery,
          sort: sortConfig.key,
          order: sortConfig.direction,
        },
      });
      if (res.data.success) {
        setSummaries(res.data.summaries);
        setTotalCount(res.data.totalCount); // ✅ totalPages 계산용
      }
    } catch (err) {
      console.error("❌ 사용자 요약 데이터 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [searchType, searchQuery, currentPage, pageSize, sortConfig]);

  useEffect(() => {
    const fetchCouponTemplates = async () => {
      const res = await api.get("admin/coupon-templates");
      if (res.data.success) {
        const activeTemplates = res.data.data.filter((t) => t.is_active === 1);
        setCouponTemplates(activeTemplates);
      }
    };
    fetchCouponTemplates();
  }, []);

  const handleSort = (column) => {
    const newOrder =
      sortConfig.key === column && sortConfig.direction === "asc"
        ? "desc"
        : "asc";
    setSortConfig({ key: column, direction: newOrder });
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? summaries.map((u) => u.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderArrow = (key) => {
    const baseStyle = { marginLeft: 6, fontSize: 12 };
    if (sortConfig.key !== key)
      return <span style={{ ...baseStyle, color: "#ccc" }}>↕</span>;
    return (
      <span style={{ ...baseStyle }}>
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };
  return (
    <div>
      {/* 🔍 검색 + 다운로드 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <SearchFilter
          searchType={searchType}
          setSearchType={setSearchType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchOptions={[
            { value: "username", label: "이름", type: "text" },
            { value: "email", label: "이메일", type: "text" },
            { value: "courseCount", label: "수강", type: "text" },
            { value: "pointTotal", label: "포인트", type: "text" },
            { value: "paymentTotal", label: "결제", type: "text" },
            { value: "couponCount", label: "쿠폰", type: "text" },
            { value: "inquiryCount", label: "문의", type: "text" },
          ]}
          onSearchUpdate={(type, query) => {
            setSearchType(type);
            setSearchQuery(query);
            setCurrentPage(1);
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* ✅ 포인트 지급 버튼 */}
          <button
            onClick={() => setShowPointGrantModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            포인트 지급
          </button>

          {/* ✅ 쿠폰 지급 버튼 */}
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                alert("지급 대상을 먼저 선택해주세요.");
                return;
              }
              setShowCouponGrantModal(true);
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ffc107",
              color: "#212529",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            쿠폰 지급
          </button>

          {/* 쿠폰 템플릿 관리 버튼 */}
          <button
            onClick={() => setShowCouponModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            쿠폰관리
          </button>
          <PageSizeSelector
            value={pageSize}
            onChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />

          <ExcelDownloadButton
            fileName="사용자별_구매내역"
            sheetName="사용자요약"
            headers={[
              "이름",
              "이메일",
              "수강횟수",
              "적립포인트",
              "사용포인트",
              "잔여포인트",
              "결제합계",
              "잔여쿠폰",
              "문의내역",
            ]}
            data={summaries.map((u) => ({
              이름: u.username,
              이메일: u.email,
              수강횟수: u.courseCount,
              적립포인트: u.pointGiven,
              사용포인트: u.pointUsed,
              잔여포인트: u.pointBalance,
              결제합계: u.paymentTotal,
              잔여쿠폰: u.couponBalance,
              문의내역: u.inquiryCount,
            }))}
          />
        </div>
      </div>
      {showCouponModal && (
        <CouponTemplateModal onClose={() => setShowCouponModal(false)} />
      )}
      {/* 📋 테이블 */}
      {summaries.length === 0 ? (
        <p>사용자 요약 정보가 없습니다.</p>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thCenter}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedIds.length === summaries.length &&
                      summaries.length > 0
                    }
                  />
                </th>
                <th style={thCenter}>No</th>
                <th style={thCenter} onClick={() => handleSort("username")}>
                  이름 {renderArrow("username")}
                </th>
                <th style={thCenter} onClick={() => handleSort("email")}>
                  이메일 {renderArrow("email")}
                </th>
                <th style={thCenter} onClick={() => handleSort("courseCount")}>
                  수강 {renderArrow("courseCount")}
                </th>
                <th style={thCenter} onClick={() => handleSort("paymentTotal")}>
                  결제합계 {renderArrow("paymentTotal")}
                </th>
                <th style={thCenter} onClick={() => handleSort("pointBalance")}>
                  잔여포인트 {renderArrow("pointBalance")}
                </th>
                <th style={thCenter} onClick={() => handleSort("couponCount")}>
                  잔여쿠폰 {renderArrow("couponCount")}
                </th>

                <th style={thCenter} onClick={() => handleSort("inquiryCount")}>
                  문의 {renderArrow("inquiryCount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((user, index) => (
                <tr key={user.id}>
                  <td style={tdCenter}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                    />
                  </td>
                  <td style={tdCenter}>
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td
                    style={{
                      ...tdCenter,
                      color: "#0070f3",
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    {user.username}
                  </td>
                  <td style={tdCenter}>{user.email}</td>
                  <td style={tdCenter}>{user.courseCount}건</td>
                  <td style={tdCenter}>{formatPrice(user.paymentTotal)}</td>
                  <td
                    style={{
                      ...tdCenter,
                      color: "#0070f3",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedUserForPoint(user)}
                  >
                    {formatPrice(user.pointBalance)}
                  </td>
                  <td
                    style={{
                      ...tdCenter,
                      color: "#0070f3",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedUserForCoupon(user)}
                  >
                    {user.couponBalance}장
                  </td>
                  <td
                    style={{ ...tdCenter, color: "#0070f3", cursor: "pointer" }}
                    onClick={() => setSelectedUserForInquiry(user)} // ✅ 추가
                  >
                    {user.inquiryCount}건
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      {selectedUser && (
        <UserRewardModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}{" "}
      {selectedUserForPoint && (
        <UserPointModal
          user={selectedUserForPoint}
          onClose={() => setSelectedUserForPoint(null)}
          onRefresh={fetchSummaries}
        />
      )}
      {selectedUserForCoupon && (
        <UserCouponModal
          user={selectedUserForCoupon}
          onClose={() => setSelectedUserForCoupon(null)}
          onRefresh={fetchSummaries} // ✅ 추가
        />
      )}
      {selectedUserForInquiry && (
        <UserInquiryModal
          userId={selectedUserForInquiry.id}
          username={selectedUserForInquiry.username}
          onClose={() => setSelectedUserForInquiry(null)}
        />
      )}
      {showPointGrantModal && (
        <UserPointGrantModal
          selectedIds={selectedIds}
          onClose={() => setShowPointGrantModal(false)}
          onSuccess={() => {
            fetchSummaries();
            setSelectedIds([]);
          }}
        />
      )}
      {showCouponGrantModal && (
        <UserCouponGrantModal
          selectedIds={selectedIds}
          couponTemplates={couponTemplates}
          onClose={() => setShowCouponGrantModal(false)}
          onSuccess={() => {
            fetchSummaries();
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}

// ✅ 스타일은 그대로
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "15px",
  lineHeight: "1.6",
};

const thCenter = {
  padding: "12px",
  textAlign: "center",
  fontWeight: "bold",
  cursor: "pointer",
};
const tdCenter = {
  padding: "12px",
  textAlign: "center",
};
const actionBtnStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const csvButtonStyle = {
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
  fontSize: "14px",
};
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  position: "relative",
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "400px", // (크기는 필요에 따라 조정)
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
