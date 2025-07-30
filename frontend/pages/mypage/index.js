import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import axios from "axios";
import MyPageSidebar from "../../components/mypage/MyPageSidebar";
// 자식 컴포넌트들
import MyCourse from "../../components/mypage/MyCourse";
import MyInfo from "../../components/mypage/MyInfo";
import PaymentHistory from "../../components/mypage/PaymentHistory";
import Coupons from "../../components/mypage/Coupons";
import Points from "../../components/mypage/Points";
import Inquiries from "../../components/mypage/Inquiries";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import MyPageMenuDrawer from "../../components/mypage/MyPageMenuDrawer"; // 추가
axios.defaults.withCredentials = true;

export default function MyPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("내 정보");
  const [myData, setMyData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const isTabletOrBelow = useIsTabletOrBelow();
  const [drawerOpen, setDrawerOpen] = useState(false); // 추가
  useEffect(() => {
    if (!router.isReady) return;

    const menu = router.query.menu || "내 정보";
    setActiveMenu(menu);
    fetchData(menu);
  }, [router.query.menu]);

  async function fetchData(menu) {
    setLoading(true);
    setErrorMessage("");
    setMyData([]);

    try {
      let endpoint = "";
      if (menu === "내 정보") endpoint = "/mypage/info";
      else if (menu === "수강정보") endpoint = "/mypage/courses";
      else if (menu === "결제내역") endpoint = "/mypage/payments";
      else if (menu === "쿠폰") endpoint = "/mypage/coupons";
      else if (menu === "포인트") endpoint = "/mypage/points";
      else if (menu === "1:1문의") endpoint = "/mypage/inquiries";

      if (endpoint) {
        const res = await api.get(endpoint);
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
        return <MyCourse {...commonProps} />;
      case "결제내역":
        return <PaymentHistory {...commonProps} />;
      case "쿠폰":
        return <Coupons {...commonProps} />;
      case "포인트":
        return <Points {...commonProps} />;
      case "1:1문의":
        return <Inquiries {...commonProps} />;
      default:
        return <MyCourse {...commonProps} />;
    }
  };

  return (
    <div style={{ background: "#fefefe", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          minHeight: "100vh",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {!isTabletOrBelow ? (
          <>
            <MyPageSidebar
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
            <div
              style={{
                marginLeft: 0,
                padding: "0 20px",
                boxSizing: "border-box",
                width: "100%",
                minWidth: 0,
                overflow: "visible",
              }}
            >
              {renderContent()}
            </div>
          </>
        ) : (
          <>
            <MyPageMenuDrawer
              open={drawerOpen}
              setOpen={setDrawerOpen}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
            <div
              style={{
                padding: "0 8px",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            >
              {renderContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
