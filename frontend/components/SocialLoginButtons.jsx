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

  const buttonWidth = 320; // px

  return (
    <div
      style={{
        width: buttonWidth,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        marginTop: "20px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* Naver */}
      <button
        style={{
          width: "100%",
          height: "44px",
          padding: 0,
          border: "none",
          background: "none",
          marginBottom: 0,
          borderRadius: "6px",
          cursor: "pointer",
          display: "block",
        }}
        onClick={handleNaverLogin}
        aria-label="네이버 로그인"
        type="button"
      >
        <img
          src="/btnG_official.png"
          alt="네이버로 로그인"
          style={{
            width: "100%",
            height: "44px",
            objectFit: "contain",
            display: "block",
            borderRadius: "6px",
          }}
          draggable={false}
        />
      </button>

      {/* Google */}
      <button
        className="gsi-material-button"
        style={{
          width: "100%",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          border: "1px solid #dadce0",
          borderRadius: "6px",
          marginBottom: 0,
          cursor: "pointer",
          padding: 0,
          boxSizing: "border-box",
        }}
        onClick={handleGoogleLogin}
        type="button"
        aria-label="구글 로그인"
      >
        <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", justifyContent: "center" }}>
          <div style={{ marginRight: 12, display: "flex", alignItems: "center" }}>
            <svg width="24" height="24" viewBox="0 0 48 48" style={{ display: "block" }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </div>
          <span style={{
            fontWeight: 500,
            fontSize: 16,
            color: "#3c4043",
            fontFamily: "Roboto, Arial, sans-serif",
            letterSpacing: 0.1,
          }}>
            Sign in with Google
          </span>
        </div>
      </button>

      {/* Kakao */}
      <button
        style={{
          width: "100%",
          height: "44px",
          padding: 0,
          border: "none",
          background: "none",
          marginBottom: 0,
          borderRadius: "6px",
          cursor: "pointer",
          display: "block",
        }}
        onClick={handleKakaoLogin}
        aria-label="카카오 로그인"
        type="button"
      >
        <img
          src="/kakao_login_large_wide.png"
          alt="카카오로 로그인"
          style={{
            width: "100%",
            height: "44px",
            objectFit: "contain",
            display: "block",
            borderRadius: "6px",
          }}
          draggable={false}
        />
      </button>
    </div>
  );
};

export default SocialLoginButtons;
