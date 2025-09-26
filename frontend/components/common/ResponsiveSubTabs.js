import { useRouter } from "next/router";   // ✅ 추가
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

export default function ResponsiveSubTabs({ tabs, basePath }) {
  const router = useRouter();
  const isMobileOrTablet = useIsTabletOrBelow();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
      <div style={{ display: isMobileOrTablet ? "inline-flex" : "flex", gap: 16 }}>
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.slug}`;
          const isActive = router.asPath.startsWith(href);

          return (
            <button
              key={tab.slug}
              onClick={() => router.push(href)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: isActive ? "bold" : "normal",
                borderBottom: isActive ? "2px solid #333" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
