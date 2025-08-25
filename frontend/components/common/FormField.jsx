export default function FormField({
    label, htmlFor, helper, children, className = "", helperAlign = "left"   // ✅ 추가
  }) {
    return (
      <div className={`field ${className}`}>
        {label && <label htmlFor={htmlFor}>{label}</label>}
        {children}
        {helper ? (
          <small className={`helperText ${helperAlign === "right" ? "alignRight" : ""}`}>
            {helper}
          </small>
        ) : null}
        <style jsx>{`
          .field { margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
          label { color:#555; font-size:13px; line-height:1; }
          .helperText { color:#666; font-size:12px; margin-top:4px; display:block; }
          .alignRight { text-align:right; }   /* ✅ 우측 정렬 */
        `}</style>
      </div>
    );
  }
  