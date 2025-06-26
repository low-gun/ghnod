import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserContext } from "../../context/UserContext";
import { leftGroup, centerGroup, getRightGroup } from "../../data/menuData";
import ProfileDropdown from "../ProfileDropdown";
import LogoutButton from "@/components/common/LogoutButton";
import { useCartContext } from "@/context/CartContext";

export default function Header() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const { cartItems, cartReady } = useCartContext();

  const [hoverIndex, setHoverIndex] = useState(null);
  let closeTimer = null;
  function handleMouseEnter(idx) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    setHoverIndex(idx);
  }
  function handleMouseLeave() {
    closeTimer = setTimeout(() => {
      setHoverIndex(null);
    }, 300);
  }

  const [showProfile, setShowProfile] = useState(false);

  // ✅ 반응형 상태
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 950);
      setIsTablet(width > 768 && width <= 1235);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowMobileMenu(false);
    };
    if (showMobileMenu) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileMenu]);
  function renderLeftGroup() {
    return (
      <div
        style={{
          width: "250px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {leftGroup.map((item) => {
          if (item.isLogo) {
            return (
              <Link key="logo" href={item.link || "/"} legacyBehavior>
                <img
                  src="/logo_blue.png"
                  alt="Logo"
                  style={{ width: "150px", height: "auto", cursor: "pointer" }}
                />
              </Link>
            );
          }

          // ✅ 일반 메뉴는 링크로 렌더링
          return item.link ? (
            <Link key={item.label} href={item.link}>
              <a
                style={{
                  textDecoration: "none",
                  color: "#333",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {item.label}
              </a>
            </Link>
          ) : (
            <span key={item.label}>{item.label}</span>
          );
        })}
      </div>
    );
  }

  function renderCenterGroup() {
    if (isMobile) return null;
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          gap: isTablet ? "32px" : "60px", // ✅ 태블릿이면 간격 줄임
        }}
      >
        {centerGroup.map((item, idx) => (
          <div
            key={item.label}
            style={{ position: "relative" }}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={handleMouseLeave}
          >
            {item.newTab
              ? item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "#333",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {item.label}
                  </a>
                )
              : item.link && (
                  <Link
                    href={
                      item.sub ? `${item.link}/${item.sub[0].slug}` : item.link
                    }
                    style={{
                      textDecoration: "none",
                      color: "#333",
                      fontWeight: "bold",
                      fontSize: "16px",
                      whiteSpace: "nowrap", // ✅ 줄바꿈 방지
                      display: "inline-block", // ✅ 텍스트가 블록처럼 보이되, 한 줄 유지
                      lineHeight: "1.2", // ✅ 세로 정렬 안정화 (옵션)
                    }}
                  >
                    {item.label}
                  </Link>
                )}

            {item.link && item.sub && hoverIndex === idx && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  left: 0,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "16px 24px",
                  zIndex: 9999,
                  minWidth: "200px",
                }}
              >
                {item.sub.map(
                  (subItem) =>
                    item.link &&
                    subItem.slug && (
                      <Link
                        key={subItem.slug}
                        href={`${item.link}/${subItem.slug}`}
                        style={{
                          display: "block",
                          padding: "6px 12px",
                          textDecoration: "none",
                          color: "#333",
                          fontSize: "14px",
                        }}
                      >
                        {subItem.label}
                      </Link>
                    )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderRightGroup() {
    const group = getRightGroup(user);

    return (
      <div
        style={{
          width: "250px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div
          style={{ position: "relative", marginRight: "16px", minWidth: 30 }}
        >
          <Link
            href="/cart"
            style={{
              fontSize: "24px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            🛒
          </Link>
          {cartReady && cartItems.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                backgroundColor: "#ef4444",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "bold",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                boxShadow: "0 0 0 2px #fff",
              }}
            >
              {cartItems.length}
            </span>
          )}
        </div>
        {group.map((item) => {
          if (item.isProfile) {
            return (
              <div
                key="FaUser"
                style={{ position: "relative", marginLeft: "20px" }}
                onClick={() => setShowProfile(!showProfile)}
              >
                <span style={{ fontSize: "22px", cursor: "pointer" }}>👤</span>
                <ProfileDropdown
                  user={user}
                  showProfile={showProfile}
                  setShowProfile={setShowProfile}
                  customLogout={<LogoutButton />}
                />
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.link}
              style={{
                textDecoration: "none",
                color: "#333",
                marginLeft: "20px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  function renderMobileMenuButton() {
    return (
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        style={{
          marginLeft: "auto",
          fontSize: "28px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ☰
      </button>
    );
  }

  function renderMobileMenu() {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", // ✅ 블랙 반투명 배경
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // ✅ 수직 중앙 정렬
          alignItems: "center",
          padding: "5vh 20px", // ✅ 화면 크기에 따라 여백
          gap: "3vh", // ✅ 메뉴 간격도 vh로
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={() => setShowMobileMenu(false)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            fontSize: "28px",
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
          }}
          aria-label="메뉴 닫기"
        >
          ×
        </button>

        {/* 메뉴 항목 */}
        {centerGroup.map(
          (item) =>
            item.link && (
              <Link
                key={item.label}
                href={item.sub ? `${item.link}/${item.sub[0].slug}` : item.link}
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  transition: "color 0.2s", // ✅ 부드러운 색 전환
                }}
                onClick={() => setShowMobileMenu(false)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e0e0e0")} // ✅ hover in
                onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")} // ✅ hover out
              >
                {item.label}
              </Link>
            )
        )}
      </div>
    );
  }

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          height: "80px",
          backgroundColor: "#fff",
          zIndex: 999,
          boxShadow: isMobile ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            height: "100%",
            padding: "0 20px", // ✅ 좌우 여백 추가
          }}
        >
          {renderLeftGroup()}
          {!isMobile && renderCenterGroup()}
          {!isMobile && renderRightGroup()}
          {isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
                gap: "12px",
              }}
            >
              {!user && (
                <Link
                  href="/login"
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: "#333333",
                    textDecoration: "none",
                  }}
                >
                  로그인
                </Link>
              )}
              {user && (
                <Link
                  href="/mypage"
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: "#333",
                    textDecoration: "none",
                  }}
                >
                  MY
                </Link>
              )}
              {renderMobileMenuButton()}
            </div>
          )}
        </div>
      </header>
      {isMobile && showMobileMenu && renderMobileMenu()}
    </>
  );
}
