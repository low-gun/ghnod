// components/layout/MainLayout.js

import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div className="layout-wrapper">
      <Header />

      <main
        style={{
          marginTop: "80px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
        }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
