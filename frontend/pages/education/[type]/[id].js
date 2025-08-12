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
  MessageCircle, // ✅ 카카오 버튼 아이콘
} from "lucide-react";

import { useIsMobile, useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function EducationScheduleDetailPage() {
  const router = useRouter();
  const { refreshCart } = useCartContext();
  const { user } = useUserContext();
  const { type, id } = router.query;
  const [schedule, setSchedule] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTabletOrBelow = useIsTabletOrBelow();
  const { showAlert } = useGlobalAlert();
  const HEADER_HEIGHT = 80; // 헤더 높이에 맞게 조정

  const tabsRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  // ✅ Toss 결제 인스턴스 준비
  // ✅ Toss 결제 인스턴스 준비
  const tossPaymentsRef = useRef(null);
  const [tossReady, setTossReady] = useState(false);

  // ✅ 바로구매 임시 cart_item 정리용
  const lastBuyNowCartItemIdRef = useRef(null);
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/education/schedules/${id}`)
      .then((res) => {
        if (res.data.success) setSchedule(res.data.schedule);
        else showAlert("일정 정보를 불러오지 못했습니다.");
      })
      .catch(() => showAlert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  // ✅ sticky 미작동 환경 폴백: 특정 지점 이후 fixed 전환
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      // 탭 상단이 헤더 높이와 같거나 위로 올라가면 fixed로 전환
      setStuck(rect.top <= HEADER_HEIGHT);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [HEADER_HEIGHT]);

  const unitPrice = useMemo(
    () => Number(schedule?.price ?? schedule?.product_price ?? 0),
    [schedule]
  );

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
    if (!tossReady || !tossPaymentsRef.current) {
      showAlert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      // 1) 서버에 주문 준비(펜딩 생성)
      // 1) 임시 장바구니 항목 생성
      const addRes = await api.post("/cart/items", {
        schedule_id: schedule.id,
        quantity,
        unit_price: unitPrice,
        type: "buyNow", // 구분용
      });
      const cartItemId = addRes?.data?.item?.id || addRes?.data?.id;
      if (!cartItemId) {
        showAlert("바로구매 준비에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      // ✅ 이후 취소 시 정리할 수 있도록 보관
      lastBuyNowCartItemIdRef.current = Number(cartItemId);
      // 2) 결제 준비
      const prepareRes = await api.post("/payments/toss/prepare", {
        cart_item_ids: [Number(cartItemId)],
        coupon_id: null,
        used_point: 0,
      });

      // 응답 안전 처리(백엔드 형식에 맞게 유연 파싱)
      const data = prepareRes?.data?.data || prepareRes?.data || {};
      const orderId = data.orderId || data.order_id;
      const amount = Number(data.amount ?? unitPrice * quantity);
      const orderName = data.orderName || data.order_name || schedule.title;

      if (!orderId || !amount) {
        showAlert("주문 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
        return;
      }

      // 2) 토스 결제창 호출
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = `${origin}/payments/toss/success`;
      const failUrl = `${origin}/payments/toss/fail`;

      await tossPaymentsRef.current.requestPayment("카드", {
        amount,
        orderId,
        orderName,
        // 선택: 고객 식별 정보
        customerName: user?.name || user?.username || user?.email || "고객",
        successUrl,
        failUrl,
      });
      // 요청 후 흐름은 토스가 success/fail로 리다이렉트

      // 요청 후 흐름은 토스가 success/fail로 리다이렉트
    } catch (e) {
      // ✅ 사용자가 결제창을 닫아 취소한 경우(토스 SDK: USER_CANCEL 등)
      const isUserCancel =
        e?.code === "USER_CANCEL" ||
        e?.message?.includes("취소") ||
        e?.message?.toLowerCase?.()?.includes("cancel");

      if (isUserCancel) {
        // ✅ 임시 cart_item 정리 (성공/실패 페이지로 안 가므로 수동 삭제)
        const id = lastBuyNowCartItemIdRef.current;
        if (id) {
          try {
            await api.delete(`/cart/items/${id}`);
          } catch {}
          lastBuyNowCartItemIdRef.current = null;
        }
        showAlert("결제를 취소하였습니다.");
        return; // ❗️오류로 처리하지 않음
      }

      // 그 외 실제 오류
      console.error("바로구매 결제 시작 실패", e);
      showAlert("결제 시작에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [user, schedule, quantity, unitPrice, tossReady, router, showAlert]);

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
      const payload = {
        schedule_id: schedule.id,
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
  }, [user, schedule, quantity, unitPrice, refreshCart, router, showAlert]);

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

      // ✅ 제목/설명 길이 제한(총 200자 이하)
      const rawTitle = schedule?.title || "교육 일정";
      const rawDesc = schedule?.description || "상세 페이지에서 확인해 주세요.";
      const title = rawTitle.slice(0, 80);
      const desc = rawDesc.slice(0, 110);

      // ✅ base64 이미지 방지 + 절대경로 보장
      let pick =
        schedule?.image_url || schedule?.product_image || "/no-image.png";
      if (pick.startsWith("data:image")) {
        pick = "/no-image.png"; // 카카오에서 허용하는 정적 이미지로 대체
      }
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
        buttons: [
          { title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } },
        ],
      };

      console.debug(
        "[KakaoShare] init:",
        Kakao.isInitialized(),
        "img:",
        imageUrl
      );

      if (Kakao.Share?.sendDefault) {
        Kakao.Share.sendDefault(payload);
      } else if (Kakao.Link?.sendDefault) {
        Kakao.Link.sendDefault(payload);
      } else {
        showAlert("카카오톡 공유를 사용할 수 없습니다.");
      }
    } catch {
      showAlert("카카오톡 공유 중 오류가 발생했습니다.");
    }
  }, [schedule, showAlert]);

  if (loading) return null;
  if (!schedule)
    return <p style={{ padding: 40 }}>일정 정보를 찾을 수 없습니다.</p>;

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
    <div
      style={{ maxWidth: 1200, margin: "0 auto", padding: 20, color: "#333" }}
    >
      {/* 브레드크럼 */}
      <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
        <span
          onClick={() => router.push("/education/followup")}
          style={{ cursor: "pointer", marginRight: 6 }}
        >
          교육
        </span>
        &gt;
        <span
          onClick={() => router.push(`/education/${type}`)}
          style={{
            cursor: "pointer",
            marginLeft: 6,
            textTransform: "capitalize",
          }}
        >
          {type}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isTabletOrBelow ? "column" : "row",
          gap: 40,
          alignItems: "flex-start",
        }}
      >
        {/* 썸네일 */}
        <div style={{ flex: 1 }}>
          <img
            src={
              schedule.image_url || schedule.product_image || "/no-image.png"
            }
            alt={schedule.title}
            style={{
              width: "100%",
              borderRadius: 8,
              objectFit: "cover",
              display: "block",
              backgroundColor: "#f9f9f9",
            }}
          />
        </div>

        {/* 우측 정보 패널 */}
        <div
          style={{
            flex: 1,
            alignSelf: "flex-start",
          }}
        >
          {/* 카테고리 태그 */}
          <div
            style={{
              display: "inline-block",
              padding: "4px 8px",
              background: "#eef5ff",
              color: "#0070f3",
              fontSize: 12,
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            {type}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              {schedule.title}
            </h1>
            {/* 링크 복사 */}
            <button
              onClick={handleCopyLink}
              aria-label="링크 복사"
              title="링크 복사"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <Share2 size={16} color="#555" />
            </button>
            {/* ✅ 카카오톡 공유 */}
            <button
              onClick={handleShareKakao}
              aria-label="카카오톡 공유"
              title="카카오톡 공유"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <MessageCircle size={16} color="#F7E600" />
            </button>
          </div>

          <p style={{ fontSize: 20, fontWeight: "bold", color: "#e60023" }}>
            {Number(schedule.price).toLocaleString()}원
          </p>

          {/* 정보 카드 */}
          <div
            style={{ marginTop: 20, background: "#f7f9fc", borderRadius: 8 }}
          >
            {[
              {
                label: "교육기간",
                value: (() => {
                  const start = new Date(schedule.start_date);
                  const end = new Date(schedule.end_date);
                  const sameDay = start.toDateString() === end.toDateString();
                  return sameDay
                    ? start.toLocaleDateString()
                    : `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;
                })(),
                icon: <Calendar size={16} />,
              },
              {
                label: "장소",
                value: schedule.location || "-",
                icon: <MapPin size={16} />,
              },
              {
                label: "강사",
                value: schedule.instructor || "-",
                icon: <User size={16} />,
              },
              {
                label: "정원",
                value: `${schedule.total_spots ?? "-"}명`,
                icon: <Users size={16} />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderBottom: idx < 3 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                {item.icon}
                <strong style={{ minWidth: 60 }}>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>

          {/* 수량 + 가격 */}
          <div style={{ marginTop: 20 }}>
            <span style={{ fontWeight: 500, marginRight: 8 }}>수량</span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                style={{
                  width: 32,
                  height: 36,
                  border: "none",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                –
              </button>
              <div
                style={{
                  width: 50,
                  textAlign: "center",
                  fontSize: 15,
                  lineHeight: "36px",
                  background: "#fff",
                }}
              >
                {quantity}
              </div>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                style={{
                  width: 32,
                  height: 36,
                  border: "none",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                +
              </button>
            </div>
            <div style={{ marginTop: 10, fontWeight: "bold" }}>
              총 결제금액: {Number(unitPrice * quantity).toLocaleString()}원
            </div>
          </div>

          {/* CTA 버튼 */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
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

      <div
        ref={tabsRef}
        style={{
          position: stuck ? "fixed" : "sticky",
          top: HEADER_HEIGHT,
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
        <TabProductInquiry
          productId={schedule.product_id || schedule.productId}
        />
      </div>
      <div id="refund" style={{ minHeight: 400, paddingTop: 40 }}>
        <TabRefundPolicy />
      </div>

      {/* ⬇️ 이 페이지에서만 #__next overflow를 해제해 sticky 복구 */}
      <style jsx global>{`
        #__next {
          overflow: visible !important;
        }
      `}</style>
    </div>
  );
}
