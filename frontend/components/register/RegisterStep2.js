export default function RegisterStep2({
  username,
  setUsername,
  phone,
  setPhone,
  formatPhone,
  checkPhoneDuplicate,
  isVerified,
  setIsVerified,
  verificationCode,
  setVerificationCode,
  showVerificationInput,
  setShowVerificationInput,
  hasRequestedCode,
  setHasRequestedCode,
  timeLeft,
  setTimeLeft,
  timerRef,
  verificationError,
  setVerificationError,
  company,
  setCompany,
  department,
  setDepartment,
  position,
  setPosition,
  termsAgree,
  setTermsAgree,
  privacyAgree,
  setPrivacyAgree,
  marketingAgree,
  setMarketingAgree,
  setOpenModal,
  handleRegister,
  canRegister,
  error,
  phoneExists,
  handleErrorClear,
}) {
  const isDisabled =
    phone.length < 10 || phoneExists || (hasRequestedCode && timeLeft > 0);

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        placeholder="이름"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        style={{ ...inputStyle, marginBottom: "18px" }}
      />

      <div style={{ position: "relative", marginBottom: "18px" }}>
        <input
          type="tel"
          placeholder="휴대폰번호"
          value={formatPhone(phone)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
            setPhone(raw);
            checkPhoneDuplicate(raw);
            handleErrorClear();
          }}
          required
          disabled={isVerified}
          style={{
            ...inputStyle,
            marginBottom: 0,
            paddingRight: "90px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowVerificationInput(true);
              setHasRequestedCode(true);
              setTimeLeft(180);
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                  if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
              alert("인증번호 전송");
            }}
            disabled={isDisabled}
            style={verifyButtonStyle(isDisabled)}
          >
            {!hasRequestedCode
              ? "인증하기"
              : timeLeft > 0
                ? "전송완료"
                : "재전송"}
          </button>
        </div>
      </div>

      {showVerificationInput && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ position: "relative", marginBottom: "6px" }}>
            <input
              type="text"
              placeholder="인증번호 입력"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              style={{
                ...inputStyle,
                marginBottom: 0,
                paddingRight: "70px",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (verificationCode === "123456") {
                    setIsVerified(true);
                    setVerificationError("");
                    alert("인증 성공");
                  } else {
                    setVerificationError("인증번호가 일치하지 않습니다.");
                  }
                }}
                disabled={!verificationCode || isVerified}
                style={{
                  fontSize: "13px",
                  padding: "6px 10px",
                  border: "1px solid #0070f3",
                  background: "#fff",
                  color: "#0070f3",
                  borderRadius: "4px",
                  cursor:
                    !verificationCode || isVerified ? "not-allowed" : "pointer",
                  opacity: !verificationCode || isVerified ? 0.5 : 1,
                  lineHeight: "1",
                }}
              >
                확인
              </button>
            </div>
          </div>

          {isVerified ? (
            <p style={{ fontSize: "13px", color: "green", marginTop: "6px" }}>
              ✅ 인증이 완료되었습니다.
            </p>
          ) : verificationError ? (
            <p style={{ fontSize: "13px", color: "red", marginTop: "6px" }}>
              {verificationError}
            </p>
          ) : (
            <div
              style={{
                fontSize: "13px",
                color: timeLeft > 0 ? "#666" : "red",
                marginTop: "6px",
              }}
            >
              {timeLeft > 0
                ? `남은 시간: ${Math.floor(timeLeft / 60)
                    .toString()
                    .padStart(2, "0")}:${(timeLeft % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "인증 시간이 만료되었습니다."}
            </div>
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="(선택) 회사명"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        style={{ ...inputStyle, marginBottom: "18px" }}
      />
      <input
        type="text"
        placeholder="(선택) 부서명"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={{ ...inputStyle, marginBottom: "18px" }}
      />
      <input
        type="text"
        placeholder="(선택) 직책"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        style={{ ...inputStyle, marginBottom: "18px" }}
      />

      <AgreementItem
        checked={termsAgree}
        onClick={() => setOpenModal("terms")}
        label="(필수) 이용약관 동의"
        disabled={!termsAgree}
        onChange={() => termsAgree && setTermsAgree(false)}
      />
      <AgreementItem
        checked={privacyAgree}
        onClick={() => setOpenModal("privacy")}
        label="(필수) 개인정보 수집 및 이용 동의"
        disabled={!privacyAgree}
        onChange={() => privacyAgree && setPrivacyAgree(false)}
      />
      <AgreementItem
        checked={marketingAgree}
        onClick={() => setOpenModal("marketing")}
        label="(선택) 마케팅 정보 수신 동의"
        disabled={false}
        onChange={() => setMarketingAgree(!marketingAgree)}
      />

      {error && (
        <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canRegister}
        style={{
          ...buttonStyle,
          backgroundColor: canRegister ? "#0070f3" : "#ccc",
          cursor: canRegister ? "pointer" : "not-allowed",
        }}
      >
        가입하기
      </button>
    </form>
  );
}

function AgreementItem({ checked, onChange, onClick, label, disabled }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ marginRight: "8px" }}
      />
      <button
        type="button"
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          fontSize: "14px",
          color: "#333",
        }}
      >
        {label}
        <span
          style={{
            marginLeft: "8px",
            fontSize: "13px",
            color: "#0070f3",
            textDecoration: "underline",
          }}
        >
          보기
        </span>
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#0070f3",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
};

const verifyButtonStyle = (disabled) => ({
  fontSize: "13px",
  padding: "6px 10px",
  border: disabled ? "1px solid #ccc" : "1px solid #0070f3",
  background: disabled ? "#f5f5f5" : "#fff",
  color: disabled ? "#aaa" : "#0070f3",
  borderRadius: "4px",
  cursor: disabled ? "not-allowed" : "pointer",
  lineHeight: "1",
});

const confirmButtonStyle = (disabled) => ({
  fontSize: "13px",
  padding: "6px 10px",
  border: "1px solid #0070f3",
  background: "#fff",
  color: "#0070f3",
  borderRadius: "4px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  lineHeight: "1",
});
