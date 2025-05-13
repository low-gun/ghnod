import { useState } from "react";
import UserCoursesTab from "./UserCoursesTab";
import UserPaymentsTab from "./UserPaymentsTab";
import UserPointsTab from "./UserPointsTab";
import UserCouponsTab from "./UserCouponsTab";

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
