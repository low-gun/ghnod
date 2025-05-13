// components/layout/contents/TextContent.js
import TabNavigation from "./TabNavigation";

export default function TextContent({
  title,
  subtitle,
  paragraphs,
  imageSrc,
  tabs, // 탭 배열
}) {
  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 40px)",
        fontSize: "clamp(14px, 2vw, 18px)", // 최소 14px~최대 18px 반응
      }}
    >
      {/* ===== 상단 탭 (옵션) ===== */}
      {tabs && tabs.length > 0 && <TabNavigation tabs={tabs} />}

      {/* 제목 및 부제목 */}
      <h1
        style={{
          fontWeight: "bold",
          marginBottom: "10px",
          fontSize: "clamp(20px, 4vw, 28px)",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <h2
          style={{
            marginBottom: "20px",
            color: "#666",
            fontSize: "clamp(16px, 3vw, 22px)",
          }}
        >
          {subtitle}
        </h2>
      )}

      {/* 이미지 */}
      {imageSrc && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={imageSrc}
            alt={title}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "4px",
            }}
          />
        </div>
      )}

      {/* 여러 단락 */}
      {paragraphs &&
        paragraphs.map((para, idx) => (
          <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
            {para}
          </p>
        ))}
    </section>
  );
}
