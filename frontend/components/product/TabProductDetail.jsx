import { useRef, useState, useEffect } from "react";

export default function TabProductDetail({ html }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [exceeds, setExceeds] = useState(false);

  useEffect(() => {
    if (contentRef.current && contentRef.current.scrollHeight > 1200) {
      setExceeds(true);
    }
  }, [html]);

  return (
    <section
      id="detail"
      style={{
        padding: "40px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        상품상세
      </h2>

      <div
        ref={contentRef}
        className="detail-box"
        style={{
          maxHeight: "none",
          overflow: "visible",
          transition: "max-height 0.3s ease",
        }}
        dangerouslySetInnerHTML={{
          __html: html || "<p>상세 설명이 없습니다.</p>",
        }}
      />

      {!expanded && exceeds && (
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button
            onClick={() => setExpanded(true)}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            더보기 ▼
          </button>
        </div>
      )}
    </section>
  );
}
