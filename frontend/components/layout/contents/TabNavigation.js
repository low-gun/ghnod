// components/layout/contents/TabNavigation.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function TabNavigation({ tabs }) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        gap: "16px",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        justifyContent: "center",
      }}
    >
      {tabs.map((tab) => {
        const isActive = router.pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              fontWeight: "normal",
              // 활성 탭일 경우: 배경색 #f0f0f0, 하단 4px border
              backgroundColor: isActive ? "#f0f0f0" : "transparent",
              color: "#333",
              transition: "background-color 0.2s, border-bottom 0.2s",
              borderBottom: isActive ? "4px solid #333" : "none",
            }}
            // 비활성 탭 상태라면, 마우스를 올렸을 때("#f0f0f0"),
            // 마우스를 뗐을 때(transparent)로 배경색 전환
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
