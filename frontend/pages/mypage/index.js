import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import Head from "next/head"; // 👈 추가

// ✅ 동적 로딩: 필요할 때만 다운로드
const MyPageSidebar = dynamic(
  () => import("../../components/mypage/MyPageSidebar"),
  { ssr: false, loading: () => null }
);
const MyPageMenuDrawer = dynamic(
  () => import("../../components/mypage/MyPageMenuDrawer"),
  { ssr: false, loading: () => null }
);
const MyCourse = dynamic(() => import("../../components/mypage/MyCourse"), {
  ssr: false,
  loading: () => null,
});
const MyInfo = dynamic(() => import("../../components/mypage/MyInfo"), {
  ssr: false,
  loading: () => null,
});
const PaymentHistory = dynamic(
  () => import("../../components/mypage/PaymentHistory"),
  { ssr: false, loading: () => null }
);
const Coupons = dynamic(() => import("../../components/mypage/Coupons"), {
  ssr: false,
  loading: () => null,
});
const Points = dynamic(() => import("../../components/mypage/Points"), {
  ssr: false,
  loading: () => null,
});
const Inquiries = dynamic(() => import("../../components/mypage/Inquiries"), {
  ssr: false,
  loading: () => null,
});

export default function MyPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("내 정보");
  const [myData, setMyData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const isTabletOrBelow = useIsTabletOrBelow();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ 요청 제어
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);   // 최신 요청 식별자
  const mountedRef = useRef(true);

  // ✅ 디버그 로그
  const DEBUG = true;
  const log = (...args) => DEBUG && console.log("[MyPage]", ...args);

  // 마운트/언마운트 추적 (StrictMode 재마운트 대응)
useEffect(() => {
  mountedRef.current = true;              // ✅ 재마운트 시 true로 복구
  log("mounted");
  return () => {
    mountedRef.current = false;
    if (controllerRef.current) {
      controllerRef.current.abort();
      log("aborted on unmount");
    }
  };
}, []);


  // ✅ 메뉴 같아도 항상 fetch (중복은 AbortController로 해결)
  useEffect(() => {
    if (!router.isReady) return;
    const menu = router.query.menu || "내 정보";
    log("route ready, menu =", menu);
    setActiveMenu(menu);
    fetchData(menu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.menu]);

  async function fetchData(menu) {
    // 이전 요청 취소
    if (controllerRef.current) {
      controllerRef.current.abort();
      log("prev request aborted");
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    // 이 요청의 id
    const rid = ++requestIdRef.current;

    setLoading(true);
    setErrorMessage("");
    setMyData([]);

    const t0 = performance.now();
    try {
      let endpoint = "";
      if (menu === "내 정보") endpoint = "/mypage/info";
      else if (menu === "수강정보") endpoint = "/mypage/courses";
      else if (menu === "결제내역") endpoint = "/mypage/payments";
      else if (menu === "쿠폰") endpoint = "/mypage/coupons";
      else if (menu === "포인트") endpoint = "/mypage/points";
      else if (menu === "1:1문의") endpoint = "/mypage/inquiries";

      if (!endpoint) {
        log("no endpoint for menu:", menu);
        finish(rid, controller, false);
        return;
      }

      log("REQUEST →", endpoint, "(rid:", rid, ")");
      const res = await api.get(endpoint, { signal: controller.signal });

      log("RESPONSE ←", endpoint, {
        ok: !!res?.data?.success,
        status: res?.status,
        keys: res?.data ? Object.keys(res.data) : null,
        elapsedMs: Math.round(performance.now() - t0),
        rid,
      });

      if (res?.data?.success) {
        const key = Object.keys(res.data).find((k) => k !== "success");
        const payload = res.data[key] || [];
        log("payload length:", Array.isArray(payload) ? payload.length : 1, "(rid:", rid, ")");
        if (rid === requestIdRef.current && mountedRef.current) {
          setMyData(payload);
        }
      } else {
        if (rid === requestIdRef.current && mountedRef.current) {
          setErrorMessage("데이터를 불러오지 못했습니다.");
        }
      }
    } catch (err) {
      if (err?.name === "AbortError" || err?.name === "CanceledError") {
        log("request canceled (rid:", rid, ")");
        // 최신 요청이 아니라면 무시, 최신 요청이면 로딩만 정리
        finish(rid, controller, false);
        return;
      }
      log("ERROR", {
        name: err?.name,
        message: err?.message,
        status: err?.response?.status,
        elapsedMs: Math.round(performance.now() - t0),
        rid,
      });
      if (rid === requestIdRef.current && mountedRef.current) {
        setErrorMessage(
          err?.response?.status === 401 || err?.response?.status === 403
            ? "로그인이 필요합니다."
            : "마이페이지 로딩 중 오류가 발생했습니다."
        );
      }
    } finally {
      finish(rid, controller, true);
    }
  }

  // ✅ 최신 요청만 로딩 종료
  function finish(rid, controller, fromFinally) {
    if (rid !== requestIdRef.current) {
      log("finish skipped (stale rid:", rid, "latest:", requestIdRef.current, ")");
      return;
    }
    if (!mountedRef.current) {
      log("finish skipped (unmounted)");
      return;
    }
    if (!controller.signal.aborted) {
      setLoading(false);
      log("loading=false", fromFinally ? "(finally)" : "(early)");
    } else {
      // 요청이 abort 되었지만 최신 요청이 없을 때 로딩 멈추기
      setLoading(false);
      log("loading=false (aborted latest)");
    }
  }

  const renderContent = () => {
    if (loading) {
      console.log("[MyPage] render: loading skeleton");
      return (
        <div style={{ padding: "16px" }}>
          <div style={{ height: 18, width: "30%", background: "#f3f4f6", borderRadius: 6, marginBottom: 12 }} />
          <div style={{ height: 12, width: "80%", background: "#f3f4f6", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 12, width: "75%", background: "#f3f4f6", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 12, width: "65%", background: "#f3f4f6", borderRadius: 6, marginBottom: 8 }} />
        </div>
      );
    }
    if (errorMessage) {
      console.log("[MyPage] render: errorMessage =", errorMessage);
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
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
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
            {/* ✅ 드로어는 열릴 때만 마운트 */}
            {drawerOpen && (
              <MyPageMenuDrawer
                open={drawerOpen}
                setOpen={setDrawerOpen}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            )}
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
    </>
  );
}
