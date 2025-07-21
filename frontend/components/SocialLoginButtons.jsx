import React, { useEffect } from "react";

const SocialLoginButtons = () => {
  const OAUTH_BASE_URL = process.env.NEXT_PUBLIC_OAUTH_BASE_URL;

  useEffect(() => {
    // 환경변수 실제 값 확인
    console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log("NEXT_PUBLIC_OAUTH_BASE_URL:", process.env.NEXT_PUBLIC_OAUTH_BASE_URL);
    console.log("NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    console.log("NEXT_PUBLIC_GOOGLE_REDIRECT_URI:", process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI);
  }, []);

  // 🚩 환경변수 없을 때는 그냥 안내만 보여줌. (alert 절대 금지)
  if (!OAUTH_BASE_URL) {
    return (
      <div style={{ color: "red", textAlign: "center" }}>
        OAUTH_BASE_URL 환경변수가 없습니다.<br />
        .env.local에 NEXT_PUBLIC_OAUTH_BASE_URL 추가하고 서버 재시작 하세요.
      </div>
    );
  }

  const handleLogin = (provider) => {
    if (provider === "google") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      console.log("최종 redirectUri:", redirectUri); // ⭐️ 찍어봐!
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "profile email",
        access_type: "offline",
        prompt: "consent",
      });
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log("구글 인증 URL:", url); // ⭐️ 이거도 찍어!
      window.location.href = url;
    } else if (provider === "kakao") {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
        response_type: "code",
      });
      window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    } else if (provider === "naver") {
      const state = Math.random().toString(36).substring(2); // 임시 state
      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
        redirect_uri: process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI,
        state,
      });
      window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle}>
        {/* Google */}
        <button style={googleStyle} onClick={() => handleLogin("google")} aria-label="구글 로그인">
          <svg width="24" height="24" viewBox="0 0 24 24" style={iconStyle}>
            <g>
              <path fill="#4285F4" d="M23.52 12.272c0-.832-.074-1.624-.208-2.392H12v4.532h6.484c-.28 1.464-1.125 2.706-2.384 3.548v2.952h3.858c2.262-2.084 3.562-5.156 3.562-8.64z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.068 7.946-2.912l-3.858-2.952c-1.072.724-2.452 1.16-4.088 1.16-3.144 0-5.808-2.124-6.768-4.96H1.226v3.112C3.198 21.438 7.248 24 12 24z"/>
              <path fill="#FBBC05" d="M5.232 14.296A7.492 7.492 0 0 1 4.7 12c0-.8.144-1.584.4-2.296V6.592H1.226A12.002 12.002 0 0 0 0 12c0 1.94.468 3.772 1.226 5.408l4.006-3.112z"/>
              <path fill="#EA4335" d="M12 4.752c1.776 0 3.36.608 4.616 1.792l3.462-3.462C17.96 1.16 15.24 0 12 0 7.248 0 3.198 2.562 1.226 6.592l4.006 3.112C6.192 6.876 8.856 4.752 12 4.752z"/>
            </g>
          </svg>
        </button>
        {/* Kakao */}
        <button style={kakaoStyle} onClick={() => handleLogin("kakao")} aria-label="카카오 로그인">
          <svg width="24" height="24" viewBox="0 0 24 24" style={iconStyle}>
            <ellipse cx="12" cy="12" rx="12" ry="12" fill="#FEE500" />
            <text x="12" y="16" textAnchor="middle" fontSize="9" fill="#381e1f" fontFamily="Arial, sans-serif" fontWeight="bold">K</text>
          </svg>
        </button>
        {/* Naver */}
        <button style={naverStyle} onClick={() => handleLogin("naver")} aria-label="네이버 로그인">
          <svg width="24" height="24" viewBox="0 0 24 24" style={iconStyle}>
            <rect width="24" height="24" rx="6" fill="#03c75a" />
            <path d="M7.2 6.5h2.77l2.45 3.86 2.45-3.86H17.8v11h-2.63V11.7l-2.05 3.31h-.04l-2.05-3.29v5.81H7.2V6.5z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ================= CSS =================
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  marginTop: "20px",
};
const iconWrapperStyle = {
  display: "flex",
  gap: "10px",
};
const buttonBase = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  border: "none",
  padding: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
};
const googleStyle = {
  ...buttonBase,
  backgroundColor: "white",
  border: "1px solid #ececec",
};
const kakaoStyle = {
  ...buttonBase,
  backgroundColor: "#FEE500",
  border: "1px solid #e5d352",
};
const naverStyle = {
  ...buttonBase,
  backgroundColor: "#03c75a",
  border: "1px solid #03b053",
};
const iconStyle = {
  width: "24px",
  height: "24px",
};

export default SocialLoginButtons;
