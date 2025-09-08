import { useRef, useState, useEffect } from "react";
import api from "@/lib/api";

export default function TabProductDetail({ scheduleId }) {
  const contentRef = useRef(null);
  const sentinelRef = useRef(null);

  const [expanded, setExpanded] = useState(false);
  const [limitHeight, setLimitHeight] = useState(1200);
  const [canExpand, setCanExpand] = useState(false);
  const [html, setHtml] = useState("");
  const [shouldLoad, setShouldLoad] = useState(false);

  const dbg =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  // 상세 섹션이 뷰포트 근처에 올 때만 로드 (초기 TTI 개선)
  useEffect(() => {
    if (shouldLoad) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      // 스크롤 도달 전에 미리 가져오도록 여유 마진
      { root: null, rootMargin: "800px 0px 600px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad]);

  // 상세 HTML 로드 + 디버그
  useEffect(() => {
    if (!scheduleId || !shouldLoad) return;
    dbg && console.time("[Detail] fetch");
    api
      .get(`/education/schedules/${scheduleId}/detail`)
      .then((res) => {
        dbg && console.timeEnd("[Detail] fetch");
        dbg &&
          console.log(
            "[Detail] fetch size(bytes-rough):",
            res?.data?.detail?.length ?? 0
          );
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
  }, [scheduleId, shouldLoad, dbg]);

  const isEmptyDetail =
    !html ||
    /상세\s*설명이\s*없습니다\.?/i.test(
      String(html).replace(/<[^>]*>/g, "").trim()
    );

  // 이미지/링크 보강 + 불필요한 태그 제거 + original→detail 치환
  const processedHtml = (html || "<p>상세 설명이 없습니다.</p>")
    // 1) data:image 방지(거대한 base64 → placeholder)
    .replace(
      /<img\b([^>]*?)\bsrc=["']data:image\/[^"']+["']([^>]*)>/gi,
      '<img $1 src="/images/no-image.png"$2>'
    )
    // 2) (레거시) blob 파일명 내 -original- → -detail- 치환
    .replace(
      /(<img[^>]+src=["'][^"']*)-original-([^"']+["'][^>]*>)/gi,
      "$1-detail-$2"
    )
    // 3) img 속성 강화: lazy/async + 낮은 우선순위 + referrer 정책
    .replace(
      /<img\b(?![^>]*\bloading=)/gi,
      '<img loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" '
    )
    // 4) 외부 링크 보안 속성
    .replace(
      /<a\b(?![^>]*\btarget=)/gi,
      '<a target="_blank" rel="noopener noreferrer" '
    )
    // 5) 빈 문단 제거
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

  // 높이 측정: 불필요한 re-render 최소화(값이 바뀔 때만 setState)
  useEffect(() => {
    const h = window.innerHeight ? Math.round(window.innerHeight * 2.5) : 1200;
    setLimitHeight(h);

    const el = contentRef.current;
    if (!el) return;

    let raf = 0;
    const prevRef = { overflow: null, can: null, h };

    const measure = () => {
      raf = requestAnimationFrame(() => {
        const overflow = el.scrollHeight > h + 1;
        const nextCan = !isEmptyDetail && overflow;

        if (
          prevRef.overflow !== overflow ||
          prevRef.can !== nextCan ||
          prevRef.h !== h
        ) {
          setCanExpand(nextCan);
          prevRef.overflow = overflow;
          prevRef.can = nextCan;
          prevRef.h = h;
          dbg &&
            console.log("[Detail] measure:", {
              h,
              scrollHeight: el.scrollHeight,
              overflow,
              canExpand: nextCan,
            });
        }
      });
    };

    // 초기 1회
    measure();

    // 내용 변동(이미지 로딩 포함) 즉시 반영
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    // 이미지 onload 보강
    const imgs = el.querySelectorAll("img");
    const onImg = () => measure();
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onImg, { once: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onImg));
    };
  }, [html, isEmptyDetail, dbg]);

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <>
      {/* 뷰포트 접근 감지용 센티널 (이 지점 근처에서 상세 fetch 시작) */}
      <div ref={sentinelRef} style={{ height: 1 }} />

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

        /* 초기 렌더 비용 절감: 아직 보이지 않는 내용은 건너뜀 */
        .detail-box {
          content-visibility: auto;
          contain-intrinsic-size: 1000px; /* 초기 자리(대략값). 필요 시 조정 */
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
          width: 100%;
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
