// components/layout/MainLayout.js

import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          marginTop: "80px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
          position: "relative", // ✅ 추가!
        }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
