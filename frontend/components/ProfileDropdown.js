import React, { useEffect, useRef, useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format"; // ✅
import { User } from "lucide-react";

export default function ProfileDropdown({ showProfile, setShowProfile }) {
  const dropdownRef = useRef(null);
  const { user, logout } = useContext(UserContext);
  const router = useRouter();

  const [summary, setSummary] = useState({
    applicationsCount: 0,
    couponsCount: 0,
    totalPoints: 0,
  });

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [setShowProfile]);

  // 요약 정보 불러오기
  useEffect(() => {
    if (!showProfile) return;
    const fetchSummary = async () => {
      try {
        const res = await api.get("/mypage/header_summary");
        setSummary(res.data);
      } catch (err) {
        console.error("요약 정보 불러오기 실패:", err);
      }
    };
    fetchSummary();
  }, [showProfile]);

  if (!user || !showProfile) return null;

  const userName = user.name || user.username || "홍길동";
  const userEmail = user.email || "test@example.com";

  const goToMyPage = () => {
    router.push({ pathname: "/mypage", query: { menu: "내정보" } });
  };

  const handleLogout = async () => {
    await logout(); // ✅ 서버 + 상태 초기화
    router.push("/login"); // ✅ 리디렉션
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: "50px",
        right: 0,
        width: "320px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 9999,
      }}
    >
      {/* 사용자 정보 */}
      <div
        style={{
          display: "flex",
          marginBottom: "12px",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={goToMyPage}
      >
        <User size={36} style={{ marginRight: "10px" }} />        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            {userName}
          </div>
          <div style={{ color: "#666", fontSize: "14px" }}>{userEmail}</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "1.5rem" }}>›</span>
      </div>

      {/* 요약 박스 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div
          style={boxStyle}
          onClick={() =>
            router.push({
              pathname: "/mypage",
              query: {
                menu: "수강정보",
                filterType: "status",
                filterValue: ["예정", "진행중"],
              },
            })
          }
        >
          신청내역
          <div style={countStyle}>{summary.applicationsCount}개</div>
        </div>
        <div
          style={boxStyle}
          onClick={() =>
            router.push({ pathname: "/mypage", query: { menu: "쿠폰" } })
          }
        >
          쿠폰
          <div style={countStyle}>{summary.couponsCount}장</div>
        </div>
        <div
          style={boxStyle}
          onClick={() =>
            router.push({ pathname: "/mypage", query: { menu: "포인트" } })
          }
        >
          포인트
          <div style={countStyle}>{formatPrice(summary.totalPoints)}P</div>
        </div>
      </div>

      {/* 로그아웃 버튼 */}
      <button onClick={handleLogout} style={logoutBtnStyle}>
        로그아웃
      </button>
    </div>
  );
}

// 스타일
const boxStyle = {
  width: "33%",
  background: "#f9f9f9",
  padding: "8px",
  textAlign: "center",
  borderRadius: "4px",
  cursor: "pointer",
};

const countStyle = {
  marginTop: "6px",
  fontSize: "13px",
  color: "#555",
};

const logoutBtnStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "4px",
  border: "none",
  background: "#0070f3",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
};
