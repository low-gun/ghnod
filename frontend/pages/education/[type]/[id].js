// 개선된 EducationScheduleDetailPage.js
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
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

  const unitPrice = useMemo(
    () => Number(schedule?.price ?? schedule?.product_price ?? 0),
    [schedule]
  );

  const handleBuyNow = useCallback(() => {
    if (!user) {
      showAlert("로그인 후 결제하실 수 있습니다.");
      router.push("/login");
      return;
    }
    if (!schedule) return showAlert("일정 정보를 불러오지 못했습니다.");
    router.push({
      pathname: "/checkout",
      query: {
        buyNow: encodeURIComponent(
          JSON.stringify({
            schedule_id: schedule.id,
            quantity,
            unit_price: unitPrice,
            discount_price: 0,
          })
        ),
      },
    });
  }, [user, schedule, quantity, unitPrice]);

  const handleAddToCart = useCallback(async () => {
    try {
      const payload = {
        schedule_id: schedule.id,
        quantity,
        unit_price: unitPrice,
        type: "cart",
      };
      const guestToken = localStorage.getItem("guest_token");
      const res = await api.post("/cart/items", payload, {
        headers: { "x-guest-token": guestToken || "" },
      });
      if (res.data.success) {
        showAlert("장바구니에 담았습니다!");
        await refreshCart();
      } else {
        showAlert("장바구니 담기에 실패했습니다.");
      }
    } catch {
      showAlert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [schedule, quantity, unitPrice, refreshCart]);
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
          onClick={() => router.push("/education")}
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

      {/* 상세 설명, 탭 */}
      <div
        style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10 }}
      >
        <ProductTabs
          tabs={[
            { id: "detail", label: "상품상세" },
            { id: "review", label: "상품후기" },
            { id: "inquiry", label: "상품문의" },
            { id: "refund", label: "환불안내" },
          ]}
        />
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
    </div>
  );
}
