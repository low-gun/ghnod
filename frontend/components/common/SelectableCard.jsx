import React from "react";

/**
 * 모바일/터치 친화적 선택 카드
 * - 카드 아무 곳이나 탭하면 onToggle 호출
 * - 버튼/링크/폼 요소 클릭은 자동 제외
 * - 키보드 접근: Space/Enter로 토글
 */
export default function SelectableCard({
  selected = false,
  onToggle,
  style,
  className,
  children,
}) {
  const handleClick = (e) => {
    const tag = String(e.target.tagName || "").toLowerCase();
    if (["button", "a", "input", "label", "select", "textarea"].includes(tag))
      return; // 내부 인터랙션은 패스
    onToggle?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 12,
        background: "#fff",
        boxShadow: selected
          ? "0 0 0 2px #3b82f6 inset, 0 2px 6px rgba(0,0,0,0.06)"
          : "0 2px 6px rgba(0,0,0,0.04)",
        transition: "box-shadow .15s, border-color .15s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
