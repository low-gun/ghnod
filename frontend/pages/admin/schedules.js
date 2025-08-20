import { useEffect, useState, useContext, useMemo } from "react";
import { useRouter } from "next/router";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";
import SchedulesTable from "@/components/admin/SchedulesTable";

import api from "@/lib/api";
import { UserContext } from "@/context/UserContext";

export default function AdminSchedulesPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  // ── 권한 가드(훅 순서 보장)
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);
  const isBlocked = !user || (user && user.role !== "admin");

  // ── 상단 현황(필요 최소 호출만 유지)
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  // ▼ 추가: 진행중/7일 내/이번 달
  const [inProgressCount, setInProgressCount] = useState(0);
  const [within7Count, setWithin7Count] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [inProgressOnly, setInProgressOnly] = useState(false); // 진행중 전용 플래그
  const [activeStatKey, setActiveStatKey] = useState("all"); // ← 선택 칩 상태

  const pickTotal = (res) =>
    res?.data?.total ??
    res?.data?.totalCount ??
    res?.data?.pagination?.total ??
    (Array.isArray(res?.data?.schedules) ? res.data.schedules.length : 0);

  useEffect(() => {
    let alive = true;

    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      const Y = d.getFullYear();
      const M = pad(d.getMonth() + 1);
      const D = pad(d.getDate());
      return `${Y}-${M}-${D}`;
    };
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };
    const today = new Date();
    const todayStr = fmt(today);
    const plus7Str = fmt(addDays(today, 7));
    const monthStartStr = fmt(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const monthEndStr = fmt(
      new Date(today.getFullYear(), today.getMonth() + 1, 0)
    );

    async function load() {
      try {
        const [rTotal, rActive, rToday, r7days, rMonth] = await Promise.all([
          api.get("admin/schedules", { params: { page: 1, pageSize: 1 } }),
          api.get("admin/schedules", {
            params: { page: 1, pageSize: 1, is_active: 1 },
          }),
          // 진행중(정확): start_date ≤ today ≤ end_date
          api.get("admin/schedules", {
            params: { page: 1, pageSize: 1, in_progress: 1 },
          }),
          // 7일 내 시작
          api.get("admin/schedules", {
            params: {
              page: 1,
              pageSize: 1,
              start_date: todayStr,
              end_date: plus7Str,
            },
          }),
          // 이번 달 시작
          api.get("admin/schedules", {
            params: {
              page: 1,
              pageSize: 1,
              start_date: monthStartStr,
              end_date: monthEndStr,
            },
          }),
        ]);
        if (!alive) return;

        setTotalCount(Number(pickTotal(rTotal)) || 0);
        setActiveCount(Number(pickTotal(rActive)) || 0);
        setInProgressCount(Number(pickTotal(rToday)) || 0);
        setWithin7Count(Number(pickTotal(r7days)) || 0);
        setMonthCount(Number(pickTotal(rMonth)) || 0);
      } catch {
        if (!alive) return;
        setTotalCount(0);
        setActiveCount(0);
        setInProgressCount(0);
        setWithin7Count(0);
        setMonthCount(0);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // ── 상단 검색(결제 페이지 동일 패턴)
  const [typeOptions, setTypeOptions] = useState([]);
  useEffect(() => {
    api
      .get("admin/schedules/types")
      .then((res) => {
        if (res.data?.success) {
          setTypeOptions(res.data.types.map((t) => ({ value: t, label: t })));
        }
      })
      .catch(() => {});
  }, []);

  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSyncKey, setSearchSyncKey] = useState(0);
  const [startDate, setStartDate] = useState(null); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(null);

  // ── 상단 엑셀 (테이블에서 올려받음)
  const [excelData, setExcelData] = useState({ headers: [], data: [] });

  const stats = useMemo(
    () => [
      {
        title: "일정 현황",
        value: [
          { label: `총 ${totalCount}건`, key: "all" },
          { label: `진행중 ${inProgressCount}건`, key: "today" },
          { label: `7일 내 ${within7Count}건`, key: "7days" },
          { label: `이번 달 ${monthCount}건`, key: "month" },
        ],
      },
    ],
    [totalCount, inProgressCount, within7Count, monthCount]
  );

  const handleStatClick = (key) => {
    // 날짜 헬퍼
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };

    const today = new Date();
    const todayStr = fmt(today);
    const plus7Str = fmt(addDays(today, 7));
    const monthStartStr = fmt(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const monthEndStr = fmt(
      new Date(today.getFullYear(), today.getMonth() + 1, 0)
    );

    if (key === "all") {
      setInProgressOnly(false);
      setSearchType("title");
      setSearchQuery("");
      setStartDate(null);
      setEndDate(null);
    } else if (key === "today") {
      // 진행중 = 서버 in_progress=1, UI는 기간 탭으로 표시
      setInProgressOnly(true);
      setSearchType("start_date"); // ← 기간으로 전환
      setSearchQuery("");
      setStartDate(null);
      setEndDate(null);
    } else if (key === "7days") {
      setInProgressOnly(false);
      setSearchType("start_date");
      setSearchQuery("");
      setStartDate(todayStr);
      setEndDate(plus7Str);
    } else if (key === "month") {
      setInProgressOnly(false);
      setSearchType("start_date");
      setSearchQuery("");
      setStartDate(monthStartStr);
      setEndDate(monthEndStr);
    }
    setActiveStatKey(key); // ← 추가
    setSearchSyncKey((k) => k + 1);
  };

  if (isBlocked) return null;

  return (
    <AdminLayout pageTitle="📅 교육일정">
      <AdminTopPanels
        stats={stats}
        onStatClick={handleStatClick}
        searchComponent={
          <AdminSearchFilter
            searchType={searchType}
            setSearchType={setSearchType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOptions={[
              { value: "title", label: "일정명", type: "text" },
              { value: "product_title", label: "상품명", type: "text" },
              {
                value: "product_type",
                label: "유형",
                type: "select",
                options: typeOptions,
              },
              { value: "start_date", label: "기간", type: "date" },
              { value: "instructor", label: "강사", type: "text" },
              { value: "price", label: "가격", type: "text" },
              {
                value: "is_active",
                label: "활성화 상태",
                type: "select",
                options: [
                  { value: "1", label: "활성" },
                  { value: "0", label: "비활성" },
                ],
              },
              { value: "created_at", label: "등록일시", type: "date" },
              { value: "updated_at", label: "수정일시", type: "date" },
            ]}
            onSearchClick={(nextQuery) => {
              // 수동 검색 시 진행중 플래그 해제
              setInProgressOnly(false);
              if (typeof nextQuery === "string") {
                setSearchQuery(nextQuery);
              }
              setSearchSyncKey((k) => k + 1); // 버튼 눌러야 검색
            }}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        }
        excel={{
          visible: true, // 상단 엑셀 버튼 on
          fileName: "교육일정",
          sheetName: "Schedules",
          headers: excelData.headers,
          data: excelData.data,
        }}
        actions={[
          {
            label: "+ 등록",
            color: "blue",
            onClick: () => router.push("/admin/schedules/new"),
          },
          {
            label: "- 삭제",
            color: "red",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("schedules:deleteSelected")
                );
              }
            },
          },
        ]}
      />

      <SchedulesTable
        useExternalToolbar={true}
        externalSearchType={searchType}
        externalSearchQuery={searchQuery}
        externalStartDate={startDate}
        externalEndDate={endDate}
        externalInProgress={inProgressOnly} // 진행중 플래그 전달
        searchSyncKey={searchSyncKey}
        onExcelData={setExcelData}
      />
    </AdminLayout>
  );
}
