export default function SessionRow({
  value,
  index,
  onChange,
  onRemove,
  error,
  placeholderTotalSpots,
}) {
  const s = value || { start_date: "", end_date: "", total_spots: "" };
  const err = error || { missing: false, invalidDate: false };
  const missingStart = err.missing && !s.start_date;
  const missingEnd = err.missing && !s.end_date;

  // ✅ 부모 모집인원 기본값 적용
  const displaySpots =
    s.total_spots !== undefined && s.total_spots !== null && s.total_spots !== ""
      ? s.total_spots
      : placeholderTotalSpots || "";

  return (
    <div className="sessionRow" aria-invalid={err.missing || err.invalidDate}>
      {/* 시작일 */}
      <div className="cell">
        <input
          type="date"
          value={s.start_date}
          onChange={(e) =>
            onChange(index, { ...s, start_date: e.target.value })
          }
          className="input dateInput"
        />
        {missingStart && (
          <small className="fieldError">시작일을 입력하세요.</small>
        )}
      </div>

      <span className="tilde">~</span>

      {/* 종료일 */}
      <div className="cell">
        <input
          type="date"
          value={s.end_date}
          onChange={(e) =>
            onChange(index, { ...s, end_date: e.target.value })
          }
          className="input dateInput"
        />
        {(missingEnd || err.invalidDate) && (
          <small className="fieldError">
            {missingEnd
              ? "종료일을 입력하세요."
              : "종료일은 시작일 이후여야 합니다."}
          </small>
        )}
      </div>

      {/* ✅ 회차 모집인원 입력 */}
      <div className="cell">
        <input
          type="number"
          min="0"
          placeholder="모집인원"
          value={displaySpots}
          onChange={(e) =>
            onChange(index, {
              ...s,
              total_spots:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="sessionInput"
        />
      </div>

      {/* 삭제 버튼 */}
      <button
        className="btnIcon"
        onClick={() => onRemove(index)}
        aria-label="회차 삭제"
      >
        ✕
      </button>

      <style jsx>{`
        .sessionRow {
          display: contents;
        }
        .cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fieldError {
          color: #e74c3c;
          font-size: 12px;
          line-height: 1.2;
        }
        .tilde {
          color: #9aa0a6;
          user-select: none;
          padding: 0 2px;
          align-self: center;
        }
        .sessionInput {
          height: 44px;
          line-height: 1.2;
          padding: 12px 14px;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          font-size: 14px;
          background: #fff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .sessionInput:focus {
          outline: none;
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.15);
        }
      `}</style>
    </div>
  );
}
