import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

export default function HomePage() {
  const isMobile = useIsMobile();

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <img
        src="/main.png"
        alt="진단 워크숍 메인 이미지"
        style={{
          width: "100%",
          height: "auto",
          display: isMobile ? "block" : undefined, // ✅ 모바일에서만 block 처리
        }}
      />
    </div>
  );
}
