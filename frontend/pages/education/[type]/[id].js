// 개선된 EducationScheduleDetailPage.js
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useCartContext } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext";
import ProductTabs from "@/components/product/ProductTabs";
import TabProductDetail from "@/components/product/TabProductDetail";
import TabProductReviews from "@/components/product/TabProductReviews";
import TabProductInquiry from "@/components/product/TabProductInquiry";
import TabRefundPolicy from "@/components/product/TabRefundPolicy";
import {
  ShoppingCart,
  Calendar,
  MapPin,
  User,
  Users,
  Share2,
  MessageCircle,
} from "lucide-react";
import { useIsMobile, useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function EducationScheduleDetailPage() {
  const router = useRouter();
  const { refreshCart } = useCartContext();
  const { user } = useUserContext();
  const { type, id } = router.query;

  const [schedule, setSchedule] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTabletOrBelow = useIsTabletOrBelow();
  const { showAlert } = useGlobalAlert();
 // ✅ 동적 헤더 높이
const [headerTop, setHeaderTop] = useState(80);
useEffect(() => {
  const measure = () => {
    const h = document.querySelector("header")?.offsetHeight;
    setHeaderTop(h || (isMobile ? 56 : 80));
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  return () => {
    window.removeEventListener("resize", measure);
    window.removeEventListener("orientationchange", measure);
  };
}, [isMobile]);


  const tabsRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  // Toss 결제 스크립트 준비
  const tossPaymentsRef = useRef(null);
  const [tossReady, setTossReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = () => {
      if (window.TossPayments && !tossPaymentsRef.current) {
        try {
          const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
          if (!clientKey) {
            console.error("NEXT_PUBLIC_TOSS_CLIENT_KEY 누락");
            return;
          }
          tossPaymentsRef.current = window.TossPayments(clientKey);
          setTossReady(true);
        } catch (e) {
          console.error("TossPayments 초기화 실패", e);
        }
      }
    };

    if (!window.TossPayments) {
      const s = document.createElement("script");
      s.src = "https://js.tosspayments.com/v1/payment";
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    } else {
      init();
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/education/schedules/${id}`)
      .then((res) => {
        if (res.data.success) {
          const sc = res.data.schedule;
          setSchedule(sc);
          const sess = Array.isArray(sc.sessions) ? sc.sessions : [];
          if (sess.length === 1 && (sess[0].id || sess[0].session_id)) {
            setSelectedSessionId(sess[0].id || sess[0].session_id);
          }
        } else {
          showAlert("일정 정보를 불러오지 못했습니다.");
        }
      })
      .catch(() => showAlert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id, showAlert]);

  // sticky 폴백
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
  
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      setStuck(rect.top <= headerTop);
    };
  
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerTop]);
  

  // 가격/모집현황 계산
  const unitPrice = useMemo(
    () => Number(schedule?.price ?? schedule?.product_price ?? 0),
    [schedule]
  );
  const seats = useMemo(() => {
    const total = Number(schedule?.total_spots ?? 0) || 0;
    const reserved =
      Number(schedule?.reserved_spots ?? schedule?.booked_count ?? 0) || 0;
    const remaining = Math.max(total - reserved, 0);
    return { total, reserved, remaining };
  }, [schedule]);

  // 회차/선택
  const sessionsArr = useMemo(
    () => (Array.isArray(schedule?.sessions) ? schedule.sessions : []),
    [schedule]
  );
  const sessionsCount = useMemo(
    () =>
      sessionsArr.filter(
        (s) => s && (s.id || s.session_id || s.start_date || s.end_date)
      ).length,
    [sessionsArr]
  );
  const useDropdown = useMemo(
    () => isMobile || sessionsCount >= 5,
    [isMobile, sessionsCount]
  );

  // 장바구니/바로구매
  const handleBuyNow = useCallback(async () => {
    if (!user) {
      const redirect =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      showAlert("로그인 후 결제하실 수 있습니다.");
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    if (!schedule) {
      showAlert("일정 정보를 불러오지 못했습니다.");
      return;
    }

    try {
      if (sessionsCount > 1 && !selectedSessionId) {
        showAlert("원하시는 회차를 선택해 주세요.");
        return;
      }
      const addRes = await api.post("/cart/items", {
        schedule_id: schedule.id,
        schedule_session_id: selectedSessionId || null,
        quantity,
        unit_price: unitPrice,
        type: "buyNow",
      });
      const cartItemId = addRes?.data?.item?.id || addRes?.data?.id;
      if (!cartItemId) {
        showAlert("바로구매 준비에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("BUY_NOW_IDS", JSON.stringify([Number(cartItemId)]));
      }
      router.push(`/checkout?mode=buyNow&ids=${Number(cartItemId)}`);
    } catch (e) {
      console.error("바로구매 준비 실패", e);
      showAlert("준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }, [user, schedule, sessionsCount, selectedSessionId, quantity, unitPrice, router, showAlert]);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      const redirect =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      showAlert("로그인 후 장바구니를 이용하실 수 있습니다.");
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    try {
      if ((schedule.sessions || []).length > 1 && !selectedSessionId) {
        showAlert("원하시는 회차를 선택해 주세요.");
        return;
      }
      const payload = {
        schedule_id: schedule.id,
        schedule_session_id: selectedSessionId || null,
        quantity,
        unit_price: unitPrice,
        type: "cart",
      };
      const res = await api.post("/cart/items", payload);
      if (res.data.success) {
        showAlert("장바구니에 담았습니다!");
        await refreshCart();
      } else {
        showAlert("장바구니 담기에 실패했습니다.");
      }
    } catch {
      showAlert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [user, schedule, selectedSessionId, quantity, unitPrice, refreshCart, router, showAlert]);

  // 공유
  const handleCopyLink = useCallback(async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      showAlert("링크를 복사했습니다.");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = typeof window !== "undefined" ? window.location.href : "";
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showAlert("링크를 복사했습니다.");
      } catch {
        showAlert("복사에 실패했습니다. 주소창의 URL을 직접 복사해 주세요.");
      }
    }
  }, [showAlert]);

  const handleShareKakao = useCallback(() => {
    try {
      if (typeof window === "undefined" || !window.Kakao) {
        showAlert("카카오 SDK를 불러오지 못했습니다.");
        return;
      }
      const Kakao = window.Kakao;
      if (!Kakao.isInitialized()) {
        Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
      const url = window.location.href;
      const rawTitle = schedule?.title || "교육 일정";
      const rawDesc = schedule?.description || "상세 페이지에서 확인해 주세요.";
      const title = rawTitle.slice(0, 80);
      const desc = rawDesc.slice(0, 110);
      let pick =
        schedule?.image_url || schedule?.product_image || "/images/no-image.png";
      if (pick.startsWith("data:image")) pick = "/images/no-image.png";
      const imageUrl = pick.startsWith("http")
        ? pick
        : `${window.location.origin}${pick.startsWith("/") ? "" : "/"}${pick}`;

      const payload = {
        objectType: "feed",
        content: {
          title,
          description: desc,
          imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } }],
      };

      if (Kakao.Share?.sendDefault) Kakao.Share.sendDefault(payload);
      else if (Kakao.Link?.sendDefault) Kakao.Link.sendDefault(payload);
      else showAlert("카카오톡 공유를 사용할 수 없습니다.");
    } catch {
      showAlert("카카오톡 공유 중 오류가 발생했습니다.");
    }
  }, [schedule, showAlert]);

  if (loading) return null;
  if (!schedule) return <p style={{ padding: 40 }}>일정 정보를 찾을 수 없습니다.</p>;

  const actionBtnStyle = (main) => ({
    flex: 1,
    minWidth: isMobile ? undefined : "40%",
    padding: isMobile ? "14px 0" : "12px 16px",
    border: main ? "none" : "1px solid #0070f3",
    backgroundColor: main ? "#0070f3" : "#fff",
    color: main ? "#fff" : "#0070f3",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15,
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20, color: "#333" }}>
      {/* 브레드크럼 */}
      <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        <span onClick={() => router.push("/education/followup")} style={{ cursor: "pointer", marginRight: 6 }}>
          교육
        </span>
        &gt;
        <span
          onClick={() => router.push(`/education/${type}`)}
          style={{ cursor: "pointer", marginLeft: 6, textTransform: "capitalize" }}
        >
          {type}
        </span>
      </div>

      {/* ✅ 반응형 히어로 섹션 */}
      <div className="hero">
        {/* 썸네일 */}
        <div className="left">
          <div className="thumbWrap">
            <img
              src={schedule.image_url || schedule.product_image || "/images/no-image.png"}
              alt={schedule.title}
              className="thumbImg"
            />
          </div>
        </div>

        {/* 우측 정보 패널 */}
        <div className="right">
          {/* 카테고리 + 상태 배지 */}
          <div className="badgeRow">
            <span className="typeBadge">{type}</span>
            <span
              className="statusBadge"
              style={{
                color: schedule?.is_active ? "#047857" : "#9CA3AF",
                background: schedule?.is_active ? "#ECFDF5" : "#F3F4F6",
                border: `1px solid ${schedule?.is_active ? "#A7F3D0" : "#E5E7EB"}`,
              }}
            >
              {schedule?.is_active ? "판매중" : "마감"}
            </span>
          </div>

          {/* 타이틀 + 공유 */}
          <div className="titleRow">
            <h1 className="title">{schedule.title}</h1>
            <div className="titleActions">
              <button onClick={handleCopyLink} aria-label="링크 복사" title="링크 복사" className="iconBtn">
                <Share2 size={16} color="#555" />
              </button>
              <button
  onClick={handleShareKakao}
  aria-label="카카오톡 공유"
  title="카카오톡 공유"
  className="kakaoBtn"
>
  {/* 말풍선 채움(다크브라운) */}
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3C7.03 3 3 6.2 3 10c0 2.47 1.76 4.63 4.4 5.78l-.47 3.22 3.05-2.02c.63.09 1.28.13 1.94.13 4.97 0 9-3.2 9-7s-4.03-7-9-7z"
      fill="#3C1E1E"
    />
  </svg>
</button>

            </div>
          </div>

          {/* 가격 */}
          <p className="price">{Number(unitPrice * quantity).toLocaleString()}원</p>

          {schedule?.description && (
  <p className="desc lineClamp">{schedule.description}</p>
)}


          {/* 회차 선택 */}
          {sessionsCount > 1 && (
            <div className="sessionCard">
              <div className="sessionHeader">
                <div className="sessionTitle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  <span>
                    교육기간{" "}
                    {Number(schedule?.lecture_hours) > 0 && (
                      <span className="hours">(전체 {Number(schedule.lecture_hours)}시간)</span>
                    )}
                  </span>
                </div>
              </div>

              {useDropdown ? (
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                  className="sessionSelect"
                >
                  {sessionsCount > 1 && !selectedSessionId && <option value="">회차를 선택하세요</option>}
                  {sessionsArr.map((s, idx) => {
                    const sid = s.id || s.session_id || idx;
                    const startStr = new Date(s.start_date).toLocaleDateString();
                    const endStr = new Date(s.end_date).toLocaleDateString();
                    const sameDay =
                      new Date(s.start_date).toDateString() === new Date(s.end_date).toDateString();
                    const dateLabel = sameDay ? startStr : `${startStr} ~ ${endStr}`;
                    return (
                      <option key={sid} value={sid}>
  {`(${idx + 1}회차) ${dateLabel} ─ ${s.remaining_spots ?? 0}명 남음 / 정원 ${s.total_spots ?? 0}명`}
</option>

                    );
                  })}
                </select>
              ) : (
                <div className="sessionList">
                  {sessionsArr.map((s, idx) => {
                    const sid = s.id || s.session_id || idx;
                    const startStr = new Date(s.start_date).toLocaleDateString();
                    const endStr = new Date(s.end_date).toLocaleDateString();
                    const sameDay =
                      new Date(s.start_date).toDateString() === new Date(s.end_date).toDateString();
                    const label = sameDay ? startStr : `${startStr} ~ ${endStr}`;
                    const isSelected = selectedSessionId === sid;
                    return (
                      <label key={sid} className={`sessionItem ${isSelected ? "selected" : ""}`}>
  <input
    type="radio"
    name="session"
    checked={isSelected}
    onChange={() => setSelectedSessionId(sid)}
  />
  <span className="sessionIdx">{`(${idx + 1}회차)`}</span>
  <span className="sessionDate">{label}</span>
  {/* 모집 현황 아이콘 + 텍스트 */}
  <span className="sessionSeats">
    <Users size={14} style={{ marginRight: 4, color: "#555" }} />
    {s.remaining_spots ?? 0}명 남음 / 정원 {s.total_spots ?? 0}명
  </span>
</label>

                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 정보 카드 */}
          <div className="infoCard">
            {[
              ...(sessionsCount > 1
                ? []
                : [
                    {
                      label: "교육기간",
                      value: (() => {
                        const sess = (schedule.sessions || []).find(
                          (s) => (s.id || s.session_id) === selectedSessionId
                        );
                        const sStart = new Date(sess?.start_date || schedule.start_date);
                        const sEnd = new Date(sess?.end_date || schedule.end_date);
                        const sameDay = sStart.toDateString() === sEnd.toDateString();
                        const base = sameDay
                          ? sStart.toLocaleDateString()
                          : `${sStart.toLocaleDateString()} ~ ${sEnd.toLocaleDateString()}`;
                        const hours =
                          Number(schedule?.lecture_hours) > 0
                            ? ` (전체 ${Number(schedule.lecture_hours)}시간)`
                            : "";
                        return base + hours;
                      })(),
                      icon: <Calendar size={16} />,
                    },
                  ]),
              { label: "장소", value: schedule.location || "-", icon: <MapPin size={16} /> },
              { label: "강사", value: schedule.instructor || "-", icon: <User size={16} /> },
              {
                label: "모집",
                value: (() => {
                  // 선택된 회차 찾기 (다회차일 경우)
                  const sess = (schedule.sessions || []).find(
                    (s) => (s.id || s.session_id) === selectedSessionId
                  );
              
                  if (sessionsCount > 1 && sess) {
                    // 다회차 → 선택된 회차 기준
                    const total = Number(sess.total_spots ?? 0);
                    const remaining = Number(sess.remaining_spots ?? Math.max(total - (sess.reserved_spots ?? 0), 0));
                    return `잔여 ${remaining}명(총원 ${total}명)`;
                  } else {
                    // 단회차 → schedule 단위 기준
                    const total = Number(schedule.total_spots ?? 0);
                    const remaining = Number(schedule.remaining_spots ?? Math.max(total - (schedule.reserved_spots ?? 0), 0));
                    return `잔여 ${remaining}명(총원 ${total}명)`;
                  }
                })(),
                icon: <Users size={16} />,
              },
              
              
            ].map((item, idx, arr) => (
              <div className="infoRow" key={`${item.label}-${idx}`}>
                {item.icon}
                <strong className="infoLabel">{item.label}</strong>
                <span className="infoValue">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 수량 + CTA */}
          <div className="qtyRow">
            <span className="qtyLabel">수량</span>
            <div className="qtyBox">
              <button onClick={() => setQuantity((p) => Math.max(1, p - 1))} className="qtyBtn">
                –
              </button>
              <div className="qtyVal">{quantity}</div>
              <button onClick={() => setQuantity((p) => p + 1)} className="qtyBtn">
                +
              </button>
            </div>
          </div>

          <div className="ctaRow">
            <button onClick={handleAddToCart} style={actionBtnStyle(false)}>
              <ShoppingCart size={16} style={{ marginRight: 4 }} />
              장바구니
            </button>
            <button onClick={handleBuyNow} style={actionBtnStyle(true)}>
              바로 구매
            </button>
          </div>
        </div>
      </div>

      {/* 탭 영역 */}
      <div
  ref={tabsRef}
  style={{
    position: stuck ? "fixed" : "sticky",
    top: headerTop,   // ✅ 동적 헤더 높이 적용
    left: 0,
    right: 0,
    zIndex: 100,
    background: "#fff",
    borderBottom: "1px solid #eee",
    padding: "8px 0",
  }}
>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <ProductTabs
            tabs={[
              { id: "detail", label: "상품상세" },
              { id: "review", label: "상품후기" },
              { id: "inquiry", label: "상품문의" },
              { id: "refund", label: "환불안내" },
            ]}
          />
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div id="detail" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductDetail html={schedule.detail} />
      </div>
      <div id="review" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductReviews
          productId={schedule.product_id || schedule.productId}
          scheduleId={schedule.id}
        />
      </div>
      <div id="inquiry" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabProductInquiry productId={schedule.product_id || schedule.productId} />
      </div>
      <div id="refund" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabRefundPolicy />
      </div>

      {/* 전역 보정 */}
      <style jsx>{`
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
  }

  /* ✅ 썸네일: 정사각 + 축소 표시(잘림 방지) */
  .thumbWrap {
    width: 100%;
    aspect-ratio: 1/1;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }
  .thumbImg {
    width: 100%;
    height: 100%;
    object-fit: contain; /* cover → contain */
    display: block;
    background: #fff;
  }

  .badgeRow {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
  .typeBadge {
    display: inline-block;
    padding: 4px 8px;
    background: #eef5ff;
    color: #0070f3;
    font-size: 12px;
    border-radius: 4px;
  }
  .statusBadge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .titleRow {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    flex: 1;
  }
  .titleActions { display: flex; gap: 8px; }
  .iconBtn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  }
  /* ✅ 카카오 버튼 (노란 원 + 채워진 말풍선) */
  .kakaoBtn{
    display:inline-flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:999px;
    background:#FEE500;border:1px solid #F0D000;cursor:pointer;
  }

  .price {
    font-size: 20px;
    font-weight: 700;
    color: #e60023;
    margin: 4px 0 0;
  }
  .desc{margin-top:6px;color:#555;font-size:14px;line-height:1.5;}
  .lineClamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

  .sessionCard {
    margin-top: 14px; border: 1px solid #eee; border-radius: 8px;
    padding: 12px; background: #fff;
  }
  .sessionHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .sessionTitle  { display: flex; align-items: center; gap: 8px; font-weight: 600; }
  .hours { font-weight: 500; font-size: 12px; color: #555; margin-left: 6px; }
  .sessionSelect { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
  .sessionList { display: grid; gap: 8px; }
  .sessionItem {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer;
  }
  .sessionItem.selected { background: #eef5ff; border-color: #cfe2ff; }
  .sessionIdx { color: #555; font-size: 12px; }
  .sessionDate { line-height: 1.4; }

  .infoCard { margin-top: 20px; background: #f7f9fc; border-radius: 8px; }
  .infoRow {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  .infoRow:last-child { border-bottom: none; }
  .infoLabel { min-width: 60px; }

  .qtyRow { margin-top: 20px; display: flex; align-items: center; gap: 8px; }
  .qtyLabel { font-weight: 500; }
  .qtyBox { display: inline-flex; align-items: center; border: 1px solid #ccc; border-radius: 6px; overflow: hidden; }
  .qtyBtn { width: 32px; height: 36px; border: none; background: #fff; cursor: pointer; font-size: 18px; }
  .qtyVal { width: 50px; text-align: center; font-size: 15px; line-height: 36px; background: #fff; }

  .ctaRow { display: flex; gap: 12px; margin-top: 20px; }

  /* 반응형 */
  @media (max-width: 1024px) {
    .hero { grid-template-columns: 1fr; gap: 20px; }
    /* ⛔ thumbWrap 4:3 오버라이드 제거 → 항상 1:1 유지 */
    .title { font-size: 22px; }
  }
  @media (max-width: 768px) {
    .title { font-size: 20px; }
    .price { font-size: 18px; }
    .ctaRow { flex-direction: column; }
  }
`}</style>


      {/* 이 페이지에서만 #__next overflow 해제 (sticky 복구) */}
      <style jsx global>{`
        #__next {
          overflow: visible !important;
        }
      `}</style>
    </div>
  );
}
