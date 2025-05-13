import { useState } from "react";
import { useRouter } from "next/router";
import {
  FaUser,
  FaCreditCard,
  FaHome,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen, // ✅ 상품관리 아이콘
} from "react-icons/fa";
import LogoutButton from "@/components/common/LogoutButton"; // ✅ 공통 로그아웃 버튼

export default function AdminSidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", !prev);
      return !prev;
    });
  };

  const iconStyle = { color: "#fff", fontSize: "20px" };

  return (
    <nav
      style={{
        position: "fixed", // ✅ 고정
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? "60px" : "150px",
        background: "#111827",
        padding: "10px",
        overflowY: "auto", // ✅ 내부 스크롤 처리
        display: "flex",
        flexDirection: "column",
        height: "100vh", // ✅ 전체 높이
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={toggleCollapse}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <ul style={{ padding: 0, listStyle: "none", flex: 1 }}>
        <li style={{ marginBottom: "15px" }}>
          <button
            onClick={() => router.push("/admin")}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <FaHome style={iconStyle} />
            {!collapsed && <span style={{ marginLeft: "10px" }}>홈</span>}
          </button>
        </li>
        <li style={{ marginBottom: "15px" }}>
          <button
            onClick={() => router.push("/admin/products")}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <FaBoxOpen style={iconStyle} />
            {!collapsed && <span style={{ marginLeft: "10px" }}>상품관리</span>}
          </button>
        </li>
        <li style={{ marginBottom: "15px" }}>
          <button
            onClick={() => router.push("/admin/schedules")}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <FaCalendarAlt style={iconStyle} />
            {!collapsed && <span style={{ marginLeft: "10px" }}>교육일정</span>}
          </button>
        </li>

        <li style={{ marginBottom: "15px" }}>
          <button
            onClick={() => router.push("/admin/payments")}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <FaCreditCard style={iconStyle} />
            {!collapsed && <span style={{ marginLeft: "10px" }}>결제관리</span>}
          </button>
        </li>
        <li style={{ marginBottom: "15px" }}>
          <button
            onClick={() => router.push("/admin/users")}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <FaUser style={iconStyle} />
            {!collapsed && <span style={{ marginLeft: "10px" }}>사용자</span>}
          </button>
        </li>
        <li
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "1px solid #555",
          }}
        >
          <LogoutButton collapsed={collapsed} />
        </li>
      </ul>
    </nav>
  );
}
