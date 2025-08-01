import { useState } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import Footer from "./Footer";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

const HEADER_HEIGHT_DESKTOP = 80;
const HEADER_HEIGHT_MOBILE = 48;

export default function MainLayout({ children }) {
  const [showProfile, setShowProfile] = useState(false);
  const [activeMenu, setActiveMenu] = useState("내 정보");
  const isTabletOrBelow = useIsTabletOrBelow();
  const router = useRouter();

  // 헤더/푸터 숨김 처리 (로그인, 회원가입 페이지)
  const isAuthPage =
    router.pathname === "/login" || router.pathname.startsWith("/register");

  // 헤더, 푸터 숨김은 모바일·태블릿 구간에서만 적용
  const hideHeader = false;
  const hideFooter = isTabletOrBelow && isAuthPage;

  // 헤더 높이 변수 통일
  const headerHeight = isTabletOrBelow
    ? HEADER_HEIGHT_MOBILE
    : HEADER_HEIGHT_DESKTOP;

  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // ✅ 추가
      }}
    >
      <Header
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      <main
        style={{
          flex: 1, // ✅ 그대로 유지
          marginTop: headerHeight,
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
          position: "relative",
        }}
      >
        {children}
      </main>
      {!hideFooter && <Footer showProfile={showProfile} />}
    </div>
  );
}
