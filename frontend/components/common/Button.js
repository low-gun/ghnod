export default function Button({
    children,
    color = "gray",
    onClick,
    type = "button",
  }) {
    const styles = {
      gray: {
        background: "#f5f5f5",
        color: "#333",
        border: "1px solid #ccc",
      },
      blue: {
        background: "#0070f3",
        color: "#fff",
        border: "none",
      },
      red: {
        background: "#e74c3c",
        color: "#fff",
        border: "none",
      },
    };
  
    return (
      <button
        type={type}
        onClick={onClick}
        style={{
          padding: "10px 16px",
          borderRadius: 6,
          fontSize: 14,
          cursor: "pointer",
          ...styles[color],
        }}
      >
        {children}
      </button>
    );
  }
  