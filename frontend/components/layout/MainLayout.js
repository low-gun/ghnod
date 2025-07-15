// components/layout/MainLayout.js

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ProfileDropdown from "@/components/ProfileDropdown";

export default function MainLayout({ children }) {
  // 추가: 상단 프로필 드롭다운 상태
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* Header에 onProfileClick prop 전달(연결 필요) */}
      <Header onProfileClick={() => setShowProfile((v) => !v)} />

      {/* 프로필 드롭다운도 showProfile로 제어 */}
      <ProfileDropdown showProfile={showProfile} setShowProfile={setShowProfile} />

      <main
        style={{
          flex: 1,
          marginTop: "80px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
          position: "relative",
        }}
      >
        {children}
      </main>

      {/* Footer에 showProfile prop 전달 */}
      <Footer showProfile={showProfile} />
    </div>
  );
}
