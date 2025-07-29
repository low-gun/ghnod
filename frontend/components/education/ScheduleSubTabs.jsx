import React from "react";
import { useRouter } from "next/router";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize"; // 추가

export default function ScheduleSubTabs({ tabs }) {
  const router = useRouter();
  const isMobileOrTablet = useIsTabletOrBelow();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: isMobileOrTablet ? "center" : "flex-start",
        }}
      >
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              fontWeight: router.pathname === tab.href ? "bold" : "normal",
              borderBottom:
                router.pathname === tab.href ? "2px solid #333" : "none",
              paddingBottom: 4,
              fontSize: 14,
              color: "#333",
              textDecoration: "none",
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  );
}
