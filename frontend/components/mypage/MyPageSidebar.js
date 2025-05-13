// frontend/components/mypage/MyPageSidebar.js
import React from "react";
import { useRouter } from "next/router";

// 메뉴 순서 업데이트
const MENUS = ["내정보", "수강정보", "결제내역", "쿠폰", "포인트", "1:1문의"];

export default function MyPageSidebar({ activeMenu, setActiveMenu }) {
  const router = useRouter();

  return (
    <div
      style={{
        width: "220px",
        minHeight: "calc(100vh - 60px)",
        background: "#f5f5f5",
        borderRight: "1px solid #ddd",
        padding: "20px 0",
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
              padding: "10px 20px",
              marginBottom: "5px",
              cursor: "pointer",
              background: menu === activeMenu ? "#e0e0e0" : "transparent",
              borderRadius: "4px",
              fontWeight: menu === activeMenu ? "bold" : "normal",
            }}
          >
            {menu}
          </li>
        ))}
      </ul>
    </div>
  );
}
