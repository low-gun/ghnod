// ./frontend/components/common/skeletons/CardSkeleton.jsx
export default function CardSkeleton({ lines = 3 }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 12,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          style={{
            ...line,
            width:
              idx === 0 ? 160 : idx === 1 ? "100%" : idx === 2 ? "90%" : "100%",
            marginTop: idx === 0 ? 0 : idx === 1 ? 8 : 6,
          }}
        />
      ))}
    </div>
  );
}

const line = {
  height: 12,
  background: "linear-gradient(90deg, #eee, #f5f5f5, #eee)",
  borderRadius: 6,
};
