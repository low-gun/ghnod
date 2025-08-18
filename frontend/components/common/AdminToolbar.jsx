// ./frontend/components/common/AdminToolbar.jsx
export default function AdminToolbar({
  left,
  right,
  showFilterButton = false,
  onToggleFilter,
  isFilterOpen = false,
}) {
  return (
    <div className="admin-toolbar">
      <div className="toolbar-left">{left}</div>
      <div className="toolbar-right">
        {showFilterButton && (
          <button
            className="filter-toggle"
            onClick={onToggleFilter}
            style={filterBtn}
          >
            {isFilterOpen ? "필터 접기" : "필터 펼치기"}
          </button>
        )}
        {right}
      </div>

      <style jsx>{`
        .admin-toolbar {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 12px 16px;
          margin-bottom: 16px;
        }
        .toolbar-left {
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .filter-toggle {
          display: none;
        }
        @media (max-width: 980px) {
          .admin-toolbar {
            grid-template-columns: 1fr;
          }
          .toolbar-left,
          .toolbar-right {
            width: 100%;
          }
          .toolbar-right {
            justify-content: space-between;
            gap: 8px;
          }
          .filter-toggle {
            display: inline-flex;
          }
        }
      `}</style>
    </div>
  );
}

const filterBtn = {
  padding: "6px 10px",
  fontSize: 13,
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
