import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import Footer from "./Footer";
import { useIsTabletOrBelow980 } from "@/lib/hooks/useIsDeviceSize";
import GlobalDialog from "@/components/common/GlobalDialog";
import InquiryModal from "@/components/inquiry/InquiryModal"; // ✅ 교체
import { MessageSquare } from "lucide-react"; // ✅ 문의 아이콘 추가
const HEADER_HEIGHT_DESKTOP = 0;
const HEADER_HEIGHT_MOBILE = 0;

export default function MainLayout({ children }) {
  const [showProfile, setShowProfile] = useState(false);
  const [activeMenu, setActiveMenu] = useState("내 정보");
  const [showTop, setShowTop] = useState(false);
  const [openInquiry, setOpenInquiry] = useState(false);
  const [openFabMenu, setOpenFabMenu] = useState(false);

  const isTabletOrBelow = useIsTabletOrBelow980();
  const router = useRouter();

  const isAuthPage =
    router.pathname === "/login" || router.pathname.startsWith("/register");

  const hideHeader = false;
  const hideFooter = isTabletOrBelow && isAuthPage;

  const headerHeight = isTabletOrBelow
    ? HEADER_HEIGHT_MOBILE
    : HEADER_HEIGHT_DESKTOP;

  const noHeaderOffsetRoutes = ["/education/[type]/[id]"];
  const noHeaderOffset = noHeaderOffsetRoutes.includes(router.pathname);

  useEffect(() => {
    const handleScroll = () => {
      const top = document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowTop(top > 200);
    };
  
    // ✅ window + body 모두 감지
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
  
    handleScroll(); // 초기 동기화
  
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, []);
 

  const handleInquiryClick = () => {
    setOpenInquiry(true); // ✅ 모바일/데스크톱 모두 GlobalDialog에서 처리
  };
  

  return (
    <div
      className="layout-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
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
          flex: 1,
          marginTop: noHeaderOffset ? 0 : headerHeight,
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
          position: "relative",
        }}
      >
        {children}
      </main>

         {/* Floating Buttons */}
         <div
        style={{
          position: "fixed",
          right: "14%",   // ✅ 원래 위치 유지
          bottom: "20%",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* ✅ 데스크톱: TOP + 문의하기 */}
        {!isTabletOrBelow && (
          <>
            {showTop && (
 <button
 onClick={() => {
  document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
  document.body.scrollTo({ top: 0, behavior: "smooth" });
}}

 style={{
   backgroundColor: "#0070F3",
   color: "#fff",
   borderRadius: "50%",
   width: "40px",
   height: "40px",
   border: "none",
   cursor: "pointer",
 }}
>
 ▲
</button>

)}
          <button
  onClick={handleInquiryClick}
  style={{
    backgroundColor: "#0070F3",
    color: "#fff",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
  aria-label="문의하기"
  title="문의하기"
>
  <MessageSquare size={18} color="#fff" />
</button>

          </>
        )}

        {/* ✅ 모바일: FAB + 작은 메뉴 */}
        {isTabletOrBelow && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenFabMenu((prev) => !prev)}
              style={{
                backgroundColor: "#0070F3",
                color: "#fff",
                borderRadius: "50%",
                width: "44px",   // ✅ 크기 줄임
                height: "44px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
              }}
              aria-label="FAB 메뉴"
            >
              ☰
            </button>

            {openFabMenu && (
              <div
              style={{
                position: "absolute",
                bottom: "52px",
                left: "50%",                        // ← 화면 가로 중앙 기준
                transform: "translateX(-50%)",      // ← 자기 너비만큼 왼쪽으로 이동
                display: "flex",
                flexDirection: "column",
                alignItems: "center",               // 버튼들도 가운데 정렬
                gap: "8px",
              }}
            >
                {showTop && (
  <button
  onClick={() => {
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
  }}
    style={{
      backgroundColor: "#0070F3",
      color: "#fff",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      border: "none",
      cursor: "pointer",
    }}
  >
    ▲
  </button>
)}

<button
  onClick={() => {
    handleInquiryClick();
    setOpenFabMenu(false);
  }}
  style={{
    backgroundColor: "#0070F3",
    color: "#fff",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
  aria-label="문의하기"
  title="문의하기"
>
  <MessageSquare size={18} color="#fff" />
</button>

              </div>
            )}
          </div>
        )}
      </div>

           {/* 전역 문의: GeneralInquiryModal 사용 */}
           <GlobalDialog
  open={openInquiry}
  onClose={() => setOpenInquiry(false)}
  title="문의"
>
  <InquiryModal
    mode="general" // ← 전역(일반) 문의 모드
    onClose={() => setOpenInquiry(false)}
    onSubmitSuccess={() => setOpenInquiry(false)}
  />
</GlobalDialog>


      {!hideFooter && <Footer showProfile={showProfile} />}
    </div>
  );
}
