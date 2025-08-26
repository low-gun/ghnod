import { useRef, useState, useEffect } from "react";

export default function TabProductDetail({ html }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [exceeds, setExceeds] = useState(false);
  const [limitHeight, setLimitHeight] = useState(1200);

  // img 태그에 lazy 속성 자동 추가
  const processedHtml = (html || "<p>상세 설명이 없습니다.</p>")
    .replace(/<img\b(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async" ')
    .replace(/<a\b(?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');

  useEffect(() => {
    const h = window.innerHeight ? window.innerHeight * 2.5 : 1200;
    setLimitHeight(h);

    if (contentRef.current && contentRef.current.scrollHeight > h) {
      setExceeds(true);
    } else {
      setExceeds(false);
    }
  }, [html]);

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <>
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
            maxHeight: expanded ? "none" : limitHeight,
            overflow: expanded ? "visible" : "hidden",
            transition: "max-height 0.3s ease",
          }}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />

        {exceeds && (
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button
              onClick={handleToggle}
              style={{
                padding: "8px 18px",
                fontSize: 14,
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: 20,
                cursor: "pointer",
                marginTop: 12,
                fontWeight: 500,
              }}
            >
              {expanded ? "상품상세 접기 ▲" : "상품상세 더보기 ▼"}
            </button>
          </div>
        )}
      </section>

      <style jsx global>{`
        .detail-box img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .detail-box table {
          width: 100%;
          border-collapse: collapse;
          display: block;
          overflow-x: auto;
        }
        .detail-box iframe {
          width: 100%;
          height: auto;
          aspect-ratio: 16 / 9;
        }
      `}</style>
    </>
  );
}
