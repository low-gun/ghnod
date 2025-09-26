import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import LogoutButton from "@/components/common/LogoutButton";

export default function AdminSidebar({
  isMobileOpen = false,
  onMobileClose = () => {},
}) {
  const router = useRouter();

  // Hydration-safe flag
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 모바일 여부 감지
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const mql = window.matchMedia("(max-width: 980px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, [hydrated]);

  const effectiveIsMobile = hydrated ? isMobile : false;

  // 모바일 Drawer 열릴 때 포커스
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (effectiveIsMobile && isMobileOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [effectiveIsMobile, isMobileOpen]);

  // 공통 메뉴 아이템
  const menuItems = [
    { label: "홈", path: "/admin", icon: icons.home },
    { label: "상품관리", path: "/admin/products", icon: icons.products },
    { label: "일정", path: "/admin/schedules", icon: icons.calendar },
    { label: "결제관리", path: "/admin/payments", icon: icons.payments },
    { label: "사용자", path: "/admin/users", icon: icons.users },
  ];

  return (
    <>
      {/* 모바일 백드롭 */}
      {effectiveIsMobile && isMobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
          }}
        />
      )}

      {/* 사이드바 */}
      <nav
        aria-label="Admin sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: effectiveIsMobile ? "65vw" : "220px",
          minWidth: effectiveIsMobile ? "200px" : "220px",
          maxWidth: effectiveIsMobile ? "240px" : "240px",
          background: "#0f172a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "2px 0 16px rgba(0,0,0,0.25)",
          padding: "10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          zIndex: 2001,
          transform: effectiveIsMobile
            ? isMobileOpen
              ? "translateX(0)"
              : "translateX(-100%)"
            : "translateX(0)",
          transition: "transform 0.24s ease",
        }}
      >
        <ul style={{ padding: 0, listStyle: "none", flex: 1, margin: 0 }}>
          {menuItems.map((item) => (
            <li key={item.path} style={{ marginBottom: "15px" }}>
              <button
                onClick={() => router.push(item.path)}
                style={menuButtonStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}

          {/* 로그아웃 */}
          <li
            style={{
              marginTop: "auto",
              borderTop: "1px solid #555",
              paddingTop: "20px",
            }}
          >
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </>
  );
}

// 공통 메뉴 버튼 스타일
const menuButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  color: "#fff",
  transition: "background 0.15s ease",
};

const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  products: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="#fff"
        strokeWidth="2"
      />
      <path
        d="M16 2v4M8 2v4M3 10h18"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  payments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke="#fff"
        strokeWidth="2"
      />
      <path d="M2 10h20" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="#fff" strokeWidth="2" />
      <path
        d="M5.5 21a6.5 6.5 0 0 1 13 0"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};
