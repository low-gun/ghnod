import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserContext } from "../../context/UserContext";
import { leftGroup, centerGroup, getRightGroup } from "../../data/menuData";
import ProfileDropdown from "../ProfileDropdown";
import LogoutButton from "@/components/common/LogoutButton"; // ✅ 공통 로그아웃 버튼 추가
import { useCartContext } from "@/context/CartContext";
import api from "@/lib/api"; // ✅ 반드시 필요
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

  function renderLeftGroup() {
    return (
      <div style={{ width: "300px", display: "flex", alignItems: "center" }}>
        {leftGroup.map((item) => {
          if (item.isLogo) {
            return (
              <Link key="logo" href="/" legacyBehavior>
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: "120px", cursor: "pointer" }}
                />
              </Link>
            );
          }
          return <span key={item.label}>{item.label}</span>;
        })}
      </div>
    );
  }

  function renderCenterGroup() {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          gap: "60px",
        }}
      >
        {centerGroup.map((item, idx) => (
          <div
            key={item.label}
            style={{ position: "relative" }}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={handleMouseLeave}
          >
            {item.newTab ? (
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
            ) : (
              <Link
                href={`${item.link}/${item.sub?.[0]?.slug || ""}`}
                style={{
                  textDecoration: "none",
                  color: "#333",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {item.label}
              </Link>
            )}

            {item.sub && hoverIndex === idx && (
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
                {item.sub.map((subItem) => (
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
                ))}
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
          width: "300px",
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
                  customLogout={<LogoutButton />} // ✅ 공통 로그아웃 컴포넌트 주입
                />
              </div>
            );
          }

          if (item.label === "로그인") {
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
                로그인
              </Link>
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

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        height: "80px",
        backgroundColor: "#fff",
        zIndex: 999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
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
        }}
      >
        {renderLeftGroup()}
        {renderCenterGroup()}
        {renderRightGroup()}
      </div>
    </header>
  );
}
