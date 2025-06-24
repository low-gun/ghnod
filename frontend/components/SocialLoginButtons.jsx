import React from "react";

const SocialLoginButtons = () => {
  const handleLogin = (provider) => {
    const isLocal = window.location.hostname === "localhost";
    const baseURL = isLocal
      ? "http://localhost:5001"
      : "https://ghnod-hvf7h4dhdpahh7h5.koreacentral-01.azurewebsites.net";

    window.location.href = `${baseURL}/api/auth/${provider}`;
  };

  return (
    <div style={containerStyle}>
      <div style={iconWrapperStyle}>
        {/* Google 버튼 */}
        <button style={googleStyle} onClick={() => handleLogin("google")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 533.5 544.3"
            style={iconStyle}
          >
            <path
              fill="#4285F4"
              d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h146.9c-6.3 33.7-25.1 62.3-53.5 81.5v67h86.4c50.6-46.6 81.7-115.3 81.7-193.4z"
            />
            <path
              fill="#34A853"
              d="M272 544.3c72.6 0 133.6-24.1 178.1-65.4l-86.4-67c-24 16.1-54.7 25.6-91.7 25.6-70.5 0-130.3-47.6-151.7-111.5h-89.3v69.9c44.8 88.3 136.2 148.4 240.9 148.4z"
            />
            <path
              fill="#FBBC05"
              d="M120.3 326c-10.4-30.7-10.4-63.8 0-94.5v-69.9h-89.3c-39.1 76.8-39.1 167.5 0 244.3l89.3-69.9z"
            />
            <path
              fill="#EA4335"
              d="M272 107.7c38.9-.6 76.3 13.6 105.1 39.8l78.4-78.4C405.6 24.1 344.6 0 272 0 167.3 0 75.9 60.1 31.1 148.4l89.3 69.9c21.4-63.9 81.2-111.5 151.7-111.5z"
            />
          </svg>
        </button>

        {/* Kakao 버튼 */}
        <button style={kakaoStyle} onClick={() => handleLogin("kakao")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            style={iconStyle}
          >
            <path
              fill="#3C1E1E"
              d="M12 0C5.4 0 0 4.8 0 10.7c0 3.4 2 6.4 5.1 8.3-.2.8-1.3 4.8-1.4 5.2 0 0-.1.3.1.4.2.1.4 0 .4 0 .5-.1 5.2-3.4 6-3.9.6.1 1.3.1 1.9.1 6.6 0 12-4.8 12-10.7S18.6 0 12 0z"
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

const iconStyle = {
  width: "60%",
  height: "60%",
};
