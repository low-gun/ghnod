import React from "react";

const SocialLoginButtons = () => {
  const OAUTH_BASE_URL = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;

  if (!OAUTH_BASE_URL) {
    return (
      <div style={{ color: "red", textAlign: "center" }}>
        OAUTH_BASE_URL 환경변수가 없습니다.<br />
        .env.local에 NEXT_PUBLIC_OAUTH_BASE_URL 추가하고 서버 재시작 하세요.
      </div>
    );
  }

  // 카카오 로그인
  const handleKakaoLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
      response_type: "code",
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  };

  // 네이버 로그인
  const handleNaverLogin = () => {
    const state = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  };

  // 구글 로그인
  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email",
      access_type: "offline",
      prompt: "consent",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = url;
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      marginTop: "20px"
    }}>
      {/* Google (기존 원형 SVG 버튼) */}
      <button
        style={googleStyle}
        onClick={handleGoogleLogin}
        aria-label="구글 로그인"
        type="button"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" style={iconStyle}>
          <g>
            <path fill="#4285F4" d="M23.52 12.272c0-.832-.074-1.624-.208-2.392H12v4.532h6.484c-.28 1.464-1.125 2.706-2.384 3.548v2.952h3.858c2.262-2.084 3.562-5.156 3.562-8.64z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.068 7.946-2.912l-3.858-2.952c-1.072.724-2.452 1.16-4.088 1.16-3.144 0-5.808-2.124-6.768-4.96H1.226v3.112C3.198 21.438 7.248 24 12 24z"/>
            <path fill="#FBBC05" d="M5.232 14.296A7.492 7.492 0 0 1 4.7 12c0-.8.144-1.584.4-2.296V6.592H1.226A12.002 12.002 0 0 0 0 12c0 1.94.468 3.772 1.226 5.408l4.006-3.112z"/>
            <path fill="#EA4335" d="M12 4.752c1.776 0 3.36.608 4.616 1.792l3.462-3.462C17.96 1.16 15.24 0 12 0 7.248 0 3.198 2.562 1.226 6.592l4.006 3.112C6.192 6.876 8.856 4.752 12 4.752z"/>
          </g>
        </svg>
      </button>
      {/* Kakao (공식 이미지, width만 지정) */}
      <img
        src="/kakao_login_large.png"
        alt="카카오 로그인"
        style={{
          width: "80px",
          height: "auto",
          cursor: "pointer",
          display: "block",
        }}
        onClick={handleKakaoLogin}
        draggable={false}
      />
      {/* Naver (공식 이미지, width만 지정) */}
      <img
        src="/naver_login_small.png"
        alt="네이버 로그인"
        style={{
          width: "80px",
          height: "auto",
          cursor: "pointer",
          display: "block",
        }}
        onClick={handleNaverLogin}
        draggable={false}
      />
    </div>
  );
};

// 구글 버튼만 기존대로
const googleStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "24px",
  backgroundColor: "white",
  border: "1px solid #ececec",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0",
  boxShadow: "0 1.5px 6px 0 rgba(0,0,0,0.08)",
  cursor: "pointer",
};
const iconStyle = {
  width: "28px",
  height: "28px",
  display: "block",
};

export default SocialLoginButtons;
