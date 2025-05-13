import React from "react";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ marginBottom: "20px" }}>{message}</p>
        <button
          onClick={onConfirm}
          style={{
            padding: "6px 12px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "5px",
          }}
        >
          예
        </button>
        <button
          onClick={onCancel}
          style={{ padding: "6px 12px", marginLeft: "5px" }}
        >
          아니오
        </button>
      </div>
    </div>
  );
}
