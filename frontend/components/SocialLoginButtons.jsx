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

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const buttonWidth = isMobile ? "100%" : 320;
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
      {/* Google */}
      <button
  style={{
    width: "100%",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    border: "1px solid #dadce0",
    borderRadius: "6px",
    cursor: "pointer",
    padding: 0,
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",   // 🔹 추가
  }}
  onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
  onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
  onClick={handleGoogleLogin}
  type="button"
  aria-label="구글 로그인"
>
        <svg
          width="24"
          height="24"
          viewBox="0 0 48 48"
          style={{ marginRight: 12, display: "block" }}
        >
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
        <span style={{ color: "#3c4043", fontWeight: 500, fontSize: 16 }}>
          Sign in with Google
        </span>
      </button>

      {/* Kakao */}
{/* Kakao */}
<button
  style={{
    width: "100%",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FEE500",
    border: "1px solid #dadce0",      // 🔹 외곽선 추가
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",   // 🔹 추가
  }}
  onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
  onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
  onClick={handleKakaoLogin}
  type="button"
  aria-label="카카오 로그인"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 256 256"
    style={{ marginRight: 12 }}
  >
    <path fill="#FFE812" d="M256 236c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20V20C0 8.954 8.954 0 20 0h216c11.046 0 20 8.954 20 20v216z"/>
    <path d="M128 36C70.562 36 24 72.713 24 118c0 29.279 19.466 54.97 48.748 69.477-1.593 5.494-10.237 35.344-10.581 37.689 0 0-.207 1.762.934 2.434s2.483.15 2.483.15c3.272-.457 37.943-24.811 43.944-29.04 5.995.849 12.168 1.29 18.472 1.29 57.438 0 104-36.712 104-82 0-45.287-46.562-82-104-82z"/>
    <path fill="#FFE812" d="M70.5 146.625c-3.309 0-6-2.57-6-5.73V105.25h-9.362c-3.247 0-5.888-2.636-5.888-5.875s2.642-5.875 5.888-5.875h30.724c3.247 0 5.888 2.636 5.888 5.875s-2.642 5.875-5.888 5.875H76.5v35.645c0 3.16-2.691 5.73-6 5.73zM123.112 146.547c-2.502 0-4.416-1.016-4.993-2.65l-2.971-7.778-18.296-.001-2.973 7.783c-.575 1.631-2.488 2.646-4.99 2.646a9.155 9.155 0 0 1-3.814-.828c-1.654-.763-3.244-2.861-1.422-8.52l14.352-37.776c1.011-2.873 4.082-5.833 7.99-5.922 3.919.088 6.99 3.049 8.003 5.928l14.346 37.759c1.826 5.672.236 7.771-1.418 8.532a9.176 9.176 0 0 1-3.814.827c-.001 0 0 0 0 0zm-11.119-21.056L106 108.466l-5.993 17.025h11.986zM138 145.75c-3.171 0-5.75-2.468-5.75-5.5V99.5c0-3.309 2.748-6 6.125-6s6.125 2.691 6.125 6v35.25h12.75c3.171 0 5.75 2.468 5.75 5.5s-2.579 5.5-5.75 5.5H138zM171.334 146.547c-3.309 0-6-2.691-6-6V99.5c0-3.309 2.691-6 6-6s6 2.691 6 6v12.896l16.74-16.74c.861-.861 2.044-1.335 3.328-1.335 1.498 0 3.002.646 4.129 1.772 1.051 1.05 1.678 2.401 1.764 3.804.087 1.415-.384 2.712-1.324 3.653l-13.673 13.671 14.769 19.566a5.951 5.951 0 0 1 1.152 4.445 5.956 5.956 0 0 1-2.328 3.957 5.94 5.94 0 0 1-3.609 1.211 5.953 5.953 0 0 1-4.793-2.385l-14.071-18.644-2.082 2.082v13.091a6.01 6.01 0 0 1-6.002 6.003z"/>
  </svg>
  <span style={{ color: "#000", fontWeight: 600, fontSize: 14 }}>
    Kakao 로그인
  </span>
</button>
     {/* Naver */}
      <button
  style={{
    width: "100%",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#03C75A",
    border: "1px solid #dadce0",      // 🔹 외곽선 추가
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",   // 🔹 추가
  }}
  onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
  onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
  onClick={handleNaverLogin}
  type="button"
  aria-label="네이버 로그인"
>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 100 100"
          style={{ marginRight: 12 }}
        >
          <g transform="scale(0.7) translate(15, 15)">
            <polygon
              fill="#FFFFFF"
              points="68.1371994,53.5211983 30.8822994,0 0,0 0,100 
                      32.3528976,100 32.3528976,46.4789009 69.6077957,100 
                      100.4901962,100 100.4901962,0 68.1371994,0"
            />
          </g>
        </svg>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
          Naver 로그인
        </span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
