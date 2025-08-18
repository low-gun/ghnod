// ./frontend/components/common/ToggleSwitch.jsx
export default function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <label style={shell} aria-disabled={disabled}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        style={{ opacity: 0, width: 0, height: 0 }}
        aria-checked={!!checked}
        role="switch"
      />
      <span
        style={{
          ...track,
          backgroundColor: checked ? "#28a745" : "#ccc",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            ...thumb,
            left: checked ? 21 : 3,
          }}
        />
      </span>
    </label>
  );
}
const shell = {
  position: "relative",
  display: "inline-block",
  width: 42,
  height: 24,
  verticalAlign: "middle",
  cursor: "pointer",
};
const track = {
  position: "absolute",
  inset: 0,
  borderRadius: 24,
  transition: "0.3s",
};
const thumb = {
  position: "absolute",
  width: 18,
  height: 18,
  bottom: 3,
  backgroundColor: "#fff",
  borderRadius: "50%",
  transition: "0.3s",
};
