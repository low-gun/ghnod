
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import Footer from "./Footer";
export default function MainLayout({ children }) {
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isAuthPage =
  router.pathname === "/login" ||
  router.pathname.startsWith("/register");

const hideHeader = isMobile && isAuthPage;
// 모바일+로그인/회원가입에서만 푸터 숨김
const hideFooter = isMobile && isAuthPage;

  // ★ 헤더 높이를 상태에 따라 지정
  const headerHeight = isMobile ? 48 : 80;

  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: `calc(100vh - ${headerHeight}px)`,
      }}
    >
      <Header showProfile={showProfile} setShowProfile={setShowProfile} />
      <main
        style={{
          flex: 1,
          marginTop: hideHeader ? "0px" : `${headerHeight}px`,
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
