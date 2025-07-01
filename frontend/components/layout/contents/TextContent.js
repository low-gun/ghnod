export default function TextContent({ title, subtitle, paragraphs, imageSrc }) {
  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px",
        fontSize: "clamp(14px, 2vw, 18px)",
      }}
    >
      {/* 이미지 + 제목/부제목 오버레이 */}
      {imageSrc && (
        <div
          style={{
            position: "relative",
            textAlign: "left",
            marginBottom: 16,
          }}
        >
          <img
            src={imageSrc}
            alt={title}
            style={{
              width: "100%",
              maxWidth: 1200,
              height: "auto",
              borderRadius: 8,
              display: "block",
              margin: "0 auto",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "clamp(12px, 3vw, 24px)",
              left: "clamp(16px, 4vw, 32px)",
              color: "#222",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(18px, 4vw, 24px)",
                fontWeight: "bold",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(12px, 2.8vw, 14px)",
                  color: "#555",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 본문 단락들 */}
      {paragraphs?.map((para, idx) => (
        <p key={idx} style={{ marginBottom: "1em", lineHeight: 1.6 }}>
          {para}
        </p>
      ))}
    </section>
  );
}
