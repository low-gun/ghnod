import React, { useState, useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../context/UserContext";
import { leftGroup, centerGroup, getRightGroup } from "../../data/menuData";
import ProfileDropdown from "../ProfileDropdown";
import { useCartContext } from "@/context/CartContext";
import MyPageMenuDrawer from "@/components/mypage/MyPageMenuDrawer";
import {
  useIsTabletOrBelow980, // <=980: 모바일 UI
} from "@/lib/hooks/useIsDeviceSize";
import MobileMenuDrawer from "@/components/common/MobileMenuDrawer";
import { Menu, LogIn, User, ShoppingCart } from "lucide-react";

const HEADER_HEIGHT_DESKTOP = 80;
const HEADER_HEIGHT_MOBILE = 48;
const rememberAfterLogout = () => {
  try {
    const here = window.location.pathname + window.location.search;
    sessionStorage.setItem("AFTER_LOGOUT_GO", here);
  } catch {}
};
export default function Header({
  showProfile,
  setShowProfile,
  activeMenu,
  setActiveMenu,
}) {
  const { user, logout } = useContext(UserContext);
    const { cartItems, cartReady } = useCartContext();
  const [myDrawerOpen, setMyDrawerOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  // ✅ 레이아웃 기준: 768px (모바일/태블릿)
  const isCompactNav = useIsTabletOrBelow980();
  
  const headerHeight = isCompactNav
    ? HEADER_HEIGHT_MOBILE
    : HEADER_HEIGHT_DESKTOP;

    const closeTimerRef = useRef(null);
    function handleMouseEnter(idx) {
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
      setHoverIndex(idx);
    }
    function handleMouseLeave() {
      closeTimerRef.current = setTimeout(() => setHoverIndex(null), 300);
    }
    

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
        {leftGroup.map((item, idx) => {
          if (item.isLogo) {
            return (
              <Link key="logo" href={item.link || "/"} legacyBehavior>
                <img
                  src="/logo_blue.png"
                  alt="Logo"
                  style={{
                    width: isCompactNav ? "85px" : "150px",
                    height: "auto",
                    cursor: "pointer",
                  }}
                />
              </Link>
            );
          }
          return item.link ? (
            <Link key={item.label || idx} href={item.link}>
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
            <span key={item.label || idx}>{item.label}</span>
          );
        })}
      </div>
    );
  }

  function renderCenterGroup() {
    // ✅ 중앙 메뉴는 980px 이하에서 숨김
    if (isCompactNav) return null;

    return (
      <>
        <style>{`
          .header-menu::-webkit-scrollbar { display: none !important; }
        `}</style>
        <div
          className="header-menu"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            minWidth: 0,
            flexWrap: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {centerGroup.map((item, idx) => (
            <div
              key={item.label || idx}
              style={{
                position: "relative",
                minWidth: 0,
                maxWidth: "140px",
              }}
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
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "inline-block",
                        verticalAlign: "middle",
                        maxWidth: "100%",
                      }}
                      title={item.label}
                    >
                      {item.label}
                    </a>
                  )
                : item.link && (
                    <Link
                      href={
                        item.sub
                          ? `${item.link}/${item.sub[0].slug}`
                          : item.link
                      }
                      style={{
                        textDecoration: "none",
                        color: "#333",
                        fontWeight: "bold",
                        fontSize: "16px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "inline-block",
                        lineHeight: "1.2",
                        verticalAlign: "middle",
                        maxWidth: "100%",
                      }}
                      title={item.label}
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
                    (subItem, subIdx) =>
                      item.link &&
                      subItem.slug && (
                        <Link
                          key={`${item.label || idx}-${subItem.slug || subIdx}`}
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
      </>
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
        {/* 로그인 사용자에게만 카트 아이콘 표시 */}
        {user && (
          <div
            style={{
              position: "relative",
              marginRight: "16px",
              minWidth: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
            }}
          >
            <Link
              href="/cart"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                textDecoration: "none",
                background: "none",
                border: "none",
                padding: 0,
                position: "relative",
              }}
              aria-label="장바구니"
            >
              <ShoppingCart size={26} />
              {cartReady && cartItems.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "bold",
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    boxShadow: "0 0 0 1px #fff",
                  }}
                >
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        )}

        {group.map((item, idx) => {
          if (item.isProfile) {
            return (
              <div
                key="FaUser"
                style={{
                  position: "relative",
                  marginLeft: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "40px",
                  width: "40px",
                  cursor: "pointer",
                }}
                onClick={() => setShowProfile((v) => !v)}
              >
                <User
                  size={26}
                  style={{ display: "block", position: "relative", top: "1px" }}
                />
                <ProfileDropdown
  user={user}
  showProfile={showProfile}
  setShowProfile={setShowProfile}
  customLogout={
    <button
      onClick={() => { rememberAfterLogout(); logout(); }}
      style={{
        width: "100%",
        padding: "8px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        background: "#fff",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      로그아웃
    </button>
  }
/>

              </div>
            );
          }
          return (
            <Link
              key={item.label || idx}
              href={item.link}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                width: "40px",
                marginLeft: "20px",
                color: "#333",
                fontWeight: "bold",
                fontSize: "16px",
                textDecoration: "none",
                gap: "0",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label="로그인"
            >
              {item.icon}
            </Link>
          );
        })}
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
          height: `${headerHeight}px`,
          backgroundColor: "#fff",
          zIndex: 999,
          boxShadow: isCompactNav ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
          transition: "height 0.2s",
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
            padding: "0 10px",
          }}
        >
          {renderLeftGroup()}
          {!isCompactNav && renderCenterGroup()}
          {!isCompactNav && renderRightGroup()}
          {isCompactNav && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
                gap: "10px",
              }}
            >
              {/* 비회원: 로그인 버튼 */}
              {!user && (
                <Link
                  href="/login"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    color: "#333",
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginLeft: "6px",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                  aria-label="로그인"
                >
                  <LogIn size={24} />
                </Link>
              )}
              {/* 회원: 장바구니, 마이페이지 */}
              {user && (
                <>
                  <Link
                    href="/cart"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      textDecoration: "none",
                      background: "none",
                      border: "none",
                      padding: 0,
                      position: "relative",
                    }}
                    aria-label="장바구니"
                  >
                    <ShoppingCart size={26} />
                    {cartReady && cartItems.length > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          right: 3,
                          backgroundColor: "#ef4444",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "bold",
                          width: 16,
                          height: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          boxShadow: "0 0 0 1px #fff",
                        }}
                      >
                        {cartItems.length}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => setMyDrawerOpen(true)}
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label="마이페이지"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ display: "block", position: "relative", top: 1 }}
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </button>
                  <MyPageMenuDrawer
                    open={myDrawerOpen}
                    setOpen={setMyDrawerOpen}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                  />
                </>
              )}
              <button
                onClick={() => setShowMobileMenu(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                }}
                aria-label="전체 메뉴"
              >
                <Menu size={28} color="#222" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 모바일 Drawer(메인 메뉴) */}
      {isCompactNav && (
        <MobileMenuDrawer
          open={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
        />
      )}
    </>
  );
}
