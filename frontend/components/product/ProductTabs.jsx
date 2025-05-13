// ✅ ProductTabs를 스크롤 이동형 탭으로 리팩터링
import { useState, useEffect } from "react";

export default function ProductTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id || "");

  // scroll시 active tab 변경 감지
  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY;
      const buffer = 140; // 헤더 + 탭 높이만큼 보정
      for (let i = tabs.length - 1; i >= 0; i--) {
        const el = document.getElementById(tabs[i].id);
        if (el && el.offsetTop - buffer <= scrollY) {
          setActive(tabs[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, [tabs]);

  // ✅ 초기 진입 시 첫 번째 탭 강제 활성화 (scrollY === 0 대비)
  useEffect(() => {
    setTimeout(() => {
      const firstId = tabs[0]?.id;
      if (firstId && document.getElementById(firstId)) {
        setActive(firstId);
      }
    }, 50);
  }, [tabs]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    const offset = window.innerWidth <= 768 ? 120 : 80;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 80, // 헤더 높이에 맞춰서 보정
        backgroundColor: "#fff",
        zIndex: 100,
        borderBottom: "1px solid #ddd",
      }}
    >
      <div style={{ display: "flex" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => scrollTo(tab.id)}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "none",
              borderBottom:
                active === tab.id
                  ? "2px solid #0070f3"
                  : "2px solid transparent",
              fontWeight: active === tab.id ? "bold" : "normal",
              backgroundColor: "transparent",
              color: active === tab.id ? "#0070f3" : "#666",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
