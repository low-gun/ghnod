import { useRouter } from "next/router";
import OrderCompleteStyles from "@/components/orders/OrderCompleteStyles"; // ⬅️ 추가
export default function OrderCompleteSkeleton({ totalAfterDiscount = 0 }) {
  const router = useRouter();
  return (
    <div className="oc-wrap">
      <div className="oc-card">
        <div className="oc-header">
          <div className="oc-badge sk" aria-hidden="true" />
          <h1 className="oc-title sk sk-text" aria-hidden="true">
            {""}
          </h1>
          <p className="oc-sub sk sk-text" aria-hidden="true">
            {""}
          </p>
        </div>

        <div className="oc-meta">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="oc-meta-item">
              <span className="oc-meta-label sk sk-text"> </span>
              <span className="oc-meta-value sk sk-text"> </span>
            </div>
          ))}
        </div>

        <section className="oc-section">
          <h2 className="oc-section-title sk sk-text"> </h2>
          <div className="oc-summary">
            {[1, 2, 3].map((k) => (
              <div key={k} className="oc-row">
                <span
                  className="sk sk-text"
                  style={{ height: 14, width: "30%" }}
                />
                <span
                  className="sk sk-text"
                  style={{ height: 14, width: "20%" }}
                />
              </div>
            ))}
            <div className="oc-divider" />
            <div className="oc-row large">
              <span
                className="sk sk-text"
                style={{ height: 18, width: "35%" }}
              />
              <span
                className="sk sk-text"
                style={{ height: 18, width: "28%" }}
              />
            </div>
          </div>
        </section>

        <div className="oc-actions">
          <div
            className="oc-btn oc-btn-primary sk sk-text"
            style={{ width: 140, height: 40 }}
          />
          <div
            className="oc-btn oc-btn-ghost sk sk-text"
            style={{ width: 100, height: 40 }}
          />
        </div>
      </div>
      {/* 모바일 하단 고정 CTA */}
      <div
        className="oc-sticky-cta"
        role="region"
        aria-label="결제 요약 고정 영역"
      >
        <div className="oc-sticky-cta-sum">
          <span className="oc-sticky-cta-label">최종 결제금액</span>
          <strong className="oc-sticky-cta-value">
            {`${Number(totalAfterDiscount).toLocaleString("ko-KR")}원`}
          </strong>
        </div>
        <div className="oc-sticky-cta-actions">
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
            aria-label="홈으로 이동"
          >
            홈으로
          </button>
        </div>
      </div>
      <style jsx>{`
        /* 스켈레톤 전용 효과만 유지 */
        .sk {
          position: relative;
          overflow: hidden;
          background: #f1f5f9;
          border-radius: 8px;
        }
        .sk::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.2s infinite;
        }
        .sk-text {
          color: transparent !important;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <OrderCompleteStyles /> {/* ⬅️ 공통 스타일 주입 */}
    </div>
  );
}
