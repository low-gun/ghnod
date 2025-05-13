// frontend/lib/format.js

export function formatPrice(value) {
  // 1) 숫자로 변환
  const num = parseFloat(value);
  if (isNaN(num)) {
    // 변환 불가 시 원본 그대로
    return value;
  }

  // ✅ 소수점 오차 방지용 정수 변환
  const safeNum = Math.round(num);

  // 2) Intl.NumberFormat 사용
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // ← 소수점 제거
  }).format(safeNum);
}
