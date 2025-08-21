export default function FormSection({ title, children }) {
    return (
      <div style={{ marginBottom: 32 }}>
        {title && (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              borderBottom: "1px solid #eee",
              paddingBottom: 6,
            }}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    );
  }
  