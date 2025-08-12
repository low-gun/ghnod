// frontend/lib/hooks/useIsDeviceSize.js
import { useState, useEffect } from "react";

/** ====== Public hooks (기존 유지) ====== **/
export function useIsMobile() {
  return useMaxWidth(480); // ~480px
}

export function useIsTablet() {
  return useRange(481, 768); // 481~768px (기존 유지)
}

export function useIsTabletOrBelow() {
  return useMaxWidth(768); // <= 768px (기존 유지)
}

export function useIsLaptop() {
  return useRange(769, 1280); // 769~1280px (기존 유지)
}

export function useIsCardLayout() {
  return useMaxWidth(1060); // <= 1060px (기존 유지)
}

export function useIsMonitor() {
  return useMinWidth(1281); // >= 1281px (기존 유지)
}

/** ====== 추가: 헤더 대응을 위한 980px 브레이크포인트 ====== **/
/** 모바일+태블릿+좁은 데스크탑까지 한 번에 처리 (<=980px) */
export function useIsTabletOrBelow980() {
  return useMaxWidth(980);
}

/** 769~980px: 태블릿 가로/작은 노트북 구간 따로 분기하고 싶을 때 */
export function useIsTabletWide() {
  return useRange(769, 980);
}

/** 981~1280px: 980 이후 구간만 별도 분기 필요할 때 */
export function useIsLaptopFrom981() {
  return useRange(981, 1280);
}

/** ====== 내부 공통 훅 ====== **/
function useMaxWidth(maxWidth) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () => setMatch(window.innerWidth <= maxWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [maxWidth]);
  return match;
}

function useMinWidth(minWidth) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () => setMatch(window.innerWidth >= minWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [minWidth]);
  return match;
}

function useRange(min, max) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const check = () =>
      setMatch(window.innerWidth >= min && window.innerWidth <= max);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [min, max]);
  return match;
}
