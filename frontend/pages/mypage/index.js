import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import axios from "axios";
import MyPageSidebar from "../../components/mypage/MyPageSidebar";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // ✅ 추가
// 자식 컴포넌트들
import MyCourse from "../../components/mypage/MyCourse";
import MyInfo from "../../components/mypage/MyInfo";
import PaymentHistory from "../../components/mypage/PaymentHistory";
import Coupons from "../../components/mypage/Coupons";
import Points from "../../components/mypage/Points";
import Inquiries from "../../components/mypage/Inquiries";
import { useRef } from "react"; // ⬅️ 상단 import 추가

axios.defaults.withCredentials = true;

export default function MyPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("내 정보");
  const [myData, setMyData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const dropdownRef = useRef(null); // ⬅️ ref 정의
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
  
    const menu = router.query.menu || "내 정보";
    setActiveMenu(menu);
    if (
      menu === "내 정보" ||
      menu === "쿠폰" ||
      menu === "포인트" ||
      menu === "1:1문의"
    ) {
      fetchData(menu);
    } else {
      setMyData([]);
      setLoading(false);
      setErrorMessage("");
    }
  }, [router.query.menu]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  async function fetchData(menu) {
    setLoading(true);
    setErrorMessage("");
    setMyData([]);

    try {
      let endpoint = "";
      if (menu === "내 정보") endpoint = "/mypage/info";
      else if (menu === "수강정보") endpoint = "";
else if (menu === "결제내역") endpoint = "";
      else if (menu === "쿠폰") endpoint = "/mypage/coupons";
      else if (menu === "포인트") endpoint = "/mypage/points";
      else if (menu === "1:1문의") endpoint = "/mypage/inquiries";

      if (endpoint) {
        const res = await api.get(endpoint);
        console.log("📦 [MyPage] 응답 결과:", res.data); // ✅ 여기 추가
        if (res.data && res.data.success) {
          const key = Object.keys(res.data).find((k) => k !== "success");
          setMyData(res.data[key] || []);
        } else {
          setErrorMessage("데이터를 불러오지 못했습니다.");
        }
      }
    } catch (err) {
      console.error("마이페이지 로딩 오류:", err);
      setErrorMessage("마이페이지 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const renderContent = () => {
    if (loading) return <></>;
    if (errorMessage) {
      return (
        <div style={{ padding: "20px" }}>
          <h2>에러 발생</h2>
          <p>{errorMessage}</p>
        </div>
      );
    }
  
    const commonProps = { data: myData };
  
    switch (activeMenu) {
      case "내 정보":
        return <MyInfo {...commonProps} />;
      case "수강정보":
        return <MyCourse />;
      case "결제내역":
        return <PaymentHistory />;
      case "쿠폰":
        return <Coupons {...commonProps} />;
      case "포인트":
        return <Points {...commonProps} />;
      case "1:1문의":
        return <Inquiries {...commonProps} />;
      default:
        return <MyCourse />;
    }
  };
  

  return (
    <div style={{ background: "#fefefe", minHeight: "100vh" }}>
<div style={{
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  alignItems: "stretch",
  minHeight: "100vh",
  width: "100vw", // 또는 "100%"
  maxWidth: "100vw",
  overflowX: "hidden",   // 가로 스크롤 확실히 제거!
  overflowY: "auto",     // 세로 스크롤만 자동
  position: "relative",
}}>
        {isMobile ? (
          <div
            ref={dropdownRef}
            style={{
              position: "relative",
              margin: "16px 12px",
              width: "calc(100% - 24px)",
            }}
          >
            <div
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "10px 12px",
                background: "#fff",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex", // ✅ flex로 분리
                justifyContent: "space-between", // ✅ 좌우 정렬
                alignItems: "center",
              }}
            >
              <span>{activeMenu}</span>
              <span style={{ fontSize: "13px", color: "#888" }}>▾</span>
            </div>

            {showDropdown && (
              <div
                style={{
                  marginTop: "4px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "absolute",
                  zIndex: 10,
                  width: "100%",
                }}
              >
                {[
                  "내 정보",
                  "수강정보",
                  "결제내역",
                  "쿠폰",
                  "포인트",
                  "1:1문의",
                ].map((label) => (
                  <div
                    key={label}
                    onClick={() => {
                      setShowDropdown(false);
                      router.push(`/mypage?menu=${label}`);
                    }}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      background: activeMenu === label ? "#f5f5f5" : "#fff",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MyPageSidebar
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        )}

<div style={{
  flex: 1,
  padding: isMobile ? "0 12px" : "0 20px",
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "100vw",
}}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
