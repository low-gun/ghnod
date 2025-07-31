import { useGlobalConfirm } from "@/stores/globalConfirm";

export default function GlobalConfirmModal() {
  const { visible, message, confirm, cancel } = useGlobalConfirm();

  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        zIndex: 2001,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 32,
          minWidth: 300,
          textAlign: "center",
          boxShadow: "0 4px 20px #0001",
        }}
      >
        <div
          style={{
            marginBottom: 20,
            fontSize: 16,
            whiteSpace: "pre-line", // 줄바꿈 적용!
          }}
        >
          {message}
        </div>{" "}
        <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
          <button
            onClick={cancel}
            style={{
              padding: "8px 22px",
              borderRadius: 5,
              border: "1px solid #ddd",
              background: "#eee",
              color: "#555",
              fontWeight: 500,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={confirm}
            style={{
              padding: "8px 22px",
              borderRadius: 5,
              border: "none",
              background: "#0070f3",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
