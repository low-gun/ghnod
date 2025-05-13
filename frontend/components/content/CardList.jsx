import CardItem from "./CardItem";

export default function CardList({ items = [], type, showPast, onShowPast }) {
  const today = new Date();

  const filtered = items.filter((item) => {
    const isPast = new Date(item.start_date) < today;
    return showPast ? true : !isPast;
  });

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <p>등록된 일정이 없습니다.</p>
        {!showPast &&
          onShowPast &&
          items.some((i) => new Date(i.start_date) < today) && (
            <button
              onClick={onShowPast}
              style={{
                marginTop: 12,
                padding: "6px 12px",
                backgroundColor: "#f3f3f3",
                border: "1px solid #ccc",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              지난 일정보기
            </button>
          )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
        justifyItems: "center",
      }}
    >
      {filtered.map((item) => (
        <CardItem key={item.id} item={item} type={type} />
      ))}
    </div>
  );
}
