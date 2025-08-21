export default function FormField({ label, children, required }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 6,
            color: "#333",
          }}
        >
          {label}
          {required && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        {children}
      </div>
    );
  }
  