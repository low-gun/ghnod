// components/register/RegisterContainer.jsx
export default function RegisterContainer({ children }) {
    return (
      <div style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafbfc"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)",
          padding: "36px 36px 30px 36px",
          margin: "48px 0",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {children}
        </div>
      </div>
    );
  }
  