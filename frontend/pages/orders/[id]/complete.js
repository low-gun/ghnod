// frontend/pages/orders/[id]/complete.js
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useMemo } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import OrderCompleteSkeleton from "@/components/orders/OrderCompleteSkeleton";
import OrderCompleteStyles from "@/components/orders/OrderCompleteStyles"; // ⬅️ 추가

export default function OrderCompletePage() {
  const router = useRouter();
  const { id: orderId } = router.query;
  const alert = useGlobalAlert(); // ✅ 추가
  const confirm = useGlobalConfirm(); // ✅ 추가 (향후 사용 대비)

  const handleCopy = async (text, doneMsg = "복사되었습니다.") => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      alert?.open?.(doneMsg) || alert?.show?.(doneMsg); // 프로젝트 구현에 맞게 하나가 동작
    } catch (e) {
      console.warn("복사 실패:", e);
      alert?.open?.("복사에 실패했습니다. 다시 시도해 주세요.") ||
        alert?.show?.("복사에 실패했습니다. 다시 시도해 주세요.");
    }
  };
  // 🔒 dev(StrictMode/HMR)에서 useEffect 중복 실행 방지
  const ranRef = useRef(false);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!router.isReady || !orderId) return;
    if (ranRef.current) return; // ✅ 중복 실행 방지
    ranRef.current = true;

    const fetchData = async () => {
      try {
        const [itemRes, userRes] = await Promise.all([
          api.get(`/orders/${orderId}/items`),
          api.get("/user"),
        ]);

        if (!itemRes.data?.order) {
          throw new Error("주문 상세 정보를 찾을 수 없습니다.");
        }

        // 🔎 디버깅: 응답 구조 점검
        if (process.env.NODE_ENV !== "production") {
          console.groupCollapsed("[Complete] /orders/:id debug");
          console.log("route orderId:", orderId);
          console.log("order keys:", Object.keys(itemRes.data.order || {}));
          console.log("order:", itemRes.data.order);
          console.table(
            (itemRes.data.items || []).map((i) => ({
              id: i.id,
              title: i.title,
              qty: i.quantity,
              unit: i.unit_price,
              disc: i.discount_price,
            }))
          );
          console.groupEnd();
        }

        setOrder(itemRes.data.order);
        setItems(itemRes.data.items || []);
        setUser(userRes.data?.user || null);

        await api.put(`/orders/${orderId}`);

        if (userRes.data?.user?.id) {
          try {
            await api.delete("/cart/items/clear");
          } catch (err) {
            console.warn("❌ cart clear 실패:", err);
          }
        }
      } catch (err) {
        console.error("❌ 주문 완료 페이지 오류:", err);
        setErrorMsg("주문 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router.isReady, orderId]);

  // ✅ 금액 계산: 훅 순서 유지 위해 로딩/에러 분기보다 위
  const {
    totalBeforeDiscount,
    couponDiscount,
    pointsUsed,
    totalAfterDiscount,
  } = useMemo(() => {
    const tbd = (items || []).reduce(
      (sum, item) =>
        sum + Number(item?.unit_price ?? 0) * Number(item?.quantity ?? 0),
      0
    );
    const cd = Number(order?.coupon_discount ?? 0);
    const tad = Number(order?.total_amount ?? 0);
    const used = Math.max(0, tbd - cd - tad);

    return {
      totalBeforeDiscount: tbd,
      couponDiscount: cd,
      pointsUsed: used,
      totalAfterDiscount: tad,
    };
  }, [items, order]);

  if (isLoading)
    return <OrderCompleteSkeleton totalAfterDiscount={totalAfterDiscount} />;

  if (errorMsg) return <p style={{ padding: 40, color: "red" }}>{errorMsg}</p>;

  // 표시용 주문번호 (여러 키 폴백, 최후에는 URL orderId)
  const displayOrderNo =
    order?.order_no ||
    order?.orderNo ||
    order?.order_id ||
    order?.id ||
    orderId;

  // PG 주문번호(결제 키/거래번호 등) 후보들
  const displayPgNo = extractPgNo(order);

  return (
    <div className="oc-wrap">
      <div className="oc-card">
        {/* 헤더 */}
        <div className="oc-header">
          <div className="oc-badge" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#10B981" />
              <path
                d="M7 12.5l3.2 3.2L17.5 8.5"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="oc-title">결제가 완료되었습니다!</h1>
          <p className="oc-sub">주문해주셔서 감사합니다.</p>
        </div>

        {/* 주문 메타 */}
        <div className="oc-meta">
          {/* 1행: 주문일시 (두 칸 사용) */}
          {order && (
            <div className="oc-meta-item full">
              <span className="oc-meta-label">주문일시</span>
              <span className="oc-meta-value">
                {formatKSTDate(order?.created_at)}
              </span>
            </div>
          )}
          {/* 2행: 주문번호, PG 주문번호 */}
          {(order || orderId) && (
            <div className="oc-meta-item">
              <span className="oc-meta-label">주문번호</span>
              <span className="oc-meta-value">
                <span className="oc-code">{displayOrderNo}</span>
                <button
                  type="button"
                  className="oc-copy"
                  onClick={() =>
                    handleCopy(displayOrderNo, "주문번호가 복사되었습니다.")
                  }
                  aria-label="주문번호 복사"
                >
                  복사
                </button>
              </span>
            </div>
          )}
          <div className="oc-meta-item">
            <span className="oc-meta-label">PG주문번호</span>
            <span className="oc-meta-value">
              {displayPgNo ? (
                <>
                  <span className="oc-code">{displayPgNo}</span>
                  <button
                    type="button"
                    className="oc-copy"
                    onClick={() =>
                      handleCopy(displayPgNo, "PG주문번호가 복사되었습니다.")
                    }
                    aria-label="PG주문번호 복사"
                  >
                    복사
                  </button>
                </>
              ) : (
                <span style={{ color: "#6b7280", fontWeight: 500 }}>
                  미표시
                </span>
              )}
            </span>
          </div>

          {/* 3행: 주문자, 이메일 */}
          {user && (
            <div className="oc-meta-item">
              <span className="oc-meta-label">주문자</span>
              <span className="oc-meta-value">
                {user?.username || user?.email}
              </span>
            </div>
          )}
          {user?.email && (
            <div className="oc-meta-item">
              <span className="oc-meta-label">이메일</span>
              <span className="oc-meta-value">{user.email}</span>
            </div>
          )}
        </div>

        {/* 주문 상품 */}
        <section className="oc-section">
          <h2 className="oc-section-title">주문 상품</h2>
          <div className="oc-items">
            {items.map((item) => {
              const toNum = (v) => Number(String(v ?? 0).replaceAll(",", ""));
              const unit = toNum(item.unit_price);
              const disc = toNum(item.discount_price);
              const qty = toNum(item.quantity);

              // 정가(할인 전)로 고정
              const priceEach = unit;
              const lineTotal = priceEach * qty;
              return (
                <div key={item.id} className="oc-item">
                  <div className="oc-thumb">
                    {item.thumbnail_url ? (
                      <>
                        <img
                          src={item.image_url} 
                          alt="상품 썸네일"
                          className="oc-img"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fb =
                              e.currentTarget.parentElement?.querySelector(
                                ".oc-thumb-fallback"
                              );
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                        <span
                          className="oc-thumb-fallback"
                          style={{ display: "none" }}
                        >
                          이미지 없음
                        </span>
                      </>
                    ) : (
                      <span className="oc-thumb-fallback">
                        이미지{"\n"}없음
                      </span>
                    )}
                  </div>

                  <div className="oc-item-main">
  <div className="oc-item-title">{item.title}</div>
  {/* ✅ 회차 기간+시간 */}
  {(item.start_date || item.end_date) && (
    <div className="oc-item-option" style={{ color: "#64748b" }}>
      {formatDateRangeTime(item.start_date, item.end_date, item.start_time, item.end_time)}
    </div>
  )}
  {item.option_str ? <div className="oc-item-option">{item.option_str}</div> : null}
  <div className="oc-item-qty">수량 : {item.quantity}</div>
</div>

                  <div className="oc-item-price">{formatPrice(lineTotal)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 결제 금액 요약 */}
        <section className="oc-section">
          <h2 className="oc-section-title">결제금액</h2>
          <div className="oc-summary" role="region" aria-label="결제 금액 요약">
            <Row label="상품금액" value={formatPrice(totalBeforeDiscount)} />
            <Row
              label="쿠폰"
              value={
                couponDiscount > 0 ? `- ${formatPrice(couponDiscount)}` : "0원"
              }
              highlight={couponDiscount > 0 ? "coupon" : ""}
            />
            <Row
              label="포인트"
              value={pointsUsed > 0 ? `- ${formatPrice(pointsUsed)}` : "0원"}
              highlight={pointsUsed > 0 ? "point" : ""}
            />
            <div className="oc-divider" />
            <Row
              label={<strong>결제금액</strong>}
              value={<strong>{formatPrice(totalAfterDiscount)}</strong>}
              large
            />
            <p className="oc-note">
              표시된 금액은 부가세(VAT) 포함 기준입니다.
            </p>{" "}
            {/* ✅ 가격 라벨 작은 주석 */}
          </div>
        </section>

        {/* 액션 */}
        <div className="oc-actions">
          <button
            type="button"
            className="oc-btn oc-btn-primary"
            onClick={() => router.push("/mypage?menu=수강정보")}
            aria-label="주문 내역으로 이동"
          >
            수강정보로 이동
          </button>
          <button
            type="button"
            className="oc-btn oc-btn-ghost"
            onClick={() => router.push("/")}
          >
            홈으로
          </button>
        </div>
      </div>
      <OrderCompleteStyles /> {/* ⬅️ 공통 스타일 주입 */}
    </div>
  );
}

function Row({ label, value, highlight, large }) {
  return (
    <div className={`oc-row ${highlight || ""} ${large ? "large" : ""}`}>
      <span className="oc-row-label">{label}</span>
      <span className="oc-row-value">{value}</span>
    </div>
  );
}

const formatPrice = (num) => `${Number(num).toLocaleString("ko-KR")}원`;

const formatKSTDate = (input) => {
  if (!input) return "날짜 정보 없음";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "유효하지 않은 날짜";

  try {
    const fmt = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    return fmt.format(d); // 예: 2025년 8월 13일 (수)
    
  } catch (e) {
    console.warn("날짜 포맷 실패:", e);
    return d.toISOString();
  }
};
function formatDateRangeTime(start, end) {
  if (!start && !end) return "일정 미정";
  const sDate = start ? new Date(start) : null;
  const eDate = end ? new Date(end) : null;
  const s = sDate ? sDate.toLocaleDateString("ko-KR") : "";
  const e = eDate ? eDate.toLocaleDateString("ko-KR") : "";

  if (!eDate || s === e) {
    return s;
  }
  return `${s} ~ ${e}`;
}


// PG 주문번호 후보를 다각도로 탐색
function extractPgNo(o) {
  if (!o || typeof o !== "object") return null;

  // 1) 가장 흔한 키들 우선 매칭
  const keys = [
    "merchant_uid",
    "merchantUid",
    "payment_key",
    "paymentKey",
    "pg_tid",
    "pgTid",
    "imp_uid",
    "impUid",
    "transaction_id",
    "transactionId",
    "tid",
  ];
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "string" && v.trim()) return v;
  }

  // 2) 중첩 필드 (예: order.payment.tid / transaction_id 등)
  const nested = o.payment || o.pg || o.checkout || null;
  if (nested && typeof nested === "object") {
    const nk = [
      "tid",
      "transaction_id",
      "transactionId",
      "merchant_uid",
      "payment_key",
    ];
    for (const k of nk) {
      const v = nested?.[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }

  // 3) 느슨한 정규식 스캔 (키 이름에 결제 식별자 흔적이 있는 경우)
  for (const [k, v] of Object.entries(o)) {
    if (
      typeof v === "string" &&
      v.trim() &&
      /(merchant|payment|pg|tid|imp)/i.test(k)
    ) {
      return v;
    }
  }

  return null;
}
