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
        <div className="inputWrap">
        <input
  type="date"
  value={s.start_date}
  onChange={(e) => {
    const start = e.target.value;
    const end = s.end_date;
    const nextEnd = !end ? start : (end < start ? start : end);
    onChange(index, { ...s, start_date: start, end_date: nextEnd });
  }}
  className="input dateInput"
  disabled={s.order_count > 0}   // ✅ 결제된 세션이면 비활성화
/>
          <small
            className="fieldError"
            style={{ visibility: missingStart ? "visible" : "hidden" }}
          >
            시작일을 입력하세요.
          </small>
        </div>
      </div>

      <span className="tilde">~</span>

      {/* 종료일 */}
      <div className="cell">
        <div className="inputWrap">
        <input
  type="date"
  value={s.end_date}
  onChange={(e) => {
    const end = e.target.value;
    const start = s.start_date;
    const safeEnd = start && end < start ? start : end;
    onChange(index, { ...s, end_date: safeEnd });
  }}
  className="input dateInput"
  disabled={s.order_count > 0}   // ✅ 결제된 세션이면 비활성화
/>

          <small
            className="fieldError"
            style={{ visibility: (missingEnd || err.invalidDate) ? "visible" : "hidden" }}
          >
            {missingEnd
              ? "종료일을 입력하세요."
              : "종료일은 시작일 이후여야 합니다."}
          </small>
        </div>
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
  disabled={s.order_count > 0}   // ✅ 결제된 세션이면 모집인원도 비활성화
/>

      </div>

      <button
  className="btnIcon"
  onClick={() => onRemove(index)}
  aria-label="회차 삭제"
  disabled={s.order_count > 0}   // ✅ 결제된 세션이면 삭제 버튼 비활성화
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
        }
        .inputWrap {
          position: relative;
          display: inline-flex;
          flex-direction: column;
        }
        .inputWrap input {
          height: 44px;
        }
        .fieldError {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 12px;
  color: #e74c3c;
  line-height: 1.2;
  margin-top: 6px;  /* ✅ 간격 넉넉히 */
}

        .tilde {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9aa0a6;
          user-select: none;
          padding: 0 4px;
        }
        .btnIcon {
  height: 44px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
}

.btnIcon:disabled {
  opacity: 0.5;         /* ✅ 흐리게 표시 */
  cursor: not-allowed;  /* ✅ 클릭 불가 표시 */
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
