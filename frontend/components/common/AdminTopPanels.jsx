import React from "react";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";

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
}) {
  return (
    <div style={panelGrid}>
      {/* 통계 카드 */}
      {stats.map((item, idx) => (
        <div key={idx} style={panel}>
          <h3 style={panelTitle}>{item.title}</h3>
          {Array.isArray(item.value) ? (
            <div style={statsMultiLineContainer}>
              <div style={statCountStyle}>{item.value[0]}</div>
              <div style={statCountStyle}>{item.value[1]}</div>
            </div>
          ) : (
            <div style={panelValue}>{item.value}</div>
          )}
        </div>
      ))}

      {/* 검색 카드 */}
      {searchComponent && (
        <div style={{ ...panel, gap: 10 }}>
          <h3 style={panelTitle}>검색</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {searchComponent}
          </div>
        </div>
      )}

      {/* 빠른 작업 카드 */}
      {(actions.length > 0 || excel?.visible) && (
        <div style={{ ...panel, gap: 10 }}>
          <h3 style={panelTitle}>빠른 작업</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center", // ⬅ 가운데 정렬
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
  );
}

/* 스타일 */
const panelGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  marginBottom: 16,
  alignItems: "stretch",
};
const panel = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const panelTitle = { fontSize: 13, color: "#6b7280", margin: 0 };
// 기존 panelValue, panelValueSmall 제거하고 아래로 교체
const panelValue = {
  fontSize: 22,
  fontWeight: 700,
};

const statsMultiLineContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "4px", // 건수/금액 간 간격
};

const statCountStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#374151", // 진한 회색
};

const statAmountStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#2563eb", // 파란색
};

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
  custom: {}, // 사용자 지정
};
const excelBtn = { ...quickBtn, ...colorMap.excel };
