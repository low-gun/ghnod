import AdminSidebar from "./AdminSidebar";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function AdminLayout({ pageTitle, children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const lastFocusedRef = useRef(null);
  const router = useRouter();

  // 라우트 변경 시 모바일 Drawer 자동 닫기
  useEffect(() => {
    const handleRouteChange = () => {
      setIsDrawerOpen(false);
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router.events]);

  // 스크롤 잠금 + ESC 닫기 (모바일 Drawer 전용)
  useEffect(() => {
    if (isDrawerOpen) {
      lastFocusedRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (
        lastFocusedRef.current &&
        typeof lastFocusedRef.current.focus === "function"
      ) {
        lastFocusedRef.current.focus();
      }
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  return (
    <div
      className="admin-layout"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* 사이드바 - 데스크톱에서는 항상 표시, 모바일에서는 Drawer */}
      <AdminSidebar
        isMobileOpen={isDrawerOpen}
        onMobileClose={() => setIsDrawerOpen(false)}
      />

      {/* 모바일 햄버거 버튼 */}
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={() => setIsDrawerOpen(true)}
        className="admin-hamburger-fixed"
      >
        ☰
      </button>

      {/* 메인 컨텐츠 */}
      <main className="admin-main">
        <div style={{ padding: "20px" }}>
          {pageTitle && (
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: "0 0 20px",
              }}
            >
              {pageTitle}
            </h1>
          )}
          {children}
        </div>
      </main>

      {/* 전역 스타일 */}
      <style jsx global>{`
        .admin-main {
          flex: 1;
          margin-left: 220px; /* 데스크톱 사이드바 폭 */
          overflow-y: auto;
          height: 100vh;
          transition: margin-left 0.2s ease;
        }
        .admin-hamburger-fixed {
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 2100;
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          display: none;
          font-size: 22px;
        }
        @media (max-width: 980px) {
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-hamburger-fixed {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        @media (min-width: 981px) {
          .admin-hamburger-fixed {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
