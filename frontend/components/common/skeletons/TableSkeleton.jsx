// ./frontend/components/common/skeletons/TableSkeleton.jsx
export default function TableSkeleton({ cols = 8, rows = 6, thHeight = 44 }) {
  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: 10, height: thHeight }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c} style={{ padding: 10 }}>
                  <div style={bar} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const bar = {
  height: 12,
  width: "100%",
  background: "linear-gradient(90deg, #eee, #f5f5f5, #eee)",
  borderRadius: 6,
};
