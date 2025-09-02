// /frontend/components/admin/AdminDashboard.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const UnansweredInquiriesModal = dynamic(
  () => import("@/components/admin/UnansweredInquiriesModal"),
  { ssr: false, loading: () => null }
);
const UserPointGrantModal = dynamic(
  () => import("@/components/admin/UserPointGrantModal.jsx"),
  { ssr: false, loading: () => null }
);
const UserCouponGrantModal = dynamic(
  () => import("@/components/admin/UserCouponGrantModal.jsx"),
  { ssr: false, loading: () => null }
);

const DashboardTrends = dynamic(
  () => import("@/components/admin/DashboardTrends"),
  { ssr: false, loading: () => <div style={{padding:12,textAlign:"center"}}>차트 불러오는 중…</div> }
);
// 날짜 유틸
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export default function AdminDashboard() {
  const router = useRouter();

  // 기간 상태(전역 필터): today | 7d | 30d | month
  const todayDate = useMemo(() => new Date(), []);
  const [rangeKey, setRangeKey] = useState("month");
  const [startDate, setStartDate] = useState(fmt(startOfMonth(todayDate)));
  const [endDate, setEndDate] = useState(fmt(endOfMonth(todayDate)));

  // KPI
  const [kpiTodayOrders, setKpiTodayOrders] = useState(0);
  const [kpiTodayRevenue, setKpiTodayRevenue] = useState(0);
  const [kpiMonthRevenue, setKpiMonthRevenue] = useState(0);
  const [kpiInProgress, setKpiInProgress] = useState(0);
  const [kpiWithin7, setKpiWithin7] = useState(0);
  const [kpiUnanswered, setKpiUnanswered] = useState(0);

  // 최근 항목
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  // 시각화 데이터
  const [salesTrend, setSalesTrend] = useState([]);
  const [userTrend, setUserTrend] = useState([]);

  // 모달
  const [showPointGrant, setShowPointGrant] = useState(false);
  const [showCouponGrant, setShowCouponGrant] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);

  // 칩(상단 KPI) 선택 표시
  const [activeStatKey, setActiveStatKey] = useState("all");

  // 기간 프리셋 적용 (과거 기준)
  const applyRange = useCallback((key) => {
    const end = new Date();
    if (key === "today") {
      const t = fmt(end);
      setStartDate(t);
      setEndDate(t);
    } else if (key === "7d") {
      const start = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate() - 6
      );
      setStartDate(fmt(start));
      setEndDate(fmt(end));
    } else if (key === "30d") {
      const start = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate() - 29
      );
      setStartDate(fmt(start));
      setEndDate(fmt(end));
    } else {
      setStartDate(fmt(startOfMonth(end)));
      setEndDate(fmt(endOfMonth(end)));
    }
    setRangeKey(key);
  }, []);

  // KPI/리스트/시각화 로드
  useEffect(() => {
    const load = async () => {
      try {
        const t = fmt(todayDate);
        const plus7 = fmt(
          new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            todayDate.getDate() + 7
          )
        );
        const mStart = fmt(startOfMonth(todayDate));
        const mEnd = fmt(endOfMonth(todayDate));

        // 오늘 결제/매출
        const rToday = await api.get("admin/payments", {
          params: {
            page: 1,
            pageSize: 1,
            type: "created_at",
            start_date: t,
            end_date: t,
          },
        });
        setKpiTodayOrders(Number(rToday.data?.totalCount || 0));
        setKpiTodayRevenue(Number(rToday.data?.totalAmount || 0));

        // 이번 달 매출
        const rMonth = await api.get("admin/payments", {
          params: {
            page: 1,
            pageSize: 1,
            type: "created_at",
            start_date: mStart,
            end_date: mEnd,
          },
        });
        setKpiMonthRevenue(Number(rMonth.data?.totalAmount || 0));

        // 진행중 일정 / 7일 내 시작
        const [rProg, r7] = await Promise.all([
          api.get("admin/schedules", {
            params: { page: 1, pageSize: 1, in_progress: 1 },
          }),
          api.get("admin/schedules", {
            params: { page: 1, pageSize: 1, start_date: t, end_date: plus7 },
          }),
        ]);
        setKpiInProgress(
          Number(rProg.data?.totalCount ?? (rProg.data?.schedules?.length || 0))
        );
        setKpiWithin7(
          Number(r7.data?.totalCount ?? (r7.data?.schedules?.length || 0))
        );

        // 미답변 문의 수
        const rUn = await api.get("admin/inquiries", {
          params: { page: 1, pageSize: 1, status: "unanswered" },
        });
        setKpiUnanswered(Number(rUn.data?.totalCount || 0));

        // 최근 5건
        const [rPayList, rUserList, rUpcoming] = await Promise.all([
          api.get("admin/payments", {
            params: {
              page: 1,
              pageSize: 5,
              sort: "created_at",
              order: "desc",
              type: "created_at",
              start_date: startDate,
              end_date: endDate,
            },
          }),
          api.get("admin/users", {
            params: {
              page: 1,
              pageSize: 5,
              sort: "created_at",
              order: "desc",
              type: "created_at",
              start_date: startDate,
              end_date: endDate,
            },
          }),
          api.get("admin/schedules", {
            params: {
              page: 1,
              pageSize: 5,
              start_date: fmt(todayDate),
              end_date: endDate,
              sortKey: "start_date",
              sortDir: "asc",
            },
          }),
        ]);
        setRecentPayments(rPayList.data?.payments || []);
        setRecentUsers(rUserList.data?.users || []);
        setUpcomingSchedules(rUpcoming.data?.schedules || []);

        // 매출 추이 (최근 30일)
        const trendEnd = fmt(todayDate);
        const trendStart = fmt(
          new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            todayDate.getDate() - 29
          )
        );
        const rTrend = await api.get("admin/payments", {
          params: {
            page: 1,
            pageSize: 1000,
            sort: "created_at",
            order: "asc",
            type: "created_at",
            start_date: trendStart,
            end_date: trendEnd,
          },
        });
        const list = rTrend.data?.payments || [];
        const grouped = {};
        list.forEach((p) => {
          const day = (p.created_at || "").slice(0, 10);
          grouped[day] = (grouped[day] || 0) + Number(p.amount || 0);
        });
        const trendData = Object.keys(grouped)
          .sort()
          .map((day) => ({ date: day, amount: grouped[day] }));
        setSalesTrend(trendData);

        // 가입자 추이 (최근 30일)
        const rUsersTrend = await api.get("admin/users", {
          params: {
            page: 1,
            pageSize: 1000,
            sort: "created_at",
            order: "asc",
            type: "created_at",
            start_date: trendStart,
            end_date: trendEnd,
          },
        });
        const usersList = rUsersTrend.data?.users || [];
        const uGrouped = {};
        usersList.forEach((u) => {
          const day = (u.created_at || "").slice(0, 10);
          uGrouped[day] = (uGrouped[day] || 0) + 1;
        });
        const uTrendData = Object.keys(uGrouped)
          .sort()
          .map((day) => ({ date: day, count: uGrouped[day] }));
        setUserTrend(uTrendData);
      } catch (e) {
        console.warn("[AdminDashboard] load failed:", e?.message);
      }
    };
    load();
  }, [startDate, endDate, todayDate]);

  // 상단 KPI 칩
  const stats = useMemo(
    () => [
      {
        title: "대시보드",
        value: [
          { label: `오늘 결제 ${kpiTodayOrders}건`, key: "todayOrders" },
          {
            label: `오늘 매출 ${kpiTodayRevenue.toLocaleString()}원`,
            key: "todayRevenue",
          },
          {
            label: `이번 달 매출 ${kpiMonthRevenue.toLocaleString()}원`,
            key: "monthRevenue",
          },
          { label: `진행중 일정 ${kpiInProgress}건`, key: "inProgress" },
          { label: `7일 내 시작 ${kpiWithin7}건`, key: "within7" },
          { label: `미답변 문의 ${kpiUnanswered}건`, key: "unanswered" },
        ],
      },
    ],
    [
      kpiTodayOrders,
      kpiTodayRevenue,
      kpiMonthRevenue,
      kpiInProgress,
      kpiWithin7,
      kpiUnanswered,
    ]
  );

  const handleStatClick = useCallback(
    (key) => {
      setActiveStatKey(key);
      if (key === "inProgress") {
        router.push({
          pathname: "/admin/schedules",
          query: { stat: "inProgress" },
        });
      } else if (key === "within7") {
        router.push({ pathname: "/admin/schedules", query: { range: "7d" } });
      } else if (key === "unanswered") {
        setShowUnanswered(true);
      } else if (key === "todayOrders" || key === "todayRevenue") {
        router.push({ pathname: "/admin/payments", query: { range: "today" } });
      } else if (key === "monthRevenue") {
        router.push({ pathname: "/admin/payments", query: { range: "month" } });
      }
    },
    [router]
  );

  // 기간 칩
  const rangeChips = (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {[
        { key: "today", label: "오늘" },
        { key: "7d", label: "최근 7일" },
        { key: "30d", label: "최근 30일" },
        { key: "month", label: "이번 달" },
      ].map((c) => (
        <button
          key={c.key}
          onClick={() => applyRange(c.key)}
          style={{
            padding: "6px 10px",
            border:
              rangeKey === c.key ? "2px solid #3b82f6" : "1px solid #e5e7eb",
            background: rangeKey === c.key ? "#f0f7ff" : "#fff",
            color: rangeKey === c.key ? "#1e40af" : "#374151",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <AdminTopPanels
        stats={stats}
        onStatClick={handleStatClick}
        activeKey={activeStatKey}
        searchComponent={rangeChips}
        actions={[
          {
            label: "일정 등록",
            color: "blue",
            onClick: () => router.push("/admin/schedules/new"),
          },
          {
            label: "상품 등록",
            color: "green",
            onClick: () => router.push("/admin/products/new"),
          },
          {
            label: "포인트 지급",
            color: "yellow",
            onClick: () => setShowPointGrant(true),
          },
          {
            label: "쿠폰 지급",
            color: "red",
            onClick: () => setShowCouponGrant(true),
          },
          {
            label: "미답변 문의",
            color: "custom",
            onClick: () => setShowUnanswered(true),
          },
          
        ]}
        excel={{ visible: false }}
      />

      {/* 작업 큐 */}
      <section style={sectionBox}>
        <h3 style={sectionTitle}>작업 큐</h3>
        <div style={grid2}>
          <AlertItem
            title="미답변 문의"
            value={`${kpiUnanswered}건`}
            onClick={() => setShowUnanswered(true)}
            highlight={kpiUnanswered > 0}
          />
          <AlertItem
            title="진행중 일정"
            value={`${kpiInProgress}건`}
            onClick={() => router.push("/admin/schedules")}
            highlight={kpiInProgress > 0}
          />
        </div>
      </section>

      {/* 최근 항목: 결제 */}
      <section style={sectionBox}>
        <h3 style={sectionTitle}>최근 결제</h3>
        <MiniTable
          columns={["ID", "사용자", "금액", "일시"]}
          rows={(recentPayments || []).map((p) => [
            p.payment_id ?? p.id,
            p.username ?? "-",
            `${Number(p.amount || 0).toLocaleString()}원`,
            toLocal(p.created_at),
          ])}
          emptyText="최근 결제가 없습니다."
        />
      </section>

      {/* 최근 항목: 가입 */}
      <section style={sectionBox}>
        <h3 style={sectionTitle}>최근 가입</h3>
        <MiniTable
          columns={["ID", "이름", "이메일", "가입일"]}
          rows={(recentUsers || []).map((u) => [
            u.id,
            u.username ?? "-",
            u.email ?? "-",
            toLocal(u.created_at),
          ])}
          emptyText="최근 가입한 사용자가 없습니다."
        />
      </section>

      {/* 최근 항목: 일정 */}
      <section style={sectionBox}>
        <h3 style={sectionTitle}>다가오는 일정</h3>
        <MiniTable
          columns={["ID", "일정명", "상품", "시작일"]}
          rows={(upcomingSchedules || []).map((s) => [
            s.id,
            s.title ?? "-",
            s.product_title ?? "-",
            (s.start_date || "").slice(0, 10),
          ])}
          emptyText="예정된 일정이 없습니다."
        />
      </section>

     {/* 시각화: 매출/가입 추이 (그리드 카드) */}
     <section style={sectionBox}>
  <h3 style={sectionTitle}>최근 30일 추이</h3>
  <DashboardTrends
    salesTrend={salesTrend}
    userTrend={userTrend}
    chartsGrid={chartsGrid}
    chartCard={chartCard}
    chartTitle={chartTitle}
  />
</section>

      {/* 모달 */}
      {showUnanswered && (
  <UnansweredInquiriesModal
    open={showUnanswered}
    onClose={() => setShowUnanswered(false)}
  />
)}

{showPointGrant && (
  <UserPointGrantModal
    selectedIds={[]}
    onClose={() => setShowPointGrant(false)}
    onSuccess={() => setShowPointGrant(false)}
  />
)}

{showCouponGrant && (
  <UserCouponGrantModal
    selectedIds={[]}
    couponTemplates={[]}
    onClose={() => setShowCouponGrant(false)}
    onSuccess={() => setShowCouponGrant(false)}
  />
)}

    </div>
  );
}

/* 보조 컴포넌트/유틸 */
function AlertItem({ title, value, onClick, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: highlight ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        background: highlight ? "#f0f7ff" : "#fff",
        color: highlight ? "#1e40af" : "#111827",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
        {title}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>
        {value}
      </div>
    </div>
  );
}

function MiniTable({ columns, rows, emptyText }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed #d0d7de",
          background: "#fafbfc",
          color: "#57606a",
          padding: "14px 12px",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        {emptyText}
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 14,
        }}
      >
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  textAlign: "center",
                  padding: "8px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "8px 10px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                  title={String(cell ?? "")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sectionBox = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  marginBottom: 12,
  textAlign: "center"
};
const sectionTitle = {
  fontSize: 15,
  fontWeight: 700,
  margin: "0 0 10px 0",
  color: "#111827",
  textAlign: "center",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

// KST 기준 시간 표시
function toLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const chartsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
  alignItems: "stretch",
};

const chartCard = {
  border: "1px solid #eef2f7",
  borderRadius: 10,
  background: "#fafcff",
  padding: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
};

const chartTitle = {
  textAlign: "center",
  fontSize: 13,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 6,
};