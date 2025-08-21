import { useRef, useState, useEffect } from "react";

export default function TabProductDetail({ html }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [exceeds, setExceeds] = useState(false);

  // img 태그에 loading="lazy" 자동 추가
  const processedHtml = (html || "<p>상세 설명이 없습니다.</p>")
    // img: loading/decoding 없을 때만 추가
    .replace(/<img\b(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async" ')
    // a: target/rel 없을 때 새 창 + 보안 속성
    .replace(/<a\b(?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');

  useEffect(() => {
    if (contentRef.current && contentRef.current.scrollHeight > 1200) {
      setExceeds(true);
    }
  }, [html]);

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
            maxHeight: expanded ? "none" : 1200,
            overflow: expanded ? "visible" : "hidden",
            transition: "max-height 0.3s ease",
          }}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
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
