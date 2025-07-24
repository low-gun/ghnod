import { useEffect, useState } from "react";

export default function ScrollTopButton() {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [rightOffset, setRightOffset] = useState(20); // 💡 right 위치

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);

      // 💡 버튼 위치 계산
      const containerWidth = 1200;
      const gutter = 20;
      const offset =
        width > containerWidth ? (width - containerWidth) / 2 - gutter : gutter;
      setRightOffset(Math.max(offset, 16)); // 최소값 보장
    };

    const handleScroll = () => {
      const vh = window.innerHeight * 0.01;
      setShow(window.scrollY > vh * 1.5);
    };

    handleResize();
    handleScroll();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="맨 위로 이동"
      style={{
        position: "fixed",
        bottom: isMobile ? "20vh" : "25vh",
        right: `${rightOffset}px`, // ✅ 컨테이너 기준 위치 계산됨
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#0070f3",
        color: "#fff",
        fontSize: "20px",
        border: "none",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        cursor: "pointer",
        zIndex: 9999,
        transition: "opacity 0.3s",
      }}
    >
      ↑
    </button>
  );
}
