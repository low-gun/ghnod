// components/diagnosis/DiagnosisSubTabs.jsx
import { useRouter } from "next/router";

export default function DiagnosisSubTabs({ tabs }) {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 24 }}>
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
