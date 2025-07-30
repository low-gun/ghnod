import React, { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserContext } from "../../context/UserContext";
import { leftGroup, centerGroup, getRightGroup } from "../../data/menuData";
import ProfileDropdown from "../ProfileDropdown";
import LogoutButton from "@/components/common/LogoutButton";
import { useCartContext } from "@/context/CartContext";
import MyPageMenuDrawer from "@/components/mypage/MyPageMenuDrawer";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";

const HEADER_HEIGHT_DESKTOP = 80;
const HEADER_HEIGHT_MOBILE = 48;

export default function Header({ showProfile, setShowProfile, activeMenu, setActiveMenu }) {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const { cartItems, cartReady } = useCartContext();
  const [myDrawerOpen, setMyDrawerOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isTabletOrBelow = useIsTabletOrBelow();
  const headerHeight = isTabletOrBelow ? HEADER_HEIGHT_MOBILE : HEADER_HEIGHT_DESKTOP;

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
                  style={{
                    width: isTabletOrBelow ? "85px" : "150px",
                    height: "auto",
                    cursor: "pointer",
                  }}
                />
              </Link>
            );
          }
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
    if (isTabletOrBelow) return null;
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
              key={item.label}
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
                onClick={() => setShowProfile((v) => !v)}
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
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "5vh 20px",
          gap: "3vh",
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
                  fontSize: "1rem",
                  fontWeight: "normal",
                  transition: "color 0.2s",
                }}
                onClick={() => setShowMobileMenu(false)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e0e0e0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
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
          height: `${headerHeight}px`,
          backgroundColor: "#fff",
          zIndex: 999,
          boxShadow: isTabletOrBelow ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
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
            padding: "0 20px",
          }}
        >
          {renderLeftGroup()}
          {!isTabletOrBelow && renderCenterGroup()}
          {!isTabletOrBelow && renderRightGroup()}
          {isTabletOrBelow && (
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
                <>
                  <Link
                    href="/cart"
                    style={{
                      fontSize: "22px",
                      color: "#333",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <span role="img" aria-label="장바구니">🛒</span>
                    {cartReady && cartItems.length > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -9,
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
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#333",
                      textDecoration: "none",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    MY
                  </button>
                  <MyPageMenuDrawer
                    open={myDrawerOpen}
                    setOpen={setMyDrawerOpen}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                  />
                </>
              )}
              {renderMobileMenuButton()}
            </div>
          )}
        </div>
      </header>
      {isTabletOrBelow && showMobileMenu && renderMobileMenu()}
    </>
  );
}
