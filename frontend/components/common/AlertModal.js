import React from "react";

export default function AlertModal({ message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "320px",
          textAlign: "center",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ marginBottom: "20px" }}>{message}</p>
        <button
          style={{
            padding: "6px 16px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={onClose}
          autoFocus
        >
          확인
        </button>
      </div>
    </div>
  );
}
