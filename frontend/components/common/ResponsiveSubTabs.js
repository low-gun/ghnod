import { useRouter } from "next/router";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

export default function ResponsiveSubTabs({ tabs }) {
  const router = useRouter();
  const isMobileOrTablet = useIsTabletOrBelow();

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        marginBottom: 24,
        overflowX: isMobileOrTablet ? "auto" : "visible",
        textAlign: isMobileOrTablet ? "center" : "left", // ✅ 가운데 정렬
      }}
    >
      <div
        style={{
          display: isMobileOrTablet ? "inline-flex" : "flex", // ✅ 핵심: inline-flex
          gap: 16,
          whiteSpace: "nowrap",
          paddingBottom: 4,
          justifyContent: isMobileOrTablet ? "center" : "flex-start",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
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
              fontSize: isMobileOrTablet ? 13 : 14,
              color: "#333",
              textDecoration: "none",
              flex: "0 0 auto",
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  );
}
