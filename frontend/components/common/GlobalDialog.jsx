// frontend/components/common/GlobalDialog.jsx
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

/**
 * GlobalDialog
 * - PC: 화면 중앙 모달
 * - Mobile: 하단 바텀시트
 *
 * props:
 *  open: boolean
 *  onClose: () => void
 *  title?: string
 *  children: ReactNode
 *  actions?: ReactNode         // 하단 버튼 영역 (선택)
 *  size?: "sm" | "md" | "lg"   // 기본 md
 *  showClose?: boolean         // 우측 상단 X 버튼 (기본 true)
 *  closeOnBackdrop?: boolean   // 오버레이 클릭 닫기 (기본 true)
 */
export default function GlobalDialog({
  open,
  onClose,
  title = "",
  children,
  actions = null,
  size = "md",
  showClose = true,
  closeOnBackdrop = true,
}) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const maxWidth = size === "sm" ? 360 : size === "lg" ? 640 : 480;

  const overlay = (
    <div
      className="gd-overlay"
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`gd-panel ${isMobile ? "sheet" : "dialog"}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "dialog"}
        style={{
          ...(isMobile
            ? {}
            : { width: `min(90vw, ${maxWidth}px)`, maxHeight: "86vh" }),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="gd-header">
            <div className="gd-title">{title}</div>
            {showClose && (
              <button className="gd-close" onClick={onClose} aria-label="닫기">
                ✕
              </button>
            )}
          </div>
        )}
        <div className="gd-body">{children}</div>
        {actions && <div className="gd-footer">{actions}</div>}
      </div>

      <style jsx>{`
        .gd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: ${isMobile ? "flex-end" : "center"};
          justify-content: center;
          padding: ${isMobile ? "0" : "16px"};
          z-index: 1000;
        }
        .gd-panel {
          background: #fff;
          color: #222;
          border-radius: ${isMobile ? "22px 22px 0 0" : "12px"};
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
          overflow: hidden;
          animation: ${isMobile ? "slideUp .22s cubic-bezier(.42,0,.29,1.54)" : "zoomIn .16s ease"};
          width: ${isMobile ? "100%" : "auto"};
          max-width: ${isMobile ? "440px" : "unset"};
          margin: ${isMobile ? "0 auto" : "0"};
        }
        .gd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 14px 16px 8px 16px;
        }
        .gd-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }
        .gd-close {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          height: 32px;
          width: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .gd-body {
          padding: 8px 16px ${isMobile ? "calc(12px + env(safe-area-inset-bottom))" : "12px"} 16px;
        }
        .gd-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 10px 16px ${isMobile ? "calc(16px + env(safe-area-inset-bottom))" : "16px"} 16px;
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}
