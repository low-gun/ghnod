import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function AdminDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState({
    userCount: 0,
    todayOrders: 0,
    totalRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    todayVisitors: 0,
    newUsersThisMonth: 0,
    topProducts: [],
    paymentRevenue: 0,
    recentOrders: [],
    recentInquiries: [],
    recentReviews: [],
    alertMessage: "",
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/admin/dashboard-summary");
        setSummary(res.data);
      } catch (err) {
        console.error("대시보드 요약 데이터 불러오기 실패:", err);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div
      style={{ padding: 32, backgroundColor: "#f5f7fa", minHeight: "100vh" }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 28,
          color: "#111",
        }}
      >
        📊 관리자 대시보드
      </h2>

      {/* 요약 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <SummaryCard title="오늘 주문 수" value={`${summary.todayOrders}건`} />
        <SummaryCard
          title="월간 매출액"
          value={`${formatPrice(summary.monthRevenue)}원`}
        />
        <SummaryCard
          title="주간 매출액"
          value={`${formatPrice(summary.weekRevenue)}원`}
        />
        <SummaryCard
          title="총 매출액(매출/결제)"
          value={`${formatPrice(summary.totalRevenue)}원 / ${formatPrice(summary.paymentRevenue)}원`}
        />
        <SummaryCard
          title="오늘 방문자 수 (IP기준)"
          value={
            typeof summary.todayVisitors === "number"
              ? `${summary.todayVisitors.toLocaleString()}명`
              : "-명"
          }
        />
        <SummaryCard
          title="가입자 수(월/전체)"
          value={`${summary.newUsersThisMonth.toLocaleString()}명 / ${summary.userCount.toLocaleString()}명 `}
        />
      </div>

      {/* 판매량 TOP5 */}
      {summary.topProducts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            🔥 인기 상품 Top 5
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {summary.topProducts.map((p) => (
              <div
                key={p.productId}
                onClick={() => router.push(`/admin/schedules/${p.productId}`)}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {p.total_sold}건 판매
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 내역 */}
      <div
        style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}
      >
        <RecentListCard
          title="최근 주문"
          items={summary.recentOrders.map((o) => ({
            id: o.orderId,
            title: `#${o.orderId} - ${o.username}`,
            created_at: o.created_at,
            href: `/orders/${o.orderId}`,
          }))}
        />
        <RecentListCard
          title="최근 문의"
          items={summary.recentInquiries.map((q) => ({
            id: q.id,
            title: q.title,
            created_at: q.created_at,
            href: null,
            status: q.status,
          }))}
        />
        <RecentListCard
          title="최근 리뷰"
          items={summary.recentReviews.map((r) => ({
            id: r.id,
            title: r.comment,
            created_at: r.created_at,
            href: `/admin/products`,
          }))}
        />
      </div>

      {/* 알림 */}
      {summary.alertMessage && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: 16,
              border: "1px solid #ffeeba",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            ⚠️ {summary.alertMessage}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: "bold", color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function RecentListCard({ title, items }) {
  const router = useRouter();
  return (
    <div
      style={{
        flex: "1 1 300px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 12, fontSize: 15 }}>
        {title}
      </div>
      <ul style={{ paddingLeft: 0, listStyle: "none", marginBottom: 12 }}>
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => item.href && router.push(item.href)}
            style={{
              fontSize: 14,
              marginBottom: 12,
              color: "#374151",
              cursor: item.href ? "pointer" : "default",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>{item.title}</div>
              {item.status && (
                <span
                  style={{
                    backgroundColor:
                      item.status === "답변완료" ? "#3b82f6" : "#f97316",
                    color: "white",
                    borderRadius: 12,
                    fontSize: 11,
                    padding: "2px 8px",
                    marginLeft: 6,
                  }}
                >
                  {item.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {new Date(item.created_at).toLocaleString("ko-KR")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
