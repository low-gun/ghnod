import React from "react";
import dynamic from "next/dynamic";

const ExcelDownloadButton = dynamic(
  () => import("@/components/common/ExcelDownloadButton"),
  { ssr: false, loading: () => null }
);
/**
 * 범용 Admin 상단 패널
 * @param {Array} stats  - [{ title, value }]
 * @param {ReactNode} searchComponent - 검색 UI 컴포넌트
 * @param {Array} actions - [{ label, color, onClick, disabled }]
 * @param {Object} excel - { visible, fileName, sheetName, headers, data }
 */
export default function AdminTopPanels({
  stats = [],
  searchComponent = null,
  actions = [],
  excel = null,
  onStatClick,
  activeKey, // ← 추가
}) {
  return (
    <>
      <div className="admin-top-panels">
        {/* 통계 카드 */}
        {stats.map((item, idx) => (
          <div key={idx} className="panel">
            <h3 className="panel-title">{item.title}</h3>
            {Array.isArray(item.value) ? (
              <div className="stats-multi">
                {item.value.map((v, i) => {
                  const label = typeof v === "string" ? v : v.label;
                  const key = typeof v === "string" ? label : v.key;
                  const isActive = activeKey === key; // ← 선택 여부
                  return onStatClick ? (
                    <button
                      key={i}
                      type="button"
                      className="stat-chip"
                      onClick={() => onStatClick(key)}
                      aria-label={`${label} 필터 적용`}
                      aria-pressed={isActive}
                      style={{
                        border: isActive
                          ? "2px solid #3b82f6"
                          : "1px solid #e5e7eb",
                        background: isActive ? "#f0f7ff" : "#fff",
                        color: isActive ? "#1e40af" : "#374151",
                      }}
                    >
                      {label}
                    </button>
                  ) : (
                    <div key={i} className="stat-text">
                      {label}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel-value">{item.value}</div>
            )}
          </div>
        ))}

        {/* 검색 카드 */}
        {searchComponent && (
          <div className="panel">
            <h3 className="panel-title">검색</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
              {searchComponent}
            </div>
          </div>
        )}

        {/* 빠른 작업 카드 */}
        {(actions.length > 0 || excel?.visible) && (
          <div className="panel">
            <h3 className="panel-title">빠른 작업</h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {excel?.visible && (
                <ExcelDownloadButton
                  fileName={excel.fileName}
                  sheetName={excel.sheetName}
                  headers={excel.headers}
                  data={excel.data}
                  style={excelBtn}
                />
              )}
              {actions.map((btn, idx) => (
                <button
                  key={idx}
                  style={{ ...quickBtn, ...colorMap[btn.color] }}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ 반응형 CSS */}
      <style jsx>{`
        .admin-top-panels {
          display: grid;
          grid-template-columns: 1fr; /* 기본: 모바일/태블릿 세로 */
          gap: 12px;
          margin-bottom: 16px;
          align-items: stretch;
        }

        @media (min-width: 1024px) {
          .admin-top-panels {
            grid-template-columns: 0.6fr 1.4fr 1fr;
            /* 통계 좁게, 검색 넓게, 빠른작업 기본 */
          }
        }

        .panel {
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 12px;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center; /* ✅ 수평 가운데 정렬 */
          text-align: center; /* ✅ 텍스트 가운데 정렬 */
        }

        .panel-title {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          align-self: flex-start; /* ✅ 좌측 정렬 유지 */
          text-align: left; /* ✅ 텍스트도 좌측 정렬 */
        }
        .panel-value {
          font-size: 22px;
          font-weight: 700;
        }

        .stats-multi {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .stat-chip {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-size: 13px;
          cursor: pointer;
        }
        .stat-chip:hover {
          background: #f9fafb;
        }
        .stat-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
      `}</style>
    </>
  );
}

/* 버튼 스타일 */
const quickBtn = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  transition: "transform .02s ease",
};
const colorMap = {
  blue: { background: "#2563eb", color: "#fff" },
  yellow: { background: "#fbbf24", color: "#111827" },
  green: { background: "#22c55e", color: "#fff" },
  excel: { background: "#2d6a4f", color: "#fff" },
  red: { background: "#ef4444", color: "#fff" }, // ✅ 키를 맞춤
  custom: { background: "#999999", color: "#fff" },
};
const excelBtn = { ...quickBtn, ...colorMap.excel };
