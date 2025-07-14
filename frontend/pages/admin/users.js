// ✅ 수정된 AdminUsersPage.js (전체 최종 버전)

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/layout/AdminLayout";
import UserTable from "../../components/admin/UserTable";
import UserSummaryTable from "../../components/admin/UserSummaryTable";
import axios from "axios";
import { UserContext } from "@/context/UserContext";

export default function AdminUsersPage() {
  const router = useRouter();
  const { query } = router;
  const { user } = useContext(UserContext);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const defaultTab = query.tab || "list";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [error, setError] = useState("");

  // ✅ URL query.tab이 변할 때 activeTab 업데이트
  // useEffect(() => {
  //   if (!query.tab) {
  //     router.replace({
  //       pathname: router.pathname,
  //       query: { ...query, tab: defaultTab },
  //     });
  //   }
  // }, [query.tab]);

  // useEffect(() => {
  //   if (query.tab) {
  //     setActiveTab(query.tab);
  //   }
  // }, [query.tab]);

  // ✅ 비관리자 접근 제한
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  const handleResetPassword = async (user) => {
    const confirm = window.confirm(
      `사용자 [${user.username} / ${user.email}]의 비밀번호를 [1234]로 초기화하시겠습니까?`
    );
    if (!confirm) return;

    try {
      const res = await axios.put(`/api/admin/users/${user.id}/reset-password`);
      if (res.data.success) {
        alert("비밀번호가 [1234]로 초기화되었습니다.");
      } else {
        alert("초기화에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 초기화 오류:", error);
      alert("초기화 중 오류가 발생했습니다.");
    }
  };

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <AdminLayout pageTitle="사용자 관리">
      <div>
        {/* ✅ 탭 UI */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => {
              router.push({
                pathname: router.pathname,
                query: { ...router.query, tab: "list" },
              });
            }}
            style={activeTab === "list" ? tabActiveStyle : tabStyle}
          >
            사용자 목록
          </button>

          <button
            onClick={() => {
              router.push({
                pathname: router.pathname,
                query: { ...router.query, tab: "summary" },
              });
            }}
            style={activeTab === "summary" ? tabActiveStyle : tabStyle}
          >
            사용자별 구매내역
          </button>
        </div>

        {/* ✅ 렌더링 */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!error && activeTab === "list" && (
          <UserTable onResetPassword={handleResetPassword} />
        )}

        {!error && activeTab === "summary" && <UserSummaryTable />}
      </div>
    </AdminLayout>
  );
}

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
