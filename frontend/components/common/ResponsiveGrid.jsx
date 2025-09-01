import React from "react";

/**
 * props:
 * - columns: { mobile?: number, tablet?: number, desktop?: number }
 * - gap: number (px)
 * - centerItems?: boolean (justify-items: center)
 * - className?: string (추가 클래스)
 */
export default function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 16,
  centerItems = false,
  className = "",
}) {
  const cls = `responsive-grid ${className}`.trim();

  return (
    <div className={cls}>
      {children}
      <style jsx>{`
        .responsive-grid {
          display: grid;
          gap: ${gap}px;
          grid-template-columns: repeat(${columns.mobile || 1}, 1fr); /* 모바일 기본 */
          ${centerItems ? "justify-items: center;" : ""}
        }
        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.tablet || columns.mobile || 1}, 1fr); /* 태블릿 */
          }
        }
        @media (min-width: 1200px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.desktop || columns.tablet || columns.mobile || 1}, 1fr); /* 데스크톱 */
          }
        }
      `}</style>
    </div>
  );
}
