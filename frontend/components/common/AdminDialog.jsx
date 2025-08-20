// /frontend/components/common/AdminDialog.jsx
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

export default function AdminDialog({
  open,
  onClose,
  title,
  subtitle = "",
  size = "md", // "sm" | "md" | "lg"
  footer = null, // ReactNode (버튼 영역 직접 전달)
  closeOnBackdrop = true,
  children,
}) {
  const isMobile = useIsTabletOrBelow?.() ?? false;
  const portalRef = useRef(null);
  const contentRef = useRef(null);
  const prevFocusRef = useRef(null);

  // 포털 노드 준비
  if (!portalRef.current && typeof document !== "undefined") {
    portalRef.current = document.createElement("div");
    portalRef.current.setAttribute("id", "admin-dialog-portal");
  }

  // 포털 부착/해제
  useEffect(() => {
    if (!portalRef.current || typeof document === "undefined") return;
    document.body.appendChild(portalRef.current);
    return () => {
      try {
        document.body.removeChild(portalRef.current);
      } catch {}
    };
  }, []);

  // 바디 스크롤 잠금 + 포커스 관리 + ESC 닫기
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    prevFocusRef.current = document.activeElement;
    // 다음 틱에 포커스
    const t = setTimeout(() => contentRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      if (prevFocusRef.current && "focus" in prevFocusRef.current) {
        try {
          prevFocusRef.current.focus();
        } catch {}
      }
    };
  }, [open, onClose]);

  // 모바일 키보드 대응(visualViewport 기준 하단 여백 가변)
  useEffect(() => {
    if (typeof window === "undefined" || !open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateKbOffset = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb-offset", `${kb}px`);
    };
    updateKbOffset();
    vv.addEventListener("resize", updateKbOffset);
    vv.addEventListener("scroll", updateKbOffset);
    return () => {
      vv.removeEventListener("resize", updateKbOffset);
      vv.removeEventListener("scroll", updateKbOffset);
      document.documentElement.style.removeProperty("--kb-offset");
    };
  }, [open]);

  if (!open || !portalRef.current) return null;

  const widths = { sm: 420, md: 640, lg: 860 };
  const dialogWidth = isMobile ? "100%" : (widths[size] ?? widths.md);

  return ReactDOM.createPortal(
    <>
      {/* 간단 트랜지션 */}
      <style jsx global>{`
        .ad-overlay {
          animation: ad-fade-in 160ms ease-out both;
        }
        .ad-panel {
          animation: ad-pop-in 180ms ease-out both;
        }
        @keyframes ad-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes ad-pop-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "dialog"}
        className="ad-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center",
          background: "rgba(17,24,39,0.45)",
          backdropFilter: "blur(2px)",
        }}
        onMouseDown={(e) => {
          if (!closeOnBackdrop) return;
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
          ref={contentRef}
          tabIndex={-1}
          className="ad-panel"
          style={{
            width: dialogWidth,
            maxWidth: isMobile ? "100vw" : "95vw",
            // 모바일: 바텀시트 높이 80dvh, 그 외 maxHeight 90vh
            height: isMobile ? "min(80dvh, 90vh)" : "auto",
            maxHeight: "90vh",
            background: "#fff",
            borderRadius: isMobile ? "16px 16px 0 0" : 12,
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            // 하단 세이프에어리어 + 키보드 높이 반영
            paddingBottom:
              "calc(env(safe-area-inset-bottom, 0px) + var(--kb-offset, 0px))",
          }}
        >
          {/* 모바일 그랩 핸들 */}
          {isMobile ? (
            <div
              style={{
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  background: "#e5e7eb",
                }}
              />
            </div>
          ) : null}

          {/* 헤더 */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #eef2f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: "20px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: isMobile ? "70vw" : "50vw",
                }}
              >
                {title}
              </div>
              {subtitle ? (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* 컨텐츠(스크롤 영역) */}
          <div
            style={{
              padding: "16px 20px",
              overflow: "auto",
              flex: "1 1 auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {children}
          </div>

          {/* 푸터(고정 영역) */}
          {footer ? (
            <div
              style={{
                position: "relative",
                padding: "12px 20px",
                borderTop: "1px solid #eef2f7",
                background: "#fff",
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>,
    portalRef.current
  );
}
