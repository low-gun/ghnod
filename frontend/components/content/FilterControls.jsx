export default function FilterControls({
  sort,
  order,
  showPast,
  onChange, // { sort, order, showPast } 변경 콜백
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ fontSize: 13, color: "#333" }}>
        <input
          type="checkbox"
          checked={showPast}
          onChange={() => onChange({ showPast: !showPast })}
          style={{ marginRight: 6 }}
        />
        지난 일정 포함
      </label>

      <select
        value={sort}
        onChange={(e) => onChange({ sort: e.target.value })}
        style={{
          padding: ".375rem .625rem",
          borderRadius: 6,
          border: ".0625rem solid #ccc",
          fontSize: 14,
        }}
      >
        <option value="start_date">최신순</option>
        <option value="created_at">등록일순</option>
      </select>

      <select
        value={order}
        onChange={(e) => onChange({ order: e.target.value })}
        style={{
          padding: ".375rem .625rem",
          borderRadius: 6,
          border: ".0625rem solid #ccc",
          fontSize: 14,
        }}
      >
        <option value="asc">오름차순</option>
        <option value="desc">내림차순</option>
      </select>
    </div>
  );
}
