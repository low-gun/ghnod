import { useState, useEffect } from "react";

export function useIsMobile() {
  return useDeviceQuery(480); // ~480px
}

export function useIsTablet() {
  return useDeviceRange(481, 768); // 481~768px
}

export function useIsTabletOrBelow() {
  return useDeviceQuery(768); // ✅ 모바일 + 태블릿 (<= 768px)
}

export function useIsLaptop() {
  return useDeviceRange(769, 1280); // 769~1280px
}
export function useIsCardLayout() {
  return useDeviceQuery(1060); // ✅ 1060px 이하부터 카드 전환
}
export function useIsMonitor() {
  return useMinWidth(1281); // 1281px 이상
}

// 내부 공통 훅
function useDeviceQuery(maxWidth) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () => setMatch(window.innerWidth <= maxWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [maxWidth]);
  return match;
}

function useMinWidth(minWidth) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () => setMatch(window.innerWidth >= minWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [minWidth]);
  return match;
}

function useDeviceRange(min, max) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () =>
      setMatch(window.innerWidth >= min && window.innerWidth <= max);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [min, max]);
  return match;
}
