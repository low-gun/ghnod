// frontend/components/schedules/CustomToolbar.jsx
export default function CustomToolbar(props) {
  const {
    localizer: { messages },
    label,
    onNavigate,
    onView,
    openModalForCreate,
  } = props;

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button onClick={() => onNavigate("PREV")}>{messages.previous}</button>
        <button onClick={() => onNavigate("TODAY")}>{messages.today}</button>
        <button onClick={() => onNavigate("NEXT")}>{messages.next}</button>
      </span>

      {/* 라벨 표시 부분에 스타일 추가 */}
      <span
        className="rbc-toolbar-label"
        style={{ fontSize: "1.2rem", fontWeight: "bold" }}
      >
        {label}
      </span>

      <span className="rbc-btn-group">
        <button onClick={() => onView("month")}>{messages.month}</button>
        <button onClick={() => onView("week")}>{messages.week}</button>
        <button onClick={() => onView("myAgenda")}>{messages.myAgenda}</button>
      </span>
    </div>
  );
}
