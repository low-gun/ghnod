// /frontend/pages/admin/users.js
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import "react-datepicker/dist/react-datepicker.css";
import Head from "next/head"; // 👈 추가

import AdminLayout from "../../components/layout/AdminLayout";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";

import api from "@/lib/api";
import UserTable from "@/components/admin/UserTable";

import { UserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";
import UnansweredInquiriesModal from "@/components/admin/UnansweredInquiriesModal";

// ─────────────────────────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const { query } = router;
  const { user } = useContext(UserContext);
  const { showAlert } = useGlobalAlert();

  // URL 쿼리에서 초기값 복원
  const [searchType, setSearchType] = useState(() => {
    const t = query.type;
    return Array.isArray(t) ? (t[0] ?? "all") : (t ?? "all");
  });
  const [searchQuery, setSearchQuery] = useState(() => query.q ?? "");
  const [startDate, setStartDate] = useState(() =>
    query.s ? new Date(query.s) : null
  );
  const [endDate, setEndDate] = useState(() =>
    query.e ? new Date(query.e) : null
  );

  // 🔵 최신 값 레이스 방지용 ref
  const searchTypeRef = useRef(searchType);
  const searchQueryRef = useRef(searchQuery);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  useEffect(() => {
    searchTypeRef.current = searchType;
  }, [searchType]);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);
  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);

  const defaultTab = query.tab || "list";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [error, setError] = useState("");
  const [sharedLoading, setSharedLoading] = useState(true);
  const [sharedError, setSharedError] = useState("");

  // 검색 버튼을 누를 때마다 증가, UserTable에 전달하여 리마운트 없이 fetch 트리거
  const [searchSyncKeyList, setSearchSyncKeyList] = useState(0);

  // 상단 패널: 사용자 수
  const totalUsersRef = useRef(0);
  const [totalUsers, setTotalUsers] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin.totalUsers");
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  // 선택된 사용자
  const [selectedIds, setSelectedIds] = useState([]);

  // 엑셀 데이터
  const [excelList, setExcelList] = useState({ headers: [], data: [] });
  const [excelSummary, setExcelSummary] = useState({ headers: [], data: [] });

  // 쿠폰 템플릿
  const [couponTemplates, setCouponTemplates] = useState([]);
  const [openPointGrantSignal, setOpenPointGrantSignal] = useState(0);
  const [openCouponGrantSignal, setOpenCouponGrantSignal] = useState(0);
  const [openCouponManageSignal, setOpenCouponManageSignal] = useState(0); // ✅ 추가
  const [openUnansweredModal, setOpenUnansweredModal] = useState(false);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await api.get("admin/users", {
          params: { page: 1, pageSize: 1 },
        });
        if (res.data?.success) {
          totalUsersRef.current = res.data.totalCount;
          setTotalUsers(res.data.totalCount);
          localStorage.setItem("admin.totalUsers", String(res.data.totalCount));
        }
      } catch {
        // 무시
      }
    };
    fetchUserCount();
  }, []);

  // 쿠폰 템플릿 가져오기
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("admin/coupon-templates");
        if (res.data?.success) {
          const active = res.data.data.filter((t) => t.is_active === 1);
          setCouponTemplates(active);
        }
      } catch {
        // 무시
      }
    };
    fetchTemplates();
  }, []);

  // 권한 체크
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  // 쿼리의 tab 반영
  useEffect(() => {
    setActiveTab(query.tab || "list");
  }, [query.tab]);

  // UserTable에서 목록 로드를 완료했을 때 총 사용자수 표시 반영
  const handleLoaded = useCallback(({ type, totalCount }) => {
    if (type === "list") {
      totalUsersRef.current = totalCount;
      setTotalUsers(totalCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin.totalUsers", String(totalCount));
      }
    }
  }, []);

  // 공용 AdminSearchFilter가 문자열 혹은 객체를 넘겨도 모두 수용
  const normalizeSearchPayload = useCallback((p) => {
    // 객체면 그대로
    if (p && typeof p === "object") return p;

    // 🔵 문자열이면 ref의 최신값을 사용(레이스 방지)
    const curType = searchTypeRef.current || "all";
    const curQuery =
      (typeof p === "string" ? p : "") || searchQueryRef.current || "";

    // 🔵 ESC 등으로 빈 문자열이 오면 완전 초기화로 간주
    const isReset = typeof p === "string" && p === "";

    const finalType = isReset ? "all" : curType;
    const finalQuery = isReset ? "" : curQuery;

    const curStart = startDateRef.current;
    const curEnd = endDateRef.current;
    const useDate = finalType === "created_at";

    return {
      type: finalType,
      query: finalQuery,
      startDate: useDate ? curStart || null : null,
      endDate: useDate ? curEnd || null : null,
    };
  }, []);

  // 검색 버튼 핸들러: 상태/URL 동기화 + UserTable에 트리거 키 전달
  const handleSearchSubmit = useCallback(
    async (payloadOrEvent) => {
      const isEvent =
        payloadOrEvent && typeof payloadOrEvent.preventDefault === "function";

      // 단 한 번만 가드
      if (!isEvent && payloadOrEvent?.__submit !== true) return;
      if (isEvent) {
        payloadOrEvent.preventDefault?.();
        payloadOrEvent.stopPropagation?.();
      }

      const norm =
        !isEvent && payloadOrEvent
          ? normalizeSearchPayload(payloadOrEvent)
          : {
              type: searchType || "all",
              query: searchQuery || "",
              startDate,
              endDate,
            };

      const nextType = norm.type ?? "all";
      const nextQuery = norm.query ?? "";
      const nextS = norm.startDate ?? null;
      const nextE = norm.endDate ?? null;

      // ✅ 콘솔 추가
      console.group("[users] handleSearchSubmit");
      console.log("norm:", norm);
      console.log(
        "nextType:",
        nextType,
        "nextQuery:",
        nextQuery,
        "nextS:",
        nextS,
        "nextE:",
        nextE
      );
      console.groupEnd();

      // 부모 상태 동기화
      setSearchType(nextType);
      setSearchQuery(nextQuery);
      setStartDate(nextS || null);
      setEndDate(nextE || null);

      // URL 동기화(동일하면 push 생략)
      const nextQueryState = {
        tab: activeTab,
        type: nextType || "all",
        q: nextQuery || "",
        s: nextS ? nextS.toISOString().slice(0, 10) : "",
        e: nextE ? nextE.toISOString().slice(0, 10) : "",
      };

      const cur = router.query || {};
      const isSame =
        (cur.tab ?? "list") === (nextQueryState.tab ?? "list") &&
        (cur.type ?? "all") === nextQueryState.type &&
        (cur.q ?? "") === nextQueryState.q &&
        (cur.s ?? "") === nextQueryState.s &&
        (cur.e ?? "") === nextQueryState.e;

      if (!isSame) {
        router.push(
          { pathname: router.pathname, query: { ...cur, ...nextQueryState } },
          undefined,
          { shallow: true }
        );
      }

      // 상단 상태 표시
      setSharedLoading(true);
      setSharedError("");
      setError("");

      // ✅ 콘솔 추가: 증가 전/후
      console.log("[users] before ++ searchSyncKeyList");
      setSearchSyncKeyList((k) => {
        const next = k + 1;
        console.log("[users] searchSyncKeyList ->", next);
        return next;
      });

      // 즉시 로딩표시 해제(컨테이너는 표시만 담당, 실제 로딩은 UserTable이 처리)
      setSharedLoading(false);
    },
    [
      router,
      router.query,
      activeTab,
      searchType,
      searchQuery,
      startDate,
      endDate,
      normalizeSearchPayload,
    ]
  );

  // 최초 1회 자동 조회
  const didInitialFetchRef = useRef(false);
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    if (!router.isReady) return;
    if (!user || user.role !== "admin") return;

    didInitialFetchRef.current = true;

    handleSearchSubmit({
      __submit: true,
      type: searchType || "all",
      query: searchQuery || "",
      startDate,
      endDate,
    });
  }, [
    router.isReady,
    user,
    user?.role,
    handleSearchSubmit,
    searchType,
    searchQuery,
    startDate,
    endDate,
  ]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  // 테이블이 검색조건 변경 시 리마운트 없이 내부 fetch를 하도록 key는 비교적 단순하게 유지
  const tableKey = [
    activeTab,
    startDate ? startDate.toISOString().slice(0, 10) : "",
    endDate ? endDate.toISOString().slice(0, 10) : "",
    searchSyncKeyList,
  ].join("|");

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout pageTitle="사용자관리">
        <div>
        {/* 상단 패널 + 검색 */}
        <AdminTopPanels
          stats={[{ title: "사용자 수", value: `${totalUsers}명` }]}
          searchComponent={
            <AdminSearchFilter
              searchType={searchType}
              setSearchType={setSearchType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              searchOptions={[
                { value: "all", label: "전체", type: "text" },
                { value: "username", label: "이름", type: "text" },
                { value: "email", label: "이메일", type: "text" },
                { value: "phone", label: "전화번호", type: "text" },
                { value: "role", label: "권한", type: "text" },
                { value: "created_at", label: "생성일자", type: "date" },
                { value: "courseCount", label: "수강횟수", type: "number" },
                { value: "paymentTotal", label: "결제합계", type: "amount-op" }, // ≥/≤/＝+숫자
                {
                  value: "pointBalance",
                  label: "잔여포인트",
                  type: "amount-op",
                }, // ≥/≤/＝+숫자
                { value: "couponBalance", label: "잔여쿠폰", type: "number" }, // 숫자 스피너
                { value: "inquiryCount", label: "문의내역", type: "text" },
              ]}
              onSearchClick={(payload) => {
                const norm = normalizeSearchPayload(payload); // 🔵 ref 기반으로 안정화
                handleSearchSubmit({ __submit: true, ...norm });
              }}
            />
          }
          excel={{
            visible: true,
            fileName: activeTab === "list" ? "회원목록" : "사용자별_구매내역",
            sheetName: activeTab === "list" ? "회원목록" : "사용자요약",
            headers:
              activeTab === "list" ? excelList.headers : excelSummary.headers,
            data: activeTab === "list" ? excelList.data : excelSummary.data,
          }}
          actions={[
            {
              label: "포인트 지급",
              color: "blue",
              onClick: () => {
                if (selectedIds.length === 0) {
                  showAlert("지급 대상을 먼저 선택해 주세요.");
                  return;
                }
                setOpenPointGrantSignal((s) => s + 1); // 🔵 모달 열기 신호
              },
            },
            {
              label: "쿠폰 지급",
              color: "yellow",
              onClick: () => {
                if (selectedIds.length === 0) {
                  showAlert("지급 대상을 먼저 선택해 주세요.");
                  return;
                }
                setOpenCouponGrantSignal((s) => s + 1); // 🔵 모달 열기 신호
              },
            },
            {
              label: "쿠폰 관리",
              color: "green",
              onClick: () => setOpenCouponManageSignal((s) => s + 1), // ✅ 신호 발생
            },
            {
              label: "미답변문의",
              color: "red",
              onClick: () => setOpenUnansweredModal(true),
            }, // ✅ 추가
          ]}
        />

        {/* 탭 UI */}
        {/* 탭 UI */}
        <div className="users-tab-row">
          <button
            onClick={() => {
              const nextQueryState = {
                tab: "list",
                type: searchType || "all",
                q: searchQuery || "",
                s: startDate ? startDate.toISOString().slice(0, 10) : "",
                e: endDate ? endDate.toISOString().slice(0, 10) : "",
              };
              const cur = router.query || {};
              const isSame =
                (cur.tab ?? "list") === nextQueryState.tab &&
                (cur.type ?? "all") === nextQueryState.type &&
                (cur.q ?? "") === nextQueryState.q &&
                (cur.s ?? "") === nextQueryState.s &&
                (cur.e ?? "") === nextQueryState.e;

              if (!isSame) {
                router.push(
                  {
                    pathname: router.pathname,
                    query: { ...cur, ...nextQueryState },
                  },
                  undefined,
                  { shallow: true }
                );
              } else {
                setActiveTab("list");
              }
            }}
            style={activeTab === "list" ? tabActiveStyle : tabStyle}
          >
            목록
          </button>

          <button
            onClick={() => {
              router.push(
                {
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    tab: "summary",
                    type: searchType || "all",
                    q: searchQuery || "",
                    s: startDate ? startDate.toISOString().slice(0, 10) : "",
                    e: endDate ? endDate.toISOString().slice(0, 10) : "",
                  },
                },
                undefined,
                { shallow: true }
              );
            }}
            style={activeTab === "summary" ? tabActiveStyle : tabStyle}
          >
            구매내역
          </button>
        </div>

        <style jsx>{`
          /* 데스크톱(>=768px): 기존 flex 유지 */
          @media (min-width: 768px) {
            .users-tab-row {
              display: flex;
              gap: 8px;
              margin-bottom: 16px;
            }
            .users-tab-row > button {
              width: auto;
            }
          }
          /* 폰(<768px): 2열 grid로 반반 */
          @media (max-width: 767px) {
            .users-tab-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 16px;
              width: 100%;
            }
            .users-tab-row > button {
              width: 100%;
            }
          }
        `}</style>

        {sharedLoading && <p>불러오는 중...</p>}
        {(sharedError || error) && (
          <p style={{ color: "red" }}>{sharedError || error}</p>
        )}

        {/* 로딩 중에는 테이블 렌더 금지 */}
        {!sharedLoading && !sharedError && !error && (
          <UserTable
            key={tableKey}
            isActive={true}
            onLoaded={handleLoaded}
            useExternalToolbar={true}
            externalSearchType={searchType}
            externalSearchQuery={searchQuery}
            externalStartDate={startDate}
            externalEndDate={endDate}
            searchSyncKey={searchSyncKeyList}
            onExcelData={activeTab === "list" ? setExcelList : setExcelSummary}
            onSelectionChange={setSelectedIds}
            onResetPassword={async (user) => {
              try {
                const res = await api.put(
                  `/admin/users/${user.id}/reset-password`
                );
                if (!res.data?.success) throw new Error("초기화 실패");
                return res.data; // { success: true, message: "비밀번호가 [1234]로 초기화되었습니다." }
              } catch (err) {
                throw err;
              }
            }}
            disableFetch={false}
            activeTab={activeTab}
            couponTemplates={couponTemplates}
            openPointGrantSignal={openPointGrantSignal}
            openCouponGrantSignal={openCouponGrantSignal}
            openCouponManageSignal={openCouponManageSignal} // ✅ 전달
          />
        )}
      </div>
      {/* 빠른작업: 미답변문의 모달 */}
      {openUnansweredModal && (
        <UnansweredInquiriesModal
          open={openUnansweredModal}
          onClose={() => setOpenUnansweredModal(false)}
        />
      )}
    </AdminLayout>
    </>
  );
}

// 스타일
const tabStyle = {
  padding: "8px 16px",
  backgroundColor: "#f5f5f5",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
};
const tabActiveStyle = {
  ...tabStyle,
  backgroundColor: "#0070f3",
  color: "white",
  fontWeight: "bold",
};
