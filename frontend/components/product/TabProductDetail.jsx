import { useRef, useState, useEffect } from "react";
import api from "@/lib/api";

export default function TabProductDetail({ scheduleId }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [limitHeight, setLimitHeight] = useState(1200);
  const [canExpand, setCanExpand] = useState(false);
  const [html, setHtml] = useState("");
  const dbg = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

// ✅ 상세 HTML만 별도 API에서 로드 + 디버그 로깅(기능 영향 없음)
useEffect(() => {
  if (!scheduleId) return;
  dbg && console.time("[Detail] fetch");
  api
    .get(`/education/schedules/${scheduleId}/detail`)
    .then((res) => {
      dbg && console.timeEnd("[Detail] fetch");
      dbg && console.log("[Detail] fetch size(bytes-rough):", res?.data?.detail?.length ?? 0);
      if (res.data.success) {
        setHtml(res.data.detail || "");
      } else {
        setHtml("");
      }
    })
    .catch((e) => {
      dbg && console.timeEnd("[Detail] fetch");
      dbg && console.warn("[Detail] fetch error", e?.message);
      setHtml("");
    });
}, [scheduleId, dbg]);


  const isEmptyDetail =
    !html ||
    /상세\s*설명이\s*없습니다\.?/i.test(
      String(html).replace(/<[^>]*>/g, "").trim()
    );

  // img 태그 lazy 속성 추가 + 불필요한 태그 제거
  const processedHtml = (html || "<p>상세 설명이 없습니다.</p>")
    .replace(
      /<img\b(?![^>]*\bloading=)/gi,
      '<img loading="lazy" decoding="async" '
    )
    .replace(
      /<a\b(?![^>]*\btarget=)/gi,
      '<a target="_blank" rel="noopener noreferrer" '
    )
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

  useEffect(() => {
    const h = window.innerHeight ? window.innerHeight * 2.5 : 1200;
    setLimitHeight(h);

    const id = requestAnimationFrame(() => {
      const el = contentRef.current;
      const overflow = el ? el.scrollHeight > h + 1 : false;
      setCanExpand(!isEmptyDetail && overflow);
    });
    return () => cancelAnimationFrame(id);
  }, [html, isEmptyDetail]);

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

        <div className="detail-wrap">
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

          {!expanded && canExpand && (
            <div className="fade-overlay">
              <button className="detail-toggle" onClick={handleToggle}>
                더보기 ▼
              </button>
            </div>
          )}
        </div>

        {expanded && canExpand && (
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
              상품상세 접기 ▲
            </button>
          </div>
        )}
      </section>

      <style jsx global>{`
        .detail-wrap {
          position: relative;
        }
        .fade-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 24px 0 12px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            #fff 60%
          );
          display: flex;
          justify-content: center;
        }
        .detail-toggle {
          padding: 8px 18px;
          font-size: 14px;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
        }

        .detail-box img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 !important;
          padding: 0 !important;
          border: 0;
        }
        .detail-box p,
        .detail-box figure {
          margin: 0 !important;
          padding: 0 !important;
        }
        .detail-box :where(p, figure, div):has(> img:only-child) {
          margin: 0 !important;
          padding: 0 !important;
        }
        .detail-box img + img {
          margin-top: 0 !important;
        }
        .detail-box :where(p, figure, div):has(> img:only-child)
          + :where(p, figure, div):has(> img:only-child) {
          margin-top: 0 !important;
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
          aspect-ratio: 16/9;
        }
      `}</style>
    </>
  );
}
