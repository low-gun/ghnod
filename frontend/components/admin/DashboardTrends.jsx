import React from "react";
import dynamic from "next/dynamic";

const ChartImpl = dynamic(() => import("./UPlotLineImpl"), { ssr: false });


export default function DashboardTrends({
  salesTrend,
  userTrend,
  chartsGrid,
  chartCard,
  chartTitle,
}) {
  return (
    <div style={chartsGrid}>
      <div style={chartCard}>
        <div style={chartTitle}>매출 추이</div>
        <div style={{ width: "100%", height: 180 }}>
        <ChartImpl
  data={salesTrend}
  xKey="date"
  yKey="amount"
  color="#3b82f6"
  formatValue={(v) => `${Number(v).toLocaleString()}원`}
  height={180}
/>


        </div>
      </div>

      <div style={chartCard}>
        <div style={chartTitle}>가입자 추이</div>
        <div style={{ width: "100%", height: 180 }}>
        <ChartImpl
  data={userTrend}
  xKey="date"
  yKey="count"
  color="#10b981"
  formatValue={(v) => `${v}명`}
  height={180}
/>


        </div>
      </div>
    </div>
  );
}
