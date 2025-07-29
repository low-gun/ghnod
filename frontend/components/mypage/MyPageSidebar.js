import React from "react";
import { useRouter } from "next/router";
import { User, BookOpen, CreditCard, Tag, Star, MessageCircle } from "lucide-react";

const MENUS = [
  { label: "내 정보", icon: <User size={18} /> },
  { label: "수강정보", icon: <BookOpen size={18} /> },
  { label: "결제내역", icon: <CreditCard size={18} /> },
  { label: "쿠폰", icon: <Tag size={18} /> },
  { label: "포인트", icon: <Star size={18} /> },
  { label: "1:1문의", icon: <MessageCircle size={18} /> },
];

export default function MyPageSidebar({ activeMenu, setActiveMenu }) {
  const router = useRouter();

  return (
    <aside
      style={{
        position: "sticky",
        top: 72,
        alignSelf: "flex-start",
        background: "#f6f9fd",
        borderRight: "1px solid #e3e9f7",
        padding: "32px 0",
        width: 220,
        minWidth: 180,
        maxWidth: 260,
        flex: "0 0 220px",
        height: "calc(100vh - 72px)",
        boxSizing: "border-box",
        zIndex: 10,
        borderRadius: "0 18px 18px 0",
        boxShadow: "2px 0 8px 0 rgba(64,108,204,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {MENUS.map((menu) => {
          const isActive = menu.label === activeMenu;
          return (
            <li
              key={menu.label}
              onClick={() => {
                setActiveMenu(menu.label);
                router.push({ pathname: "/mypage", query: { menu: menu.label } });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 28px 13px 24px",
                marginBottom: "3px",
                cursor: "pointer",
                background: isActive ? "linear-gradient(90deg, #e5eeff 80%, #e3e9f7 100%)" : "transparent",
                borderRadius: "7px",
                fontWeight: isActive ? 700 : 400,
                fontSize: "15.4px",
                color: isActive ? "#244078" : "#556080",
                transition: "background 0.13s, color 0.12s",
                boxShadow: isActive ? "0 1px 5px 0 rgba(48,100,220,0.04)" : "none",
              }}
              onMouseOver={e => e.currentTarget.style.background = isActive ? "#e5eeff" : "#f1f6ff"}
              onMouseOut={e => e.currentTarget.style.background = isActive ? "#e5eeff" : "transparent"}
            >
              {menu.icon}
              <span>{menu.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
