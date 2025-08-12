// frontend/pages/orders/[id]/complete.js (파일 경로는 사용 중인 라우팅에 맞춰 두면 돼)
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function OrderCompletePage() {
  const router = useRouter();
  const { id: orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const fetchData = async () => {
      try {
        const [itemRes, userRes] = await Promise.all([
          api.get(`/orders/${orderId}/items`),
          api.get("/user"),
        ]);

        if (!itemRes.data?.order) {
          throw new Error("주문 상세 정보를 찾을 수 없습니다.");
        }

        setOrder(itemRes.data.order);
        setItems(itemRes.data.items || []);
        setUser(userRes.data?.user || null);

        // 주문 상태 최종 업데이트 (백엔드 로직에 맞게 유지)
        await api.put(`/orders/${orderId}`);

        // 로그인된 경우에만 장바구니 비우기
        if (userRes.data?.user?.id) {
          try {
            await api.delete("/cart/items/clear");
            // console.log("🧹 cart_items 초기화 완료");
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
  }, [orderId]);

  // 뒤로가기 경고는 완료 페이지에선 불필요할 수 있어 잠깐 보류
  // 필요하면 아래 주석 해제
  // useEffect(() => {
  //   const handleBeforeUnload = (e) => {
  //     e.preventDefault();
  //     e.returnValue = "";
  //   };
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  // }, []);

  if (isLoading)
    return <p style={{ padding: 40 }}>⏳ 주문 정보를 불러오는 중입니다...</p>;
  if (errorMsg) return <p style={{ padding: 40, color: "red" }}>{errorMsg}</p>;

  // 금액 계산 (표시용)
  const totalBeforeDiscount = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
    0
  );
  const couponDiscount = Number(order?.coupon_discount ?? 0);
  // 포인트 사용액은 총액에서 (쿠폰 + 최종결제금액)을 제외한 값으로 역산
  const pointsUsed = Math.max(
    0,
    totalBeforeDiscount - couponDiscount - Number(order?.total_amount ?? 0)
  );
  const totalAfterDiscount = Number(order?.total_amount ?? 0);

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
          {order && (
            <div className="oc-meta-item">
              <span className="oc-meta-label">주문일시</span>
              <span className="oc-meta-value">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          )}
          {order && (
            <div className="oc-meta-item">
              <span className="oc-meta-label">주문번호</span>
              <span className="oc-meta-value">{order.id}</span>
            </div>
          )}
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
              const priceEach = Number(item.discount_price ?? item.unit_price);
              const lineTotal = priceEach * Number(item.quantity);
              return (
                <div key={item.id} className="oc-item">
                  <div className="oc-thumb">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail_url}
                        alt="상품 썸네일"
                        className="oc-img"
                      />
                    ) : (
                      <span className="oc-thumb-fallback">이미지 없음</span>
                    )}
                  </div>
                  <div className="oc-item-main">
                    <div className="oc-item-title">{item.title}</div>
                    {item.option_str ? (
                      <div className="oc-item-option">{item.option_str}</div>
                    ) : null}
                    <div className="oc-item-qty">{item.quantity}개</div>
                  </div>
                  <div className="oc-item-price">{formatPrice(lineTotal)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 결제 금액 요약 */}
        <section className="oc-section">
          <h2 className="oc-section-title">결제 금액</h2>
          <div className="oc-summary">
            <Row label="총 상품금액" value={formatPrice(totalBeforeDiscount)} />
            {couponDiscount > 0 && (
              <Row
                label="쿠폰 할인"
                value={`- ${formatPrice(couponDiscount)}`}
                highlight="coupon"
              />
            )}
            {pointsUsed > 0 && (
              <Row
                label="포인트 사용"
                value={`- ${formatPrice(pointsUsed)}`}
                highlight="point"
              />
            )}
            <div className="oc-divider" />
            <Row
              label={<strong>최종 결제금액</strong>}
              value={<strong>{formatPrice(totalAfterDiscount)}</strong>}
              large
            />
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
            주문내역 보기
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

      {/* 스타일 */}
      <style jsx>{`
        .oc-wrap {
          padding: 32px 16px;
          display: flex;
          justify-content: center;
        }
        .oc-card {
          width: 100%;
          max-width: 720px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
          padding: 28px 24px 24px;
        }
        .oc-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .oc-badge {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: #ecfdf5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .oc-title {
          font-size: 22px;
          font-weight: 800;
          margin: 2px 0 4px;
          color: #0f172a;
        }
        .oc-sub {
          color: #6b7280;
          font-size: 14px;
        }
        .oc-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          margin: 14px 0 8px;
        }
        .oc-meta-item {
          display: flex;
          gap: 8px;
          font-size: 13px;
          align-items: baseline;
        }
        .oc-meta-label {
          color: #64748b;
          min-width: 72px;
        }
        .oc-meta-value {
          color: #111827;
          font-weight: 600;
          word-break: break-all;
        }
        .oc-section {
          margin-top: 18px;
        }
        .oc-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #0f172a;
        }
        .oc-items {
          display: grid;
          gap: 10px;
        }
        .oc-item {
          display: grid;
          grid-template-columns: 56px 1fr auto;
          gap: 14px;
          align-items: center;
          background: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .oc-thumb {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: #eef2f7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .oc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .oc-thumb-fallback {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.2;
          text-align: center;
          padding: 0 2px;
        }
        .oc-item-main {
          min-width: 0;
        }
        .oc-item-title {
          font-weight: 600;
          font-size: 15px;
          color: #111827;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .oc-item-option {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .oc-item-qty {
          font-size: 12px;
          color: #64748b;
        }
        .oc-item-price {
          min-width: 90px;
          text-align: right;
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
        }
        .oc-summary {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          background: #fafafa;
        }
        .oc-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
          font-size: 15px;
        }
        .oc-row.coupon span:last-child {
          color: #e23e57;
        }
        .oc-row.point span:last-child {
          color: #20bfa9;
        }
        .oc-row.large {
          font-size: 18px;
        }
        .oc-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 10px 0;
        }
        .oc-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 18px;
        }
        .oc-btn {
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition:
            box-shadow 0.12s ease,
            transform 0.06s ease;
        }
        .oc-btn:hover {
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
        }
        .oc-btn:active {
          transform: translateY(1px);
        }
        .oc-btn-primary {
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          color: #fff;
          border: none;
          box-shadow: 0 10px 18px rgba(59, 130, 246, 0.22);
        }
        .oc-btn-ghost {
          background: #fff;
        }

        @media (max-width: 560px) {
          .oc-card {
            padding: 22px 16px 16px;
            border-radius: 12px;
          }
          .oc-meta {
            grid-template-columns: 1fr;
          }
          .oc-item {
            grid-template-columns: 48px 1fr auto;
            gap: 10px;
            padding: 10px 12px;
          }
          .oc-thumb {
            width: 48px;
            height: 48px;
          }
          .oc-item-price {
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, highlight, large }) {
  return (
    <div className={`oc-row ${highlight || ""} ${large ? "large" : ""}`}>
      <span style={{ color: "#4b5563" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const formatPrice = (num) => `${Number(num).toLocaleString("ko-KR")}원`;
