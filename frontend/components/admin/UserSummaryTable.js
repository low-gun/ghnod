// ./frontend/components/admin/UserSummaryTable.js
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import UserPointModal from "./UserPointModal";
import UserCouponModal from "./UserCouponModal";
import SearchFilter from "@/components/common/SearchFilter";
import CouponTemplateModal from "./CouponTemplateModal";
import PaginationControls from "@/components/common/PaginationControls";
import UserPointGrantModal from "./UserPointGrantModal";
import UserCouponGrantModal from "./UserCouponGrantModal";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import UserInquiryModal from "./UserInquiryModal";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

// 공통 UI
import AdminToolbar from "@/components/common/AdminToolbar";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
export default function UserSummaryTable({
  onLoaded,
  useExternalToolbar = false,
  externalSearchType,
  externalSearchQuery,
  searchSyncKey,
  onExcelData,
  onSelectionChange,
  // ✅ 탭 활성 여부(비활성 시 요청/엑셀 갱신 금지)
  isActive = true,
}) {
  const router = useRouter();
  const isTabletOrBelow = useIsTabletOrBelow();

  const [totalCount, setTotalCount] = useState(0);
  const [summaries, setSummaries] = useState([]);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  // 기본 정렬: 생성일 내림차순
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedUserForPoint, setSelectedUserForPoint] = useState(null);
  const [selectedUserForCoupon, setSelectedUserForCoupon] = useState(null);
  const [selectedUserForInquiry, setSelectedUserForInquiry] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [couponTemplates, setCouponTemplates] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCouponGrantModal, setShowCouponGrantModal] = useState(false);
  const [showPointGrantModal, setShowPointGrantModal] = useState(false);

  const { showAlert } = useGlobalAlert();

  // 로딩/에러
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  // 정렬(클라이언트 정렬은 엑셀 다운로드 등에 사용)
  useEffect(() => {
    if (!onExcelData || !isActive) return;
    onExcelData({
      headers: [
        "이름",
        "이메일",
        "수강횟수",
        "적립포인트",
        "사용포인트",
        "잔여포인트",
        "결제합계",
        "잔여쿠폰",
        "문의내역",
      ],
      data: summaries.map((u) => ({
        이름: u.username,
        이메일: u.email,
        수강횟수: u.courseCount,
        적립포인트: u.pointGiven,
        사용포인트: u.pointUsed,
        잔여포인트: u.pointBalance,
        결제합계: u.paymentTotal,
        잔여쿠폰: u.couponBalance,
        문의내역: u.inquiryCount,
      })),
    });
  }, [summaries, onExcelData, isActive]);

  // 페이지 수
  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize]
  );

  const abortRef = useRef(null);

  const fetchSummaries = async (signal) => {
    try {
      setLoadError("");
      // ✅ 목록이 비어 있을 때만 스켈레톤, 그 외에는 얇은 로딩바
      if (summaries.length === 0) setIsInitialLoading(true);
      setIsFetching(true);

      const res = await api.get("admin/users/summary", {
        params: {
          page: currentPage,
          pageSize,
          type: searchType,
          search: searchQuery,
          sort: sortConfig.key,
          order: sortConfig.direction,
        },
        signal, // ✅ 요청 취소 연결
      });

      if (res.data.success) {
        setSummaries(res.data.summaries);
        setTotalCount(res.data.totalCount);
        if (typeof onLoaded === "function") {
          onLoaded({ type: "summary", totalCount: res.data.totalCount });
        }
      } else {
        setLoadError("목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") {
        // 요청 취소는 무시
      } else {
        setLoadError("사용자 요약 데이터 불러오기 실패");
      }
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  };

  // ✅ 활성 탭에서만 즉시 fetch (디바운스 제거)
  useEffect(() => {
    if (!isActive) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchSummaries(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, searchType, searchQuery, currentPage, pageSize, sortConfig]);
  // ✅ 부모(AdminUsersPage)에서 전달되는 검색값 반영
  useEffect(() => {
    if (externalSearchType !== undefined) setSearchType(externalSearchType);
    if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSyncKey]);
  useEffect(() => {
    const fetchCouponTemplates = async () => {
      try {
        const res = await api.get("admin/coupon-templates");
        if (res.data.success) {
          const activeTemplates = res.data.data.filter(
            (t) => t.is_active === 1
          );
          setCouponTemplates(activeTemplates);
        }
      } catch {
        /* 템플릿 로드는 실패해도 테이블과 직접 관련 없으므로 무시 */
      }
    };
    fetchCouponTemplates();
  }, []);
  const handleOpenDetailClick = useCallback(
    (id) => {
      router.push(`/admin/users/${id}`);
    },
    [router]
  );

  const handleSort = useCallback(
    (column) => {
      const newOrder =
        sortConfig.key === column && sortConfig.direction === "asc"
          ? "desc"
          : "asc";
      setSortConfig({ key: column, direction: newOrder });
      setCurrentPage(1);
    },
    [sortConfig]
  );

  const handleSelectAll = useCallback(
    (e) => {
      const next = e.target.checked ? summaries.map((u) => u.id) : [];
      setSelectedIds(next);
      if (typeof onSelectionChange === "function") onSelectionChange(next);
    },
    [summaries, onSelectionChange]
  );

  const handleSelectOne = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((i) => i !== id)
          : [...prev, id];
        if (typeof onSelectionChange === "function") onSelectionChange(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  return (
    <div>
      {/* 상단 툴바 (외부 툴바 사용하는 경우 숨김) */}
      {!useExternalToolbar && (
        <AdminToolbar
          left={
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
          }
          right={
            <>
              <button
                onClick={() => setShowPointGrantModal(true)}
                style={actionBtnStyle}
              >
                포인트 지급
              </button>
              <button
                onClick={() => {
                  if (selectedIds.length === 0) {
                    showAlert("지급 대상을 먼저 선택해주세요.");
                    return;
                  }
                  setShowCouponGrantModal(true);
                }}
                style={{
                  ...actionBtnStyle,
                  backgroundColor: "#ffc107",
                  color: "#212529",
                }}
              >
                쿠폰 지급
              </button>
              <button
                onClick={() => setShowCouponModal(true)}
                style={{ ...actionBtnStyle, backgroundColor: "#28a745" }}
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
            </>
          }
        />
      )}
      {isFetching && <div style={fetchBarStyle} />}

      {/* 본문: 로딩/에러/빈/목록 */}
      {isInitialLoading ? (
        isTabletOrBelow ? (
          <div style={skeletonGridStyle}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={4} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={9} rows={6} />
        )
      ) : loadError ? (
        <div style={errorBoxStyle}>
          {loadError}
          <button
            style={{
              ...actionBtnStyle,
              marginLeft: 10,
              backgroundColor: "#e53e3e",
            }}
            onClick={() => fetchSummaries()}
          >
            다시 시도
          </button>
        </div>
      ) : totalCount === 0 ? (
        <div style={emptyBoxStyle}>
          사용자 요약 정보가 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
        </div>
      ) : !isTabletOrBelow ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedIds.length === summaries.length &&
                        summaries.length > 0
                      }
                    />
                  </th>
                  <th className="admin-th">No</th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("username")}
                  >
                    이름
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("email")}
                  >
                    이메일
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("courseCount")}
                  >
                    수강
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("paymentTotal")}
                  >
                    결제합계
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("pointBalance")}
                  >
                    잔여포인트
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("couponBalance")}
                  >
                    잔여쿠폰
                  </th>
                  <th
                    className="admin-th"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("inquiryCount")}
                  >
                    문의
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td
                      className="admin-td-link"
                      onClick={() => handleOpenDetailClick(user.id)}
                    >
                      {user.username}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.courseCount}건</td>
                    <td>{formatPrice(user.paymentTotal)}원</td>
                    <td
                      className="admin-td-link"
                      onClick={() => setSelectedUserForPoint(user)}
                    >
                      {formatPrice(user.pointBalance)}P
                    </td>
                    <td
                      className="admin-td-link"
                      onClick={() => setSelectedUserForCoupon(user)}
                    >
                      {user.couponBalance}장
                    </td>
                    <td
                      className="admin-td-link"
                      onClick={() => setSelectedUserForInquiry(user)}
                    >
                      {user.inquiryCount}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {summaries.map((user, index) => (
              <div key={user.id} style={cardContainerBaseStyle}>
                {/* 체크 + 번호 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => handleSelectOne(user.id)}
                  />
                  <div style={{ fontSize: 13, color: "#666" }}>
                    No {(currentPage - 1) * pageSize + index + 1}
                  </div>
                </div>
                {/* 이름(링크) */}
                <div
                  style={nameLinkStyle}
                  onClick={() => handleOpenDetailClick(user.id)}
                >
                  {user.username}
                </div>

                {/* 상세 */}
                <div style={cardRow}>
                  <span style={cardLabel}>이메일</span>
                  <span style={cardValue}>{user.email}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>수강</span>
                  <span style={cardValue}>{user.courseCount}건</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>결제합계</span>
                  <span style={cardValue}>
                    {formatPrice(user.paymentTotal)}원
                  </span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>잔여포인트</span>
                  <button
                    style={linkBtn}
                    onClick={() => setSelectedUserForPoint(user)}
                  >
                    {formatPrice(user.pointBalance)}P
                  </button>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>잔여쿠폰</span>
                  <button
                    style={linkBtn}
                    onClick={() => setSelectedUserForCoupon(user)}
                  >
                    {user.couponBalance}장
                  </button>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>문의</span>
                  <button
                    style={linkBtn}
                    onClick={() => setSelectedUserForInquiry(user)}
                  >
                    {user.inquiryCount}건
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* 모달들 */}
      {showCouponModal && (
        <CouponTemplateModal onClose={() => setShowCouponModal(false)} />
      )}

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
          onRefresh={fetchSummaries}
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

/* 공통 버튼 */
const actionBtnStyle = {
  padding: "8px 16px",
  fontSize: "13px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

/* 카드 전용 */
const cardRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "6px 0",
  borderBottom: "1px dashed #f0f0f0",
};
const cardLabel = { color: "#888", fontSize: 13, minWidth: 80 };
const cardValue = { color: "#222", fontSize: 14, wordBreak: "break-all" };
const linkBtn = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#0070f3",
  cursor: "pointer",
  fontSize: 14,
  textDecoration: "underline",
};
const nameLinkStyle = {
  color: "#0070f3",
  fontWeight: 600,
  marginTop: 8,
  marginBottom: 6,
  cursor: "pointer",
  fontSize: 16,
};

const skeletonGridStyle = { display: "grid", gap: 12 };
const errorBoxStyle = {
  border: "1px solid #ffd5d5",
  background: "#fff5f5",
  color: "#c53030",
  padding: "14px 16px",
  borderRadius: 8,
  marginBottom: 16,
};
const emptyBoxStyle = {
  border: "1px dashed #d0d7de",
  background: "#fafbfc",
  color: "#57606a",
  padding: "18px 16px",
  borderRadius: 8,
  textAlign: "center",
};
const cardContainerBaseStyle = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
};
const fetchBarStyle = {
  height: 2,
  width: "100%",
  background:
    "linear-gradient(90deg, rgba(0,112,243,0) 0%, rgba(0,112,243,.6) 50%, rgba(0,112,243,0) 100%)",
  animation: "barPulse 1s linear infinite",
  margin: "8px 0",
};
