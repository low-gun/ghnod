// frontend/components/common/FormFooterBar.jsx
export default function FormFooterBar({ onList, onDelete, onSave, isEdit, saveDisabled }) {
    return (
      <div className="footerBar">
        <button onClick={onList} className="btnGhost">목록</button>
        <div className="btnGroup">
          {isEdit && <button onClick={onDelete} className="btnDanger">삭제</button>}
          <button onClick={onSave} className="btnPrimary" disabled={saveDisabled}>저장</button>
        </div>
        <style jsx>{`
          .footerBar { margin-top:28px; display:flex; justify-content:space-between; gap:12px; }
          .btnGhost { padding:10px 14px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; }
          .btnPrimary { padding:12px 18px; background:#0070f3; color:#fff; border:none; border-radius:8px; cursor:pointer; }
          .btnPrimary:disabled { opacity:0.5; cursor:not-allowed; }
          .btnDanger { padding:12px 18px; background:#e74c3c; color:#fff; border:none; border-radius:8px; cursor:pointer; }
  
          /* ✅ 삭제/저장 사이 간격 넓힘 */
          .btnGroup { display:flex; gap:16px; }  /* 필요하면 20px로 더 넓혀도 됩니다 */
        `}</style>
      </div>
    );
  }
  