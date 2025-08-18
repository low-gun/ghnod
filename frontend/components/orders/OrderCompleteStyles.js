// 생성 코드 (전체)
export default function OrderCompleteStyles() {
  return (
    <style jsx global>{`
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
        flex-direction: column; /* ⬅️ 라벨 위, 값 아래 */
        align-items: flex-start; /* ⬅️ 좌측 정렬 */
        gap: 4px; /* 라벨-값 간격 */
        font-size: 14px;
      }

      .oc-meta-value {
        display: flex; /* 값 영역 안에서 코드+복사 버튼 가로 배치 */
        align-items: center; /* 버튼과 텍스트 수직 중앙 정렬 */
        gap: 6px;
        flex-wrap: wrap; /* 길면 줄바꿈 */
      }
      .oc-meta-item.full {
        /* 주문일시가 두 칸(span) 사용 */
        grid-column: 1 / -1;
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
        aspect-ratio: 1 / 1;
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
        text-align: center;
        display: flex;
        flex-direction: column; /* 위아래 배치 */
        align-items: center;
        justify-content: center;
        height: 100%;
        white-space: pre-line; /* 줄바꿈 문자 인식 */
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
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: baseline;
        column-gap: 8px;
        margin-bottom: 8px;
        font-size: 15px;
      }
      .oc-row-label {
        color: #4b5563;
        white-space: nowrap;
        justify-self: start;
      }
      .oc-row-value {
        justify-self: end;
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .oc-row.coupon .oc-row-value {
        color: #e23e57;
      }
      .oc-row.point .oc-row-value {
        color: #e23e57;
      }
      .oc-row.large {
        font-size: 18px;
      }
      .oc-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 10px 0;
      }
      .oc-note {
        margin-top: 6px;
        font-size: 12px;
        color: #64748b;
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

      .oc-code {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", monospace;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        padding: 2px 6px;
        border-radius: 6px;
        letter-spacing: 0.3px;
        display: inline-block;
        margin-right: 6px;
      }
      .oc-copy {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #0f172a;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 400;
        cursor: pointer;
        transition:
          box-shadow 0.12s ease,
          transform 0.06s ease;
      }
      .oc-copy:hover {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
      }
      .oc-copy:active {
        transform: translateY(1px);
      }

      .oc-btn:focus-visible,
      .oc-copy:focus-visible {
        outline: 3px solid #93c5fd;
        outline-offset: 2px;
      }

      /* 기본 비노출, 모바일에서만 노출 */
      .oc-sticky-cta {
        display: none;
      }

      @media (max-width: 560px) {
        .oc-card {
          border: none;
          box-shadow: none;
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
          border: none;
        }
        .oc-summary {
          border: none;
        }
        .oc-thumb {
          width: 48px;
          height: 48px;
        }
        .oc-item-price {
          min-width: 80px;
        }
        .oc-code {
          margin-right: 8px;
        }
        .oc-copy {
          padding: 4px 10px;
          font-size: 12px;
        }

        .oc-sticky-cta {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          background: #fff;
          border-top: 1px solid #e5e7eb;
          padding: 10px 12px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .oc-sticky-cta-sum {
          display: flex;
          gap: 6px;
          align-items: baseline;
        }
        .oc-sticky-cta-label {
          color: #4b5563;
        }
        .oc-sticky-cta-value {
          font-size: 16px;
        }
        .oc-sticky-cta-actions {
          display: flex;
          gap: 8px;
        }
      }
    `}</style>
  );
}
