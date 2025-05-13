export default function PageSizeSelector({
  value,
  onChange,
  options = [10, 20, 50, 100],
  style = {},
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        padding: "8px",
        fontSize: "14px",
        borderRadius: "6px",
        ...style,
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}개
        </option>
      ))}
    </select>
  );
}
