// frontend/components/common/FormSection.jsx
export default function FormSection({ title, children, className = "" }) {
    return (
      <section className={`sectionCard ${className}`}>
        {title && <h3 className="sectionTitle">{title}</h3>}
        {children}
        <style jsx>{`
          .sectionCard { border:1px solid #eee; border-radius:12px; padding:16px; margin-bottom:16px; background:#fff; }
          .sectionTitle { margin:0 0 12px 0; font-size:16px; font-weight:700; }
          @media (max-width:768px){
            .sectionCard { padding:14px; }
            .sectionTitle { font-size:15px; margin-bottom:10px; }
          }
        `}</style>
      </section>
    );
  }
  