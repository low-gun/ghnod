import React from "react";

const SocialLoginButtons = () => {
  const handleLogin = (provider) => {
    // 환경별 API Base URL (NEXT_PUBLIC_API_BASE_URL에 http://localhost:5001 또는 운영 주소 입력)
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "");
    if (!baseURL) {
      alert("API_BASE_URL 환경변수가 설정되지 않았습니다.");
      return;
    }
    // provider: "google", "kakao", "naver"에 따라 이동
    window.location.href = `${baseURL}/auth/${provider}`;
  };

  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle}>
        {/* Google 버튼 */}
        <button style={googleStyle} onClick={() => handleLogin("google")}>
          {/* ...SVG 그대로 */}
        </button>

        {/* Kakao 버튼 */}
        <button style={kakaoStyle} onClick={() => handleLogin("kakao")}>
          {/* ...SVG 그대로 */}
        </button>

        {/* Naver 버튼 */}
        <button style={naverStyle} onClick={() => handleLogin("naver")}>
          {/* 네이버 로고 SVG 예시 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            style={iconStyle}
          >
            <rect width="24" height="24" rx="6" fill="#03c75a" />
            <path
              d="M7.2 6.5h2.77l2.45 3.86 2.45-3.86H17.8v11h-2.63V11.7l-2.05 3.31h-.04l-2.05-3.29v5.81H7.2V6.5z"
              fill="#fff"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;

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
  width: "40px",
  height: "40px",
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
};

const kakaoStyle = {
  ...buttonBase,
  backgroundColor: "#FEE500",
};

const naverStyle = {
  ...buttonBase,
  backgroundColor: "#03c75a",
};

const iconStyle = {
  width: "60%",
  height: "60%",
};
