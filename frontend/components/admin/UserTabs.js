import { useState } from "react";
import dynamic from "next/dynamic";

const UserCoursesTab = dynamic(() => import("./UserCoursesTab"), {
  ssr: false,
  loading: () => <div>수강정보 로딩중...</div>,
});
const UserPaymentsTab = dynamic(() => import("./UserPaymentsTab"), {
  ssr: false,
  loading: () => <div>결제내역 로딩중...</div>,
});
const UserPointsTab = dynamic(() => import("./UserPointsTab"), {
  ssr: false,
  loading: () => <div>포인트 로딩중...</div>,
});
const UserCouponsTab = dynamic(() => import("./UserCouponsTab"), {
  ssr: false,
  loading: () => <div>쿠폰 로딩중...</div>,
});

export default function UserTabs({ userId }) {
  const [activeTab, setActiveTab] = useState("courses");

  const tabStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    borderBottom: "1px solid #ccc",
  };

  const tabButtonStyle = (tabKey) => ({
    padding: "10px 16px",
    background: "none",
    cursor: "pointer",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: activeTab === tabKey ? "3px solid #0070f3" : "none",
    fontWeight: activeTab === tabKey ? "bold" : "normal",
  });

  return (
    <div>
      <div style={tabStyle}>
        <button
          style={tabButtonStyle("courses")}
          onClick={() => setActiveTab("courses")}
        >
          📚 수강정보
        </button>
        <button
          style={tabButtonStyle("payments")}
          onClick={() => setActiveTab("payments")}
        >
          🧾 결제내역
        </button>
        <button
          style={tabButtonStyle("points")}
          onClick={() => setActiveTab("points")}
        >
          💰 포인트
        </button>
        <button
          style={tabButtonStyle("coupons")}
          onClick={() => setActiveTab("coupons")}
        >
          🎟 쿠폰
        </button>
      </div>

      <div>
        {activeTab === "courses" && <UserCoursesTab userId={userId} />}
        {activeTab === "payments" && <UserPaymentsTab userId={userId} />}
        {activeTab === "points" && <UserPointsTab userId={userId} />}
        {activeTab === "coupons" && <UserCouponsTab userId={userId} />}
      </div>
    </div>
  );
}
