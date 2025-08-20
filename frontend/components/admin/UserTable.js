// /frontend/components/admin/UserTable.js
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { formatLocalReadable, formatPrice } from "@/lib/format";

import AdminToolbar from "@/components/common/AdminToolbar";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import SelectableCard from "@/components/common/SelectableCard"; // ← 추가
import UserPointModal from "@/components/admin/UserPointModal";
import UserCouponModal from "@/components/admin/UserCouponModal";
import UserInquiryModal from "@/components/admin/UserInquiryModal";
import CouponTemplateModal from "@/components/admin/CouponTemplateModal";
import UserPointGrantModal from "@/components/admin/UserPointGrantModal";
import UserCouponGrantModal from "@/components/admin/UserCouponGrantModal";

import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

export default function UserTable({
  onResetPassword,
  onLoaded,
  useExternalToolbar = false,
  externalSearchType,
  externalSearchQuery,
  externalShowDeleted,
  searchSyncKey = 0,
  externalStartDate = null,
  externalEndDate = null,
  onExcelData,
  onSelectionChange,
  isActive = true,
  disableFetch = false,
  usersOverride = null,
  totalCountOverride = null,
  summaryMapOverride = null,
  activeTab = "list",
  couponTemplates,
  openPointGrantSignal, // 🔵 추가
  openCouponGrantSignal, // 🔵 추가
  openCouponManageSignal, // ✅ 추가
}) {
  const router = useRouter();
  const isTabletOrBelow = useIsTabletOrBelow();
  const listAbortRef = useRef(null);
  const summaryAbortRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isNarrow = mounted && isTabletOrBelow;

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(true);

  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [summariesMap, setSummariesMap] = useState({});
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [selectedUserForPoint, setSelectedUserForPoint] = useState(null);
  const [selectedUserForCoupon, setSelectedUserForCoupon] = useState(null);
  const [selectedUserForInquiry, setSelectedUserForInquiry] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCouponGrantModal, setShowCouponGrantModal] = useState(false);
  const [showPointGrantModal, setShowPointGrantModal] = useState(false);
  useEffect(() => {
    if (!useExternalToolbar) return;
    if (openPointGrantSignal > 0) setShowPointGrantModal(true);
  }, [openPointGrantSignal, useExternalToolbar]);

  useEffect(() => {
    if (!useExternalToolbar) return;
    if (openCouponGrantSignal > 0) setShowCouponGrantModal(true);
  }, [openCouponGrantSignal, useExternalToolbar]);

  useEffect(() => {
    if (!useExternalToolbar) return;
    if (openCouponManageSignal > 0) setShowCouponModal(true); // ✅ 쿠폰관리 모달 열기
  }, [openCouponManageSignal, useExternalToolbar]);

  const effType = useExternalToolbar ? externalSearchType : searchType;
  const effQuery = useExternalToolbar ? externalSearchQuery : searchQuery;
  const effStart = useExternalToolbar ? externalStartDate : null;
  const effEnd = useExternalToolbar ? externalEndDate : null;

  console.log("[UserTable] effective filters", {
    useExternalToolbar,
    effType,
    effQuery,
    effStart,
    effEnd,
    showDeleted,
  });
  // 탭 바뀌면 항상 1페이지부터
  useEffect(() => {
    if (!isActive || disableFetch) return;
    setCurrentPage(1);
  }, [activeTab, isActive, disableFetch]);

  // 외부 검색조건 반영
  useEffect(() => {
    if (externalSearchType !== undefined) setSearchType(externalSearchType);
    if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
    if (externalShowDeleted !== undefined) setShowDeleted(externalShowDeleted);
  }, [externalSearchType, externalSearchQuery, externalShowDeleted]);

  // override 반영
  useEffect(() => {
    if (usersOverride && Array.isArray(usersOverride)) {
      setUsers(usersOverride);
      setIsInitialLoading(false);
      setIsFetching(false);
      setLoadError("");
    }
    if (typeof totalCountOverride === "number") {
      setTotalCount(totalCountOverride);
    }
  }, [usersOverride, totalCountOverride]);

  const normalizeDate = (d) =>
    d instanceof Date ? d.toISOString().slice(0, 10) : d || undefined;

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize]
  );

  const getSummaryByUser = useCallback(
    (u) => {
      const ov =
        summaryMapOverride?.[u.id] ?? summaryMapOverride?.[`user-${u.id}`];
      if (ov) return ov;
      return summariesMap[u.id] ?? {};
    },
    [summaryMapOverride, summariesMap]
  );

  const handleSelectAll = useCallback(
    (e) => {
      const next = e.target.checked ? users.map((u) => u.id) : [];
      setSelectedIds(next);
      if (typeof onSelectionChange === "function") onSelectionChange(next);
    },
    [users, onSelectionChange]
  );

  const handleSelectOne = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        if (typeof onSelectionChange === "function") onSelectionChange(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      !prev || prev.key !== key
        ? { key, direction: "asc" }
        : { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    );
    setCurrentPage(1);
  }, []);

  const handleOpenDetailClick = useCallback(
    (id) => {
      router.push(`/admin/users/${id}`);
    },
    [router]
  );

  const handleToggleUserStatus = useCallback(
    async (userId, currentDeletedFlag) => {
      setTogglingId(userId);
      try {
        await api.put(`/admin/users/${userId}/status`, {
          is_deleted: currentDeletedFlag === 0 ? 1 : 0,
        });
        showAlert("계정 상태가 변경되었습니다.");
        if (!disableFetch) {
          await fetchUsers(true);
        }
      } catch {
        showAlert("계정 상태 변경 실패");
      } finally {
        setTogglingId(null);
      }
    },
    [showAlert, disableFetch]
  );
  const handleResetPassword = useCallback(
    async (user) => {
      const ok = await showConfirm(
        `정말 "${user.username}" 사용자의 비밀번호를 초기화하시겠습니까?`
      );
      if (!ok) return;

      setConfirming(true);
      try {
        let msg = "비밀번호가 초기화되었습니다.";
        if (typeof onResetPassword === "function") {
          const result = await onResetPassword(user); // 서버 메시지 반환 기대
          if (result?.message) msg = result.message;
        }
        showAlert(msg);
      } catch (e) {
        showAlert("비밀번호 초기화 실패");
        throw e;
      } finally {
        setConfirming(false);
      }
    },
    [onResetPassword, showAlert, showConfirm]
  );

  const fetchUsers = async (silent = false, signal) => {
    // ✅ effective 값 기반으로 찍기
    const sortKey = sortConfig?.key || "created_at";
    const sortDir = sortConfig?.direction || "desc";

    console.group("[UserTable] fetchUsers call");
    console.log("[UserTable] USING effective params", {
      page: currentPage,
      pageSize,
      sort: sortKey,
      order: sortDir,
      type: effType, // ✅ effective
      search: effQuery, // ✅ effective
      start_date: normalizeDate(effStart), // ✅ effective
      end_date: normalizeDate(effEnd), // ✅ effective
      showDeleted,
    });
    console.groupEnd();

    try {
      if (!silent) {
        setLoadError("");
        if (users.length === 0) setIsInitialLoading(true);
        setIsFetching(true);
      }

      const res = await api.get("admin/users", {
        params: {
          page: currentPage,
          pageSize,
          sort: sortKey,
          order: sortDir,
          // ✅ 내부/외부 경합 없이 eff*만 사용
          type: effType === "all" ? undefined : effType,
          search: effQuery,
          showDeleted,
          start_date: normalizeDate(effStart),
          end_date: normalizeDate(effEnd),
        },
        signal,
      });

      if (res.data?.success) {
        setUsers(res.data.users);
        setTotalCount(res.data.totalCount);
        if (typeof onLoaded === "function") {
          onLoaded({ type: "list", totalCount: res.data.totalCount });
        }
      } else {
        setLoadError("목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      if (
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED"
      ) {
        return;
      }
      setLoadError("사용자 목록 조회 실패");
    } finally {
      if (!silent) {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    }
  };

  const fetchSummaries = async (signal) => {
    if (disableFetch) return;

    // ✅ 요약 API는 서버에서 alias 정렬을 지원하지 않으므로 안전키만 허용
    const safeSortKeys = new Set([
      "id",
      "username",
      "email",
      "phone", // 기본
      "created_at",
      "updated_at",
      "courseCount",
      "paymentTotal",
      "pointBalance",
      "couponBalance",
      "inquiryCount",
      "inquiryStatus", // ← 추가 (미답변 우선)
    ]);

    const sortKeyRaw = sortConfig?.key || "created_at";
    const sortKeyForApi = safeSortKeys.has(sortKeyRaw)
      ? sortKeyRaw
      : "created_at";
    const sortDir =
      (sortConfig?.direction || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    // ✅ 반드시 effective 값 사용 (외부/내부 경합 제거)
    const params = {
      page: currentPage,
      pageSize,
      type: effType,
      search: effQuery,
      sort: sortKeyForApi,
      order: sortDir,
      start_date: normalizeDate(effStart),
      end_date: normalizeDate(effEnd),
      showDeleted,
    };

    console.group("[UserTable] fetchSummaries call");
    console.log("USING effective params", params);
    console.groupEnd();

    try {
      setLoadError("");
      if (users.length === 0) setIsInitialLoading(true);
      setIsFetching(true);
      setIsSummaryLoading(true);

      const res = await api.get("admin/users/summary", { params, signal });
      if (!res.data?.success) {
        console.error("[summary] fail payload:", params, "resp:", res?.data);
        throw new Error("summary fetch failed");
      }

      const summaries = res.data.summaries || [];
      const summaryMap = Object.fromEntries(
        summaries.map((s) => [Number(s.id), s])
      );
      setSummariesMap(summaryMap);

      // 동일 조건으로 목록도 호출해서 phone 등 보강 (여기도 같은 params!)
      const listRes = await api.get("admin/users", { params, signal });
      if (!listRes.data?.success)
        throw new Error("list fetch for phone failed");

      const phoneMap = Object.fromEntries(
        (listRes.data.users || []).map((u) => [Number(u.id), u.phone])
      );
      const roleMap = Object.fromEntries(
        (listRes.data.users || []).map((u) => [Number(u.id), u.role])
      );
      const createdMap = Object.fromEntries(
        (listRes.data.users || []).map((u) => [Number(u.id), u.created_at])
      );
      const updatedMap = Object.fromEntries(
        (listRes.data.users || []).map((u) => [Number(u.id), u.updated_at])
      );

      setUsers((prev) => {
        const prevMap = Object.fromEntries(prev.map((u) => [u.id, u]));
        return summaries.map((s) => ({
          id: s.id,
          username: s.username,
          email: s.email,
          phone: s.phone ?? phoneMap[s.id] ?? prevMap[s.id]?.phone ?? "",
          role: roleMap[s.id] ?? prevMap[s.id]?.role ?? "", // 🔧 보강
          is_deleted: s.is_deleted,
          created_at:
            s.created_at ??
            createdMap[s.id] ??
            prevMap[s.id]?.created_at ??
            null, // 🔧 보강
          updated_at:
            s.updated_at ??
            updatedMap[s.id] ??
            prevMap[s.id]?.updated_at ??
            null, // 🔧 보강
        }));
      });

      const tc =
        typeof res.data.totalCount === "number"
          ? res.data.totalCount
          : summaries.length;
      setTotalCount(tc);
      onLoaded?.({ type: "summary", totalCount: tc });
    } catch (err) {
      if (
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED"
      )
        return;
      setLoadError("요약 데이터 조회 실패");
    } finally {
      setIsSummaryLoading(false);
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  };

  // 검색 버튼 눌러 searchSyncKey 바뀌면: 페이지 1로 맞추고, 요약 탭이면 요약 즉시 호출
  useEffect(() => {
    if (!isActive || disableFetch) return;

    console.group("[UserTable] searchSyncKey effect");
    console.log(
      "searchSyncKey:",
      searchSyncKey,
      "activeTab:",
      activeTab,
      "currentPage:",
      currentPage
    );
    console.groupEnd();

    if (currentPage !== 1) {
      console.log("[UserTable] setCurrentPage(1) due to searchSyncKey change");
      setCurrentPage(1);
      return;
    }

    if (activeTab === "summary") {
      const controller = new AbortController();
      console.log("[UserTable] calling fetchSummaries due to searchSyncKey");
      fetchSummaries(controller.signal);
      return () => controller.abort();
    }
  }, [searchSyncKey]);

  // 목록 탭: 의존 조건 변경 시 fetch
  useEffect(() => {
    if (!isActive || disableFetch || activeTab !== "list") return;

    console.group("[UserTable] list effect");
    console.log({
      currentPage,
      pageSize,
      sortKey: sortConfig?.key,
      sortDir: sortConfig?.direction,
      showDeleted,
      searchSyncKey,
      effType,
      effQuery,
      effStart: effStart?.toString?.() || effStart,
      effEnd: effEnd?.toString?.() || effEnd,
    });
    console.groupEnd();

    if (listAbortRef.current) listAbortRef.current.abort(); // ✅ 올바른 ref
    const controller = new AbortController();
    listAbortRef.current = controller;
    fetchUsers(false, controller.signal); // ✅ 내부에서 eff* 사용
    return () => controller.abort();
  }, [
    isActive,
    disableFetch,
    activeTab,
    currentPage,
    pageSize,
    sortConfig?.key,
    sortConfig?.direction,
    showDeleted,
    searchSyncKey,
    // 굳이 effType/effQuery를 의존성에 넣지 않습니다.
    // "검색 버튼"으로만 트리거하고 싶기 때문입니다.
  ]);

  // 요약 탭: 의존 조건 변경 시 fetch
  useEffect(() => {
    if (!isActive || disableFetch || activeTab !== "summary") return;
    if (summaryAbortRef.current) summaryAbortRef.current.abort();
    const controller = new AbortController();
    summaryAbortRef.current = controller;
    fetchSummaries(controller.signal);
    return () => controller.abort();
  }, [
    isActive,
    disableFetch,
    activeTab,
    currentPage,
    pageSize,
    sortConfig?.key,
    sortConfig?.direction,
    showDeleted,
  ]);

  // 엑셀 데이터 전달
  useEffect(() => {
    if (!onExcelData || !isActive) return;
    onExcelData({
      headers: [
        "코드",
        "이름",
        "이메일",
        "전화번호",
        "권한",
        "생성일시",
        "수정일시",
        "수강횟수",
        "총 결제금액",
        "잔여포인트",
        "잔여쿠폰",
        "문의내역",
      ],
      data: users.map((u) => {
        const s = getSummaryByUser(u);
        return {
          코드: `user-${u.id}`,
          이름: u.username,
          이메일: u.email,
          전화번호: u.phone,
          권한: u.role,
          생성일시: formatLocalReadable(u.created_at),
          수정일시: formatLocalReadable(u.updated_at),
          수강횟수: s.courseCount ?? 0,
          총결제금액: s.paymentTotal ?? 0,
          잔여포인트: s.pointBalance ?? 0,
          잔여쿠폰: s.couponBalance ?? 0,
          문의내역: s.inquiryCount ?? 0,
        };
      }),
    });
  }, [users, onExcelData, isActive, getSummaryByUser]);
  useEffect(() => {
    console.group("[UserTable] props change");
    console.log({
      activeTab,
      searchSyncKey,
      externalSearchType,
      externalSearchQuery,
      externalStartDate,
      externalEndDate,
    });
    console.groupEnd();
  }, [
    activeTab,
    searchSyncKey,
    externalSearchType,
    externalSearchQuery,
    externalStartDate,
    externalEndDate,
  ]);
  // 렌더링
  // 헤더 th를 만드는 헬퍼 (정렬 가능 헤더)
  const ThSort = ({ label, keyName }) => (
    <th
      key={keyName}
      onClick={() => handleSort(keyName)}
      style={{ cursor: "pointer" }}
    >
      {label}
    </th>
  );
  // ✅ 공통 열 너비(px) — 탭 전환해도 바뀌지 않도록 고정
  const COL_W = {
    sel: 44, // 체크박스
    no: 64, // No
    code: 110, // 코드
    name: 180, // 이름
    email: 260, // 이메일
    phone: 140, // 전화번호
    // 목록 전용
    role: 110, // 권한
    created: 160, // 생성일시
    updated: 160, // 수정일시
    password: 100, // 비밀번호
    status: 96, // 상태
    // 구매내역(요약) 전용
    courseCount: 110, // 수강횟수
    paymentTotal: 130, // 결제합계
    pointBalance: 130, // 잔여포인트
    couponBalance: 110, // 잔여쿠폰
    inquiryCount: 110, // 문의내역
  };

  // ✅ 표 열 그룹: 데스크톱에서 열 너비 고정
  const renderColGroup = () => {
    // 공통 6개(체크박스, No, 코드, 이름, 이메일, 전화번호)
    const common = [
      COL_W.sel,
      COL_W.no,
      COL_W.code,
      COL_W.name,
      COL_W.email,
      COL_W.phone,
    ];
    const listExtra = [
      COL_W.role,
      COL_W.created,
      COL_W.updated,
      COL_W.password,
      COL_W.status,
    ];
    const summaryExtra = [
      COL_W.courseCount,
      COL_W.paymentTotal,
      COL_W.pointBalance,
      COL_W.couponBalance,
      COL_W.inquiryCount,
    ];

    const widths =
      activeTab === "list"
        ? [...common, ...listExtra]
        : [...common, ...summaryExtra];

    return (
      <colgroup>
        {widths.map((w, i) => (
          <col key={i} style={{ width: w, minWidth: w }} />
        ))}
      </colgroup>
    );
  };
  const renderTableHead = () => {
    if (activeTab === "list") {
      const cells = [
        <th key="sel">
          <input type="checkbox" onChange={handleSelectAll} />
        </th>,
        <th key="no">No</th>,
        <ThSort key="code" label="코드" keyName="id" />,
        <ThSort key="username" label="이름" keyName="username" />,
        <ThSort key="email" label="이메일" keyName="email" />,
        <ThSort key="phone" label="전화번호" keyName="phone" />,
        <ThSort key="role" label="권한" keyName="role" />,
        <ThSort key="created" label="생성일시" keyName="created_at" />,
        <ThSort key="updated" label="수정일시" keyName="updated_at" />,
        <th key="pw">비밀번호</th>,
        <th key="status">상태</th>,
      ];
      return <tr>{cells}</tr>;
    }

    const cells = [
      <th key="sel">
        <input type="checkbox" onChange={handleSelectAll} />
      </th>,
      <th key="no">No</th>,
      <th key="code">코드</th>,
      <ThSort key="username" label="이름" keyName="username" />,
      <ThSort key="email" label="이메일" keyName="email" />,
      <th key="phone">전화번호</th>,
      <ThSort key="courseCount" label="수강횟수" keyName="courseCount" />,
      <ThSort key="paymentTotal" label="결제합계" keyName="paymentTotal" />,
      <ThSort key="pointBalance" label="잔여포인트" keyName="pointBalance" />,
      <ThSort key="couponBalance" label="잔여쿠폰" keyName="couponBalance" />,
      <ThSort key="inquiryCount" label="문의내역" keyName="inquiryCount" />,
    ];
    return <tr>{cells}</tr>;
  };
  // 🔹 모바일/태블릿 카드 렌더러: 목록 탭
  const renderCardsList = () =>
    users.map((user, index) => {
      const id = user.id;
      const active = Number(user.is_deleted) !== 1;
      const isChecked = selectedIds.includes(id);
      return (
        <SelectableCard
          key={id}
          selected={isChecked}
          onToggle={() => handleSelectOne(id)} // ← 카드 아무 곳이나 탭 → 선택 토글
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          {/* 상단 체크박스 + 코드 + 상태토글 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleSelectOne(id)}
                onClick={(e) => e.stopPropagation()} // ← 카드 토글 방지
              />
              <span style={{ fontSize: 13, color: "#666" }}>
                #{(currentPage - 1) * pageSize + index + 1} · user-{id}
              </span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ToggleSwitch
                size="sm"
                checked={active}
                onChange={async () => {
                  const ok = await showConfirm("계정 상태를 변경하시겠습니까?");
                  if (!ok) return;
                  handleToggleUserStatus(id, Number(user.is_deleted));
                }}
                onLabel="ON"
                offLabel="OFF"
              />
            </div>
          </div>

          {/* 이름(텍스트만 클릭) */}
          <div style={{ color: "#222", fontWeight: 700, cursor: "default" }}>
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailClick(id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenDetailClick(id);
                }
              }}
              style={{
                color: "#0070f3",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {user.username}
            </span>
          </div>

          <div style={{ fontSize: 14, color: "#374151", marginTop: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
              }}
            >
              <span style={{ color: "#888" }}>이메일</span>
              <span>{user.email}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
              }}
            >
              <span style={{ color: "#888" }}>전화번호</span>
              <span>{user.phone || "-"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
              }}
            >
              <span style={{ color: "#888" }}>권한</span>
              <span>{user.role}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
              }}
            >
              <span style={{ color: "#888" }}>생성일시</span>
              <span>{formatLocalReadable(user.created_at)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
              }}
            >
              <span style={{ color: "#888" }}>수정일시</span>
              <span>{formatLocalReadable(user.updated_at)}</span>
            </div>
          </div>

          {/* 하단 액션 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 10,
            }}
          >
            <button
              onClick={() => handleResetPassword(user)}
              disabled={confirming}
              style={{
                padding: "6px 10px",
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                opacity: confirming ? 0.7 : 1,
              }}
            >
              {confirming ? "처리 중..." : "비밀번호 초기화"}
            </button>
          </div>
        </SelectableCard>
      );
    });

  // 🔹 모바일/태블릿 카드 렌더러: 요약 탭
  // ✅ PaymentsTable 카드 톤 & 목록 카드 톤으로 통일
  const renderCardsSummary = () =>
    users.map((user, index) => {
      const id = user.id;
      const s = getSummaryByUser(user);
      const active = Number(user.is_deleted) !== 1;
      const isChecked = selectedIds.includes(id);
      const row = (label, value) => (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "6px 0",
            borderBottom: "1px dashed #f0f0f0",
          }}
        >
          <span style={{ color: "#888", fontSize: 13, minWidth: 80 }}>
            {label}
          </span>
          <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>
            {value}
          </span>
        </div>
      );

      return (
        <SelectableCard
          key={id}
          selected={isChecked}
          onToggle={() => handleSelectOne(id)} // ← 카드 전체 탭=선택 토글
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            background: active ? "#fff" : "#fafafa",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          {/* 상단 체크 + 코드 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleSelectOne(id)}
              onClick={(e) => e.stopPropagation()} // ← 전파 차단
            />
            <span style={{ fontSize: 13, color: "#666" }}>
              #{(currentPage - 1) * pageSize + index + 1} · user-{id}
            </span>
          </div>

          {/* 이름(텍스트만 클릭) */}
          <div style={{ color: "#222", fontWeight: 700, cursor: "default" }}>
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailClick(id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenDetailClick(id);
                }
              }}
              style={{
                color: "#0070f3",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {user.username}
            </span>
          </div>

          {/* 기본 정보 (목록 카드와 동일 라벨/값 행) */}
          <div style={{ fontSize: 14, color: "#374151", marginTop: 6 }}>
            {row("이메일", user.email)}
            {row("전화번호", user.phone ?? summariesMap[user.id]?.phone ?? "-")}
            {row("권한", user.role)}
            {row("생성일시", formatLocalReadable(user.created_at))}
            {row("수정일시", formatLocalReadable(user.updated_at))}
          </div>

          {/* 요약 메트릭도 동일한 행 스타일로 통합 */}
          <div style={{ marginTop: 8 }}>
            {row("수강횟수", `${s.courseCount ?? 0}건`)}
            {row("결제합계", `${formatPrice(s.paymentTotal ?? 0)}원`)}
            {/* 아래 3개는 액션 가능하도록 강조(우측 클릭 영역) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserForPoint(user);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
                cursor: "pointer",
                background: "#fbfdff",
              }}
            >
              <span style={{ color: "#888", fontSize: 13, minWidth: 80 }}>
                잔여포인트
              </span>
              <span style={{ color: "#0070f3", fontSize: 14, fontWeight: 700 }}>
                {formatPrice(s.pointBalance ?? 0)}P
              </span>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserForCoupon(user);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
                cursor: "pointer",
                background: "#fbfdff",
              }}
            >
              <span style={{ color: "#888", fontSize: 13, minWidth: 80 }}>
                잔여쿠폰
              </span>
              <span style={{ color: "#0070f3", fontSize: 14, fontWeight: 700 }}>
                {s.couponBalance ?? 0}장
              </span>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserForInquiry(user);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "6px 0",
                borderBottom: "1px dashed #f0f0f0",
                cursor: "pointer",
                background: "#fbfdff",
              }}
            >
              <span style={{ color: "#888", fontSize: 13, minWidth: 80 }}>
                문의내역
              </span>
              <span style={{ color: "#0070f3", fontSize: 14, fontWeight: 700 }}>
                {s.inquiryCount ?? 0}건
              </span>
            </div>
          </div>

          {/* 하단 액션 (PaymentsTable 카드의 버튼 배열 느낌) */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              justifyContent: "flex-end",
            }}
          ></div>
        </SelectableCard>
      );
    });

  // 🔸 작은 메트릭 요소
  function Metric({ label, value, clickable = false, onClick }) {
    return (
      <div
        onClick={clickable ? onClick : undefined}
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          padding: 10,
          cursor: clickable ? "pointer" : "default",
          background: clickable ? "#fbfdff" : "#fff",
        }}
      >
        <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
        <div style={{ fontSize: 15, color: "#111", fontWeight: 700 }}>
          {value}
        </div>
      </div>
    );
  }

  const renderTableBody = () => {
    if (activeTab === "list") {
      return users.map((user, index) => {
        const active = Number(user.is_deleted) !== 1;
        return (
          <tr key={user.id} style={{ opacity: active ? 1 : 0.6 }}>
            <td>
              <input
                type="checkbox"
                checked={selectedIds.includes(user.id)}
                onChange={() => handleSelectOne(user.id)}
              />
            </td>
            <td>{(currentPage - 1) * pageSize + index + 1}</td>
            <td>user-{user.id}</td>
            <td className="admin-td">
              <span
                role="link"
                tabIndex={0}
                onClick={() => handleOpenDetailClick(user.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleOpenDetailClick(user.id);
                }}
                style={{
                  color: "#0070f3",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {user.username}
              </span>
            </td>

            <td>{user.email}</td>
            <td>{user.phone}</td>
            <td>{user.role}</td>
            <td>{formatLocalReadable(user.created_at)}</td>
            <td>{formatLocalReadable(user.updated_at)}</td>
            <td>
              <button
                style={resetButtonStyle}
                onClick={() => handleResetPassword(user)}
                disabled={confirming}
              >
                {confirming ? "처리 중..." : "초기화"}
              </button>
            </td>
            <td>
              <ToggleSwitch
                size="sm"
                checked={active}
                disabled={togglingId === user.id}
                onChange={async () => {
                  const ok = await showConfirm("계정 상태를 변경하시겠습니까?");
                  if (!ok) return;
                  handleToggleUserStatus(user.id, Number(user.is_deleted));
                }}
                onLabel="ON"
                offLabel="OFF"
              />
            </td>
          </tr>
        );
      });
    }
    return users.map((user, index) => {
      const s = getSummaryByUser(user);
      const active = Number(user.is_deleted) !== 1;
      return (
        <tr key={user.id} style={{ opacity: active ? 1 : 0.6 }}>
          <td>
            <input
              type="checkbox"
              checked={selectedIds.includes(user.id)}
              onChange={() => handleSelectOne(user.id)}
            />
          </td>
          <td>{(currentPage - 1) * pageSize + index + 1}</td>
          <td>user-{user.id}</td>
          <td className="admin-td">
            <span
              role="link"
              tabIndex={0}
              onClick={() => handleOpenDetailClick(user.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleOpenDetailClick(user.id);
              }}
              style={{
                color: "#0070f3",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {user.username}
            </span>
          </td>

          <td>{user.email}</td>
          <td>{user.phone ?? summariesMap[user.id]?.phone ?? "-"}</td>
          <td>{s.courseCount ?? 0}건</td>

          <td>{formatPrice(s.paymentTotal ?? 0)}원</td>

          <td
            className="admin-td-link"
            onClick={() => setSelectedUserForPoint(user)}
          >
            {formatPrice(s.pointBalance ?? 0)}P
          </td>
          <td
            className="admin-td-link"
            onClick={() => setSelectedUserForCoupon(user)}
          >
            {s.couponBalance ?? 0}장
          </td>
          <td
            className="admin-td-link"
            onClick={() => setSelectedUserForInquiry(user)}
          >
            {s.inquiryCount ?? 0}건
          </td>
        </tr>
      );
    });
  };

  return (
    <div>
      {/* 내부 툴바: 외부 필터 사용 시 비활성화 */}
      {!useExternalToolbar && (
        <AdminToolbar
          left={
            <AdminSearchFilter
              searchType={searchType}
              setSearchType={setSearchType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchOptions={[
                { value: "all", label: "전체", type: "text" },
                { value: "username", label: "이름", type: "text" },
                { value: "email", label: "이메일", type: "text" },
                { value: "phone", label: "전화번호", type: "text" },

                // 권한: 드롭다운
                {
                  value: "role",
                  label: "권한",
                  type: "select",
                  options: [
                    { value: "admin", label: "관리자" },
                    { value: "user", label: "회원" },
                  ],
                },

                // 수강횟수: 숫자 스테퍼(±)
                { value: "courseCount", label: "수강횟수", type: "number" },

                // 숫자(이상/이하) 조건: 결제합계, 잔여포인트
                { value: "paymentTotal", label: "결제합계", type: "number" },
                { value: "pointBalance", label: "잔여포인트", type: "number" },

                // 잔여쿠폰: 숫자 스테퍼(±)
                { value: "couponBalance", label: "잔여쿠폰", type: "number" },

                // 문의내역: 드롭다운(미답변/답변/문의없음)
                {
                  value: "inquiryStatus",
                  label: "문의내역",
                  type: "select",
                  options: [
                    { value: "unanswered", label: "미답변" },
                    { value: "answered", label: "답변" },
                    { value: "none", label: "문의없음" },
                  ],
                },
              ]}
              onSearchClick={({ type, query }) => {
                setSearchType(type);
                setSearchQuery(query);
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
                fileName="사용자_목록"
                sheetName="Users"
                headers={[
                  "코드",
                  "이름",
                  "이메일",
                  "전화번호",
                  "권한",
                  "생성일시",
                  "수정일시",
                  "수강횟수",
                  "총 결제금액",
                  "잔여포인트",
                  "잔여쿠폰",
                  "문의내역",
                ]}
                data={users.map((u) => {
                  const s = getSummaryByUser(u);
                  return {
                    코드: `user-${u.id}`,
                    이름: u.username,
                    이메일: u.email,
                    전화번호: u.phone,
                    권한: u.role,
                    생성일시: formatLocalReadable(u.created_at),
                    수정일시: formatLocalReadable(u.updated_at),
                    수강횟수: s.courseCount ?? 0,
                    총결제금액: s.paymentTotal ?? 0,
                    잔여포인트: s.pointBalance ?? 0,
                    잔여쿠폰: s.couponBalance ?? 0,
                    문의내역: s.inquiryCount ?? 0,
                  };
                })}
              />
            </>
          }
        />
      )}

      {/* 렌더 분기 */}
      {isInitialLoading ? (
        isNarrow ? (
          <div style={skeletonGridStyle}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={4} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={11} rows={6} />
        )
      ) : loadError ? (
        <div style={errorBoxStyle}>{loadError}</div>
      ) : totalCount === 0 ? (
        <div style={emptyBoxStyle}>데이터가 없습니다.</div>
      ) : (
        <>
          {activeTab === "summary" && isSummaryLoading && (
            <div
              style={{
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(0,112,243,0) 0%, rgba(0,112,243,.6) 50%, rgba(0,112,243,0) 100%)",
                animation: "barPulse 1s linear infinite",
                margin: "8px 0",
              }}
            />
          )}
          {mounted && isTabletOrBelow ? (
            // 🔹 모바일/태블릿: 카드 레이아웃
            <div style={{ display: "grid", gap: 12 }}>
              {activeTab === "list" ? renderCardsList() : renderCardsSummary()}
            </div>
          ) : (
            // 🔹 데스크톱: 테이블
            <div className="admin-table-wrap">
              <table
                className="admin-table"
                style={{ tableLayout: "fixed", width: "100%" }} // ✅ 고정 레이아웃
              >
                {renderColGroup()}
                {/* ✅ 열 너비 고정 */}
                <thead style={adminTableHeadStyle}>{renderTableHead()}</thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>
          )}
        </>
      )}

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* 모달 */}
      {showCouponModal && (
        <CouponTemplateModal onClose={() => setShowCouponModal(false)} />
      )}
      {selectedUserForPoint && (
        <UserPointModal
          user={selectedUserForPoint}
          onClose={() => setSelectedUserForPoint(null)}
          onRefresh={disableFetch ? undefined : fetchSummaries}
        />
      )}
      {selectedUserForCoupon && (
        <UserCouponModal
          user={selectedUserForCoupon}
          onClose={() => setSelectedUserForCoupon(null)}
          onRefresh={disableFetch ? undefined : fetchSummaries}
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
            if (!disableFetch) fetchSummaries();
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
            if (!disableFetch) fetchSummaries();
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}

// 스타일
const errorBoxStyle = { color: "#c53030", padding: 14 };
const resetButtonStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const adminTableHeadStyle = { background: "#f9f9f9" };
const emptyBoxStyle = { padding: 18, textAlign: "center" };
const skeletonGridStyle = { display: "grid", gap: 12 };
const actionBtnStyle = {
  padding: "8px 16px",
  fontSize: "13px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
