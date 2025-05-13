// ✅ 위치: frontend/components/common/PaginationControls.jsx

import React from "react";

export default function PaginationControls({ page, totalPages, onPageChange }) {
  return (
    <div style={{ width: "100%", textAlign: "center", marginTop: "16px" }}>
      <div
        style={{
          display: "inline-flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: page === 1 ? "#f3f3f3" : "#fff",
            color: "#000",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          ◀
        </button>

        <span style={{ alignSelf: "center" }}>
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: page === totalPages ? "#f3f3f3" : "#fff",
            color: "#000",
            cursor: page === totalPages ? "not-allowed" : "pointer",
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
