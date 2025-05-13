// components/editor/extensions/EditorModeButtons.jsx
export default function EditorModeButtons({ sourceMode, setSourceMode }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {sourceMode ? (
        <button onClick={() => setSourceMode(false)} style={buttonStyle}>
          📝 편집
        </button>
      ) : (
        <button onClick={() => setSourceMode(true)} style={buttonStyle}>
          🧾 HTML
        </button>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  border: "1px solid #ccc",
  borderRadius: 4,
  backgroundColor: "#f4f4f4",
  cursor: "pointer",
};
