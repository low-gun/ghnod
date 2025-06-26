import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const MENUS = ["내 정보", "수강정보", "결제내역", "쿠폰", "포인트", "1:1문의"];

export default function MyPageSidebar({ activeMenu, setActiveMenu }) {
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(null); // 초기 null

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // mount 시 즉시 실행
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ 깜빡임 방지: width 계산 전에는 렌더링 안 함
  if (windowWidth === null) return null;

  const isVertical = windowWidth <= 768;
  const sidebarWidth = windowWidth <= 1280 ? "50px" : "150px";
  const fontSize = windowWidth <= 1120 ? "14px" : "15px";
  const paddingX = windowWidth <= 1120 ? "16px" : "20px";

  return (
    <div
      style={{
        position: "sticky",
        top: "80px",
        alignSelf: "stretch",
        background: "#f5f5f5",
        borderRight: "1px solid #ddd",
        padding: "20px 0",
        transition: "width 0.3s ease",
        width: sidebarWidth,
        height: "calc(100vh - 80px)",
        zIndex: 10,
      }}
    >
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {MENUS.map((menu) => (
          <li
            key={menu}
            onClick={() => {
              setActiveMenu(menu);
              router.push({ pathname: "/mypage", query: { menu } });
            }}
            style={{
              padding: `10px ${paddingX}`,
              marginBottom: "5px",
              cursor: "pointer",
              background: menu === activeMenu ? "#e0e0e0" : "transparent",
              borderRadius: "4px",
              fontWeight: menu === activeMenu ? "bold" : "normal",
              fontSize,
              writingMode: isVertical ? "vertical-lr" : "horizontal-tb",
              textAlign: isVertical ? "center" : "left",
            }}
          >
            {menu}
          </li>
        ))}
      </ul>
    </div>
  );
}
