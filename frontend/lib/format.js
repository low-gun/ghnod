// frontend/lib/format.js

/** =========================
 *  Number / Currency
 *  ========================= */
export function formatPrice(value) {
  // 기존 구현 보존
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // 소수 오차 방지용 반올림
  const safeNum = Math.round(num);

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum);
}

/** 선택: "1,234원" 바로 쓰고 싶을 때 */
export function formatPriceWithWon(value) {
  const n = formatPrice(value);
  return typeof n === "string" ? `${n}원` : n;
}

/** =========================
 *  Date / Time (SSR-safe)
 *  - 서버/클라이언트 동일 결과 보장을 위해
 *    UTC 또는 고정 오프셋(KST, +09:00) 기반 포맷 제공
 *  ========================= */

const pad2 = (n) => String(n).padStart(2, "0");
const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/** YYYY-MM-DD (문자열 잘라쓰기: ISO면 SSR 안전) */
export function formatDateOnly(iso) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

/** UTC 고정: YYYY-MM-DD HH:mm:ss UTC (SSR 완전 동일) */
export function formatDateUTC(value) {
  const d = toDate(value);
  if (!d) return "-";
  const Y = d.getUTCFullYear();
  const M = pad2(d.getUTCMonth() + 1);
  const D = pad2(d.getUTCDate());
  const h = pad2(d.getUTCHours());
  const m = pad2(d.getUTCMinutes());
  const s = pad2(d.getUTCSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s} UTC`;
}

/** KST(+09:00) 고정: YYYY-MM-DD HH:mm:ss KST (SSR 완전 동일) */
export function formatDateKST(value) {
  const d = toDate(value);
  if (!d) return "-";
  // UTC 기준 +9시간 이동 후 UTC 컴포넌트 사용
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const Y = k.getUTCFullYear();
  const M = pad2(k.getUTCMonth() + 1);
  const D = pad2(k.getUTCDate());
  const h = pad2(k.getUTCHours());
  const s = pad2(k.getUTCSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s} KST`;
}

/** YYYY-MM-DD ~ YYYY-MM-DD (간단 범위 표기) */
export function formatDateRangeOnly(startIso, endIso, sep = " ~ ") {
  return `${formatDateOnly(startIso)}${sep}${formatDateOnly(endIso)}`;
}

/**
 * 지역 로컬 표기 (기본 KST 타임존 고정)
 * - SSR/CSR 동일성을 위해 timeZone 기본값을 'Asia/Seoul'로 둠
 * - 한국식 가독 포맷 필요할 때 사용
 */
export function formatLocalReadable(
  value,
  { locale = "ko-KR", timeZone = "Asia/Seoul", withSeconds = true } = {}
) {
  const d = toDate(value);
  if (!d) return "-";
  const opts = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
    timeZone,
  };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}
