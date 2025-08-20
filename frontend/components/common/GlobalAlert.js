// GlobalAlert.js (진짜 바텀시트 느낌)
import { useEffect } from "react";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

export default function GlobalAlert() {
  const { show, message, hideAlert } = useGlobalAlert();
  const isMobile = useIsMobile();

  const type = isMobile ? "bottomsheet" : "toast";

  useEffect(() => {
    if (show) {
      const timer = setTimeout(hideAlert, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, hideAlert]);

  if (!show || !message) return null;

  // PC 토스트
  if (type === "toast") {
    return (
      // PC 토스트
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "50.4%",
          transform: "translateX(-50%)",
          width: 320,
          background: "#333",
          color: "#fff",
          borderRadius: 8,
          padding: "10px 0",
          zIndex: 9999,
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          fontSize: 15,
          cursor: "pointer",
          transition: "all 0.25s",
          whiteSpace: "pre-line", // ← 추가: \n 줄바꿈 표시
        }}
        onClick={hideAlert}
      >
        {message}
      </div>
    );
  }

  // 모바일 바텀시트
  return (
    <div>
      {/* 오버레이 */}
      <div
        onClick={hideAlert}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.18)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
      />
      {/* 바텀시트 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "#fff",
            color: "#222",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: "18px 22px 30px 22px",
            margin: "0 8px 0 8px", // margin-bottom 0!
            width: "100%",
            maxWidth: 440,
            minHeight: 64,
            boxShadow: "0 0 24px rgba(0,0,0,0.19)",
            textAlign: "center",
            fontSize: 16,
            position: "relative",
            animation: "slideUp 0.22s cubic-bezier(.42,0,.29,1.54)",
            paddingBottom: "calc(30px + env(safe-area-inset-bottom))", // safe area 보정
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 bar */}
          {/* <div
            style={{
              width: 38,
              height: 5,
              borderRadius: 3,
              background: "#bbb",
              position: "absolute",
              left: "50%",
              top: 12,
              transform: "translateX(-50%)",
              marginBottom: 8,
              pointerEvents: "none",
            }}
          /> */}
          {/* 닫기(X) 버튼 */}
          <button
            onClick={hideAlert}
            style={{
              position: "absolute",
              right: 16,
              top: 12,
              background: "transparent",
              border: "none",
              fontSize: 22,
              color: "#bbb",
              cursor: "pointer",
              lineHeight: 1,
              zIndex: 2,
            }}
            aria-label="닫기"
          >
            &times;
          </button>
          <div
            style={{ paddingTop: 18, paddingBottom: 2, whiteSpace: "pre-line" }}
          >
            {message}
          </div>{" "}
        </div>
        <style>
          {`
            @keyframes slideUp {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
}
