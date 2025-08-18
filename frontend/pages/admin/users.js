import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/layout/AdminLayout";
import UserTable from "../../components/admin/UserTable";
import UserSummaryTable from "../../components/admin/UserSummaryTable";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";
import UserPointGrantModal from "@/components/admin/UserPointGrantModal";
import UserCouponGrantModal from "@/components/admin/UserCouponGrantModal";
import CouponTemplateModal from "@/components/admin/CouponTemplateModal";
import api from "@/lib/api";
import { UserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function AdminUsersPage() {
  const router = useRouter();
  const { query } = router;
  const { user } = useContext(UserContext);
  const defaultTab = query.tab || "list";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [error, setError] = useState("");
  const { showAlert } = useGlobalAlert();

  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSyncKeyList, setSearchSyncKeyList] = useState(0);
  const [searchSyncKeySummary, setSearchSyncKeySummary] = useState(0);

  // ✅ UserTable에서 받은 사용자 수만 유지
  const totalUsersRef = useRef(0); // TypeScript 제네릭 문법 제거
  const [totalUsers, setTotalUsers] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin.totalUsers");
      return saved ? Number(saved) : 0;
    }
    return 0;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [excelList, setExcelList] = useState({ headers: [], data: [] });
  const [excelSummary, setExcelSummary] = useState({ headers: [], data: [] });

  const [showPointGrantModal, setShowPointGrantModal] = useState(false);
  const [showCouponGrantModal, setShowCouponGrantModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponTemplates, setCouponTemplates] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 페이지 최초 로드시 로컬 저장된 값 사용 + API로 최신화
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
        console.error("사용자 수 불러오기 실패");
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("admin/coupon-templates");
        if (res.data?.success) {
          const active = res.data.data.filter((t) => t.is_active === 1);
          setCouponTemplates(active);
        }
      } catch {
        /* 무시 */
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [drawerOpen]);

  // UserTable에서만 사용자 수 갱신
  // UserTable에서만 사용자 수 갱신 (갱신 시 로컬에도 저장)
  const handleLoaded = useCallback(({ type, totalCount }) => {
    if (type === "list") {
      totalUsersRef.current = totalCount;
      setTotalUsers(totalCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin.totalUsers", String(totalCount));
      }
    }
  }, []);

  // 상세 열기
  const handleOpenDetail = useCallback((userId) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    setActiveTab(query.tab || "list");
  }, [query.tab]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <AdminLayout pageTitle="사용자관리">
      <div>
        {/* 상단 3-카드 */}
        <AdminTopPanels
          stats={[{ title: "사용자 수", value: `${totalUsers}명` }]}
          searchComponent={
            <AdminSearchFilter
              searchType={searchType}
              setSearchType={setSearchType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchOptions={[
                { value: "username", label: "이름", type: "text" },
                { value: "email", label: "이메일", type: "text" },
                { value: "phone", label: "전화번호", type: "text" },
                {
                  value: "role",
                  label: "권한",
                  type: "select",
                  options: [
                    { value: "user", label: "user" },
                    { value: "admin", label: "admin" },
                  ],
                },
                { value: "created_at", label: "가입일", type: "date" },
                { value: "courseCount", label: "수강", type: "text" },
                { value: "paymentTotal", label: "결제", type: "text" },
                { value: "pointTotal", label: "포인트", type: "text" },
                { value: "couponCount", label: "쿠폰", type: "text" },
                { value: "inquiryCount", label: "문의", type: "text" },
              ]}
              onSearchClick={() => {
                setSearchSyncKeyList((k) => k + 1);
                setSearchSyncKeySummary((k) => k + 1);
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
                setShowPointGrantModal(true);
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
                setShowCouponGrantModal(true);
              },
            },
            {
              label: "쿠폰 관리",
              color: "green",
              onClick: () => setShowCouponModal(true),
            },
          ]}
        />

        {/* 탭 UI */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => {
              router.push(
                {
                  pathname: router.pathname,
                  query: { ...router.query, tab: "list" },
                },
                undefined,
                { shallow: true }
              );
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
                  query: { ...router.query, tab: "summary" },
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

        {/* 렌더링 */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!error && (
          <>
            <div style={{ display: activeTab === "list" ? "block" : "none" }}>
              <UserTable
                isActive={activeTab === "list"}
                onLoaded={handleLoaded}
                useExternalToolbar={true}
                externalSearchType={searchType}
                externalSearchQuery={searchQuery}
                searchSyncKey={searchSyncKeyList}
                onExcelData={setExcelList}
                onSelectionChange={setSelectedIds}
                // ✅ 비밀번호 초기화 API 연결
                onResetPassword={async (user) => {
                  try {
                    const res = await api.put(
                      `/admin/users/${user.id}/reset-password`
                    );
                    if (!res.data?.success) {
                      throw new Error("초기화 실패");
                    }
                  } catch (err) {
                    console.error("❌ 초기화 오류:", err);
                    throw err; // UserTable에서 catch하여 알림 표시
                  }
                }}
              />
            </div>
            <div
              style={{ display: activeTab === "summary" ? "block" : "none" }}
            >
              <UserSummaryTable
                isActive={activeTab === "summary"}
                onLoaded={handleLoaded}
                onOpenDetail={handleOpenDetail}
                useExternalToolbar={true}
                externalSearchType={searchType}
                externalSearchQuery={searchQuery}
                searchSyncKey={searchSyncKeySummary}
                onExcelData={setExcelSummary}
                onSelectionChange={setSelectedIds}
              />
            </div>
          </>
        )}
      </div>

      {/* 모달 */}
      {showPointGrantModal && (
        <UserPointGrantModal
          selectedIds={selectedIds}
          onClose={() => setShowPointGrantModal(false)}
          onSuccess={() => setSelectedIds([])}
        />
      )}
      {showCouponGrantModal && (
        <UserCouponGrantModal
          selectedIds={selectedIds}
          couponTemplates={couponTemplates}
          onClose={() => setShowCouponGrantModal(false)}
          onSuccess={() => setSelectedIds([])}
        />
      )}
      {showCouponModal && (
        <CouponTemplateModal onClose={() => setShowCouponModal(false)} />
      )}
    </AdminLayout>
  );
}

// 스타일 상수
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
const panelGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  marginBottom: 16,
  alignItems: "stretch",
};
const panel = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const panelTitle = { fontSize: 13, color: "#6b7280" };
const panelValue = { fontSize: 22, fontWeight: 700 };
const quickBtn = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  transition: "transform .02s ease",
};
const quickBtnBlue = { ...quickBtn, background: "#2563eb", color: "#fff" };
const quickBtnYellow = { ...quickBtn, background: "#fbbf24", color: "#111827" };
const quickBtnGreen = { ...quickBtn, background: "#22c55e", color: "#fff" };
const excelBtn = { ...quickBtn, background: "#2d6a4f", color: "#fff" };
const drawerOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 1000,
};
const drawerPanel = {
  width: "min(960px, 90vw)",
  height: "100%",
  background: "#fff",
  boxShadow: "0 0 20px rgba(0,0,0,0.15)",
  display: "flex",
  flexDirection: "column",
};
const drawerHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
};
const drawerCloseBtn = {
  padding: "6px 10px",
  fontSize: 13,
  background: "#6b7280",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
const drawerBody = { flex: 1, minHeight: 0 };
