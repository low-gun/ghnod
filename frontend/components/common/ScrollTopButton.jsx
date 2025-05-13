import { useEffect, useState } from "react";

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "#0070f3",
        color: "#fff",
        border: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        cursor: "pointer",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {/* SVG 화살표 */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <path d="M12 4L2 18H22L12 4Z" fill="white" />
      </svg>

      {/* TOP 텍스트 */}
      <span
        style={{
          fontSize: 10,
          marginTop: 2,
          color: "#fff",
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        TOP
      </span>
    </button>
  );
}
