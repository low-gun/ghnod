import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import AgreementModal from "@/components/AgreementModal";

export default function RegisterStep2({
  socialMode = false,
  socialProvider,
  email, setEmail, password, setPassword,
  username, setUsername,
  phone, setPhone, formatPhone, checkPhoneDuplicate,
  isVerified, setIsVerified, verificationCode, setVerificationCode,
  showVerificationInput, setShowVerificationInput,
  hasRequestedCode, setHasRequestedCode,
  timeLeft, setTimeLeft, timerRef,
  verificationError, setVerificationError,
  company, setCompany,
  department, setDepartment,
  position, setPosition,
  termsAgree, setTermsAgree,
  privacyAgree, setPrivacyAgree,
  marketingAgree, setMarketingAgree,
  handleRegister, canRegister,
  error, phoneExists, handleErrorClear,
}) {
  // 모달 상태를 RegisterStep2 내부에서 직접 관리
  const [openModal, setOpenModal] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("registerStep2Form");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setUsername(data.username || "");
        setPhone(data.phone || "");
        setCompany(data.company || "");
        setDepartment(data.department || "");
        setPosition(data.position || "");
        setTermsAgree(!!data.termsAgree);
        setPrivacyAgree(!!data.privacyAgree);
        setMarketingAgree(!!data.marketingAgree);
      } catch {}
    }
  }, []);
  const isSocialPhoneVerified =
    socialMode &&
    !!phone &&
    (socialProvider === "kakao" || socialProvider === "naver");
  const isDisabled =
    (phone || "").length < 10 || phoneExists || (hasRequestedCode && timeLeft > 0);
  const isPhoneReadonly = socialMode && (socialProvider === "kakao" || socialProvider === "naver");

  return (
    <>
      <form
        onSubmit={handleRegister}
        className="login-form"
        id="register-step2-form"
        autoComplete="off"
      >
        {!socialMode && (
          <>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              disabled
              required
              className="login-input input-disabled"
              style={{ marginBottom: 0 }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              disabled
              required
              className="login-input input-disabled"
              style={{ marginBottom: 0 }}
            />
          </>
        )}
        <input
          type="text"
          placeholder="이름"
          value={username}
          onChange={e => setUsername(e.target.value)}
          readOnly={socialMode}
          required
          className={`login-input${socialMode ? " input-disabled" : ""}`}
        />
        <div className="input-wrap">
          <input
            type="tel"
            placeholder="휴대폰번호"
            value={formatPhone(phone || "")}
            onChange={e => {
              if (isSocialPhoneVerified) return;
              const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
              setPhone(raw);
              checkPhoneDuplicate(raw);
              handleErrorClear();
            }}
            required
            readOnly={isPhoneReadonly || isSocialPhoneVerified}
            disabled={isVerified || isPhoneReadonly || isSocialPhoneVerified}
            className={`login-input${(isPhoneReadonly || isSocialPhoneVerified) ? " input-disabled" : ""}`}
            style={{ paddingRight: 100 }}
          />

          {!isSocialPhoneVerified && (
            <button
              type="button"
              className="verify-btn"
              onClick={() => {
                setShowVerificationInput(true);
                setHasRequestedCode(true);
                setTimeLeft(180);
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                  setTimeLeft(prev => {
                    if (prev <= 1) {
                      clearInterval(timerRef.current);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                window.toast && toast.info("인증번호가 전송되었습니다.");
              }}
              disabled={isDisabled}
            >
              {!hasRequestedCode ? "인증하기" : timeLeft > 0 ? "전송완료" : "재전송"}
            </button>
          )}
        </div>

        {!isSocialPhoneVerified && showVerificationInput && (
          <div className="input-wrap" style={{ marginBottom: 6 }}>
            <input
              type="text"
              placeholder="인증번호 입력"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              className="login-input"
              style={{ paddingRight: 80 }}
            />
            <button
              type="button"
              className="confirm-btn"
              onClick={() => {
                if (verificationCode === "123456") {
                  setIsVerified(true);
                  setVerificationError("");
                  window.toast && toast.success("인증 성공");
                } else {
                  setVerificationError("인증번호가 일치하지 않습니다.");
                }
              }}
              disabled={!verificationCode || isVerified}
            >
              확인
            </button>
          </div>
        )}
        {isSocialPhoneVerified && (
          <div className="verified-message" style={{ marginTop: 8 }}>
            ✅ 인증이 완료되었습니다.
          </div>
        )}
        {!isSocialPhoneVerified && showVerificationInput && (
          isVerified
            ? <div className="verified-message">✅ 인증이 완료되었습니다.</div>
            : verificationError
              ? <div className="register-error">{verificationError}</div>
              : <div className="timer-message">
                  {timeLeft > 0
                    ? `남은 시간: ${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`
                    : "인증 시간이 만료되었습니다."}
                </div>
        )}

        <input
          type="text"
          placeholder="(선택) 회사명"
          value={company}
          onChange={e => setCompany(e.target.value)}
          className="login-input"
        />
        <input
          type="text"
          placeholder="(선택) 부서명"
          value={department}
          onChange={e => setDepartment(e.target.value)}
          className="login-input"
        />
        <input
          type="text"
          placeholder="(선택) 직책"
          value={position}
          onChange={e => setPosition(e.target.value)}
          className="login-input"
        />

        {/* 약관 동의 */}
        <div className="agreement-section">
          <AgreementItem
            checked={termsAgree}
            setAgree={setTermsAgree}
            setOpenModal={setOpenModal}
            openKey="terms"
            label="(필수) 이용약관 동의"
            username={username}
            phone={phone}
            company={company}
            department={department}
            position={position}
            termsAgree={termsAgree}
            privacyAgree={privacyAgree}
            marketingAgree={marketingAgree}
          />
          <AgreementItem
            checked={privacyAgree}
            setAgree={setPrivacyAgree}
            setOpenModal={setOpenModal}
            openKey="privacy"
            label="(필수) 개인정보 수집 및 이용 동의"
            username={username}
            phone={phone}
            company={company}
            department={department}
            position={position}
            termsAgree={termsAgree}
            privacyAgree={privacyAgree}
            marketingAgree={marketingAgree}
          />
          <AgreementItem
            checked={marketingAgree}
            setAgree={setMarketingAgree}
            setOpenModal={setOpenModal}
            openKey="marketing"
            label="(선택) 마케팅 정보 수신 동의"
            isOptional
            username={username}
            phone={phone}
            company={company}
            department={department}
            position={position}
            termsAgree={termsAgree}
            privacyAgree={privacyAgree}
            marketingAgree={marketingAgree}
          />
        </div>
        {error && <div className="register-error">{error}</div>}
        <button
          type="submit"
          className="login-btn desktop-only"
          disabled={!canRegister}
        >
          가입하기
        </button>
        <style jsx>{`
          .login-form {
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box;
          }
          .login-input {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            padding: 12px 16px;
            margin-bottom: 0;
            border-radius: 12px;
            border: 1.5px solid #e3e9fa;
            font-size: 16.2px;
            background: #fafdff;
            transition: border 0.18s, box-shadow 0.17s;
          }
          .login-input:focus {
            border: 1.8px solid #3577f1;
            box-shadow: 0 2px 10px 0 rgba(60,100,220,0.05);
          }
          .input-disabled {
            background: #f4f6fa !important;
            color: #8c95a3 !important;
            cursor: not-allowed;
            border-color: #e3e9fa;
            opacity: 1;
          }
          .input-wrap {
            position: relative;
            width: 100%;
            min-width: 0;
            margin-bottom: 0;
          }
          .verify-btn, .confirm-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            top: 25px;
            right: 16px;
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 4px;
            border: 1.2px solid #3577f1;
            background: #fff;
            color: #3577f1;
            cursor: pointer;
            transition: background 0.14s, color 0.14s, border 0.14s;
          }
          .verify-btn:disabled, .confirm-btn:disabled {
            border: 1.2px solid #ccc;
            background: #f5f5f5;
            color: #aaa;
            cursor: not-allowed;
          }
          .verified-message {
            font-size: 13px;
            color: #24a340;
            margin-bottom: 7px;
          }
          .timer-message {
            font-size: 13px;
            color: #3577f1;
            margin-bottom: 7px;
          }
          .register-error {
            color: #e51b1b;
            font-size: 13.5px;
            margin: -6px 0 10px 2px;
            font-weight: 600;
            line-height: 1.7;
          }
          .agreement-section {
            display: flex;
            flex-direction: column;
            gap: 7px;
            margin-top: 10px;
            margin-bottom: 16px;
          }
          .login-btn {
            width: 100%;
            padding: 13px 0;
            border: none;
            border-radius: 10px;
            background: linear-gradient(90deg, #3577f1 65%, #296fff 100%);
            color: #fff;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -1px;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.17s;
          }
          .login-btn:disabled {
            background: #b8c9e6;
            color: #fff;
            cursor: not-allowed;
          }
          @media (max-width: 500px) {
            .login-form {
              gap: 7px;
              padding-top: 0;
            }
            .login-input {
              padding: 9px 10px;
              font-size: 14.2px;
              border-radius: 8px;
            }
            .input-disabled {
              font-size: 13.2px;
            }
            .input-wrap {
              margin-bottom: 6px;
            }
            .verify-btn, .confirm-btn {
              font-size: 12px;
              padding: 5px 9px;
              border-radius: 3px;
              right: 9px;
              top: 19px;
            }
            .verified-message,
            .timer-message {
              font-size: 12px;
              margin-bottom: 5px;
            }
            .register-error {
              font-size: 12px;
              margin: -4px 0 7px 2px;
            }
            .agreement-section {
              gap: 4px;
              margin-top: 6px;
              margin-bottom: 11px;
            }
            .agreement-item {
              font-size: 12.6px;
            }
            .agreement-item button {
              font-size: 12.5px;
            }
            .agreement-item input[type="checkbox"] {
              width: 14px; height: 14px;
            }
            .login-btn {
              padding: 10px 0;
              font-size: 15px;
              border-radius: 7px;
              margin-top: 7px;
            }
          }
        `}</style>
      </form>
      <div className="login-bottom-bar mobile-only">
        <button
          type="submit"
          className="login-btn"
          disabled={!canRegister}
          form="register-step2-form"
        >
          가입하기
        </button>
      </div>

      {/* 모달: RegisterStep2 내부에서 직접 관리 */}
      {openModal === "terms" && (
        <AgreementModal
          openKey="terms"
          openModal={openModal}
          setOpenModal={setOpenModal}
          setTermsAgree={setTermsAgree}
        />
      )}
      {openModal === "privacy" && (
        <AgreementModal
          openKey="privacy"
          openModal={openModal}
          setOpenModal={setOpenModal}
          setPrivacyAgree={setPrivacyAgree}
        />
      )}
      {openModal === "marketing" && (
        <AgreementModal
          openKey="marketing"
          openModal={openModal}
          setOpenModal={setOpenModal}
          setMarketingAgree={setMarketingAgree}
        />
      )}
    </>
  );
}

// AgreementItem
function AgreementItem({
  checked, setAgree, setOpenModal, openKey, label,
  username, phone, company, department, position,
  termsAgree, privacyAgree, marketingAgree
}) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const goToAgreements = () => {
    if (isMobile) {
      localStorage.setItem("registerStep2Form", JSON.stringify({
        username, phone, company, department, position,
        termsAgree: !!termsAgree,
        privacyAgree: !!privacyAgree,
        marketingAgree: !!marketingAgree,
      }));
      router.push("/register/agreements");
    } else {
      setOpenModal(openKey);
    }
  };

  return (
    <div className="agreement-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          if (checked) {
            setAgree(false);
          } else {
            setAgree(true);
            goToAgreements();
          }
        }}
        style={{ width: 16, height: 16, accentColor: "#3577f1" }}
      />
      <button
        type="button"
        onClick={goToAgreements}
        style={{
          cursor: "pointer",
          color: "#3577f1",
          fontWeight: 400,
          fontSize: 14,
          marginLeft: 8,
          background: "none",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center"
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 8,
            fontSize: 13,
            color: "#3577f1",
            textDecoration: "underline"
          }}
        >
          보기
        </span>
      </button>
      <style jsx>{`
        .agreement-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 14.2px;
          font-weight: 500;
          color: #273c54;
        }
      `}</style>
    </div>
  );
}
