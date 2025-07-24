import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 클라이언트에서만 모바일 여부 판단
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500); // 필요시 600으로 조정
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 로그인/회원가입 계열 경로
  const isAuthPage =
    router.pathname === "/login" ||
    router.pathname.startsWith("/register");

  // "모바일+회원경로"일 때만 헤더 숨김
  const hideHeader = isMobile && isAuthPage;

  // 푸터는 기존과 동일하게 회원경로면 숨김
  const hideFooter = isAuthPage;

  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {!hideHeader && (
        <Header showProfile={showProfile} setShowProfile={setShowProfile} />
      )}
      <main
        style={{
          flex: 1,
          marginTop: hideHeader ? "0px" : "80px", // 헤더 숨김일 때 0
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
