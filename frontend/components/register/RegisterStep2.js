import { useRouter } from "next/router";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // 경로에 따라 다를 수 있음

export default function RegisterStep2({
  socialMode = false,
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
  setOpenModal,
  handleRegister, canRegister,
  error, phoneExists, handleErrorClear,
}) {
  const isDisabled =
    phone.length < 10 || phoneExists || (hasRequestedCode && timeLeft > 0);

  return (
    <form onSubmit={handleRegister} className="register-step2-form" autoComplete="off">
      {!socialMode && (
        <>
          <input
  type="email"
  placeholder="이메일"
  value={email}
  disabled
  required
  className="register-input input-disabled"
  style={{ marginBottom: 16 }}
/>
<input
  type="password"
  placeholder="비밀번호"
  value={password}
  disabled
  required
  className="register-input input-disabled"
  style={{ marginBottom: 16 }}
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
        className="register-input"
      />
      {/* 휴대폰 번호 + 인증 버튼 */}
      <div className="input-wrap">
        <input
          type="tel"
          placeholder="휴대폰번호"
          value={formatPhone(phone)}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
            setPhone(raw);
            checkPhoneDuplicate(raw);
            handleErrorClear();
          }}
          required
          disabled={isVerified}
          className="register-input"
          style={{ paddingRight: 100 }}
        />
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
          {!hasRequestedCode
            ? "인증하기"
            : timeLeft > 0
              ? "전송완료"
              : "재전송"}
        </button>
      </div>
      {/* 인증번호 입력/확인 */}
      {showVerificationInput && (
        <div className="input-wrap" style={{ marginBottom: 6 }}>
          <input
            type="text"
            placeholder="인증번호 입력"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            className="register-input"
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
      {/* 인증 안내/에러/타이머 */}
      {showVerificationInput && (
        isVerified ? (
          <div className="verified-message">✅ 인증이 완료되었습니다.</div>
        ) : verificationError ? (
          <div className="register-error">{verificationError}</div>
        ) : (
          <div className="timer-message">
            {timeLeft > 0
              ? `남은 시간: ${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`
              : "인증 시간이 만료되었습니다."}
          </div>
        )
      )}
      {/* 선택 항목 */}
      <input
        type="text"
        placeholder="(선택) 회사명"
        value={company}
        onChange={e => setCompany(e.target.value)}
        className="register-input"
      />
      <input
        type="text"
        placeholder="(선택) 부서명"
        value={department}
        onChange={e => setDepartment(e.target.value)}
        className="register-input"
      />
      <input
        type="text"
        placeholder="(선택) 직책"
        value={position}
        onChange={e => setPosition(e.target.value)}
        className="register-input"
      />
      {/* 약관동의 */}
      <div className="agreement-section">
        <AgreementItem
          checked={termsAgree}
          setAgree={setTermsAgree}
          setOpenModal={setOpenModal}
          openKey="terms"
          label="(필수) 이용약관 동의"
        />
        <AgreementItem
          checked={privacyAgree}
          setAgree={setPrivacyAgree}
          setOpenModal={setOpenModal}
          openKey="privacy"
          label="(필수) 개인정보 수집 및 이용 동의"
        />
        <AgreementItem
          checked={marketingAgree}
          setAgree={setMarketingAgree}
          setOpenModal={setOpenModal}
          openKey="marketing"
          label="(선택) 마케팅 정보 수신 동의"
          isOptional
        />
      </div>
      {/* 에러 메시지 */}
      {error && <div className="register-error">{error}</div>}
      {/* 가입 버튼 */}
      <button
        type="submit"
        className="submit-btn"
        disabled={!canRegister}
      >
        가입하기
      </button>
      <style jsx>{`
        .register-step2-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Segoe UI', 'sans-serif';
        }
        .register-input {
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 16px;
          border-radius: 11px;
          border: 1.5px solid #e3e9fa;
          font-size: 16.2px;
          background: #fafdff;
          transition: border 0.18s, box-shadow 0.17s;
        }
        .register-input.input-disabled {
  background: #f4f6fa !important;
  color: #8c95a3 !important;
  cursor: not-allowed;
  border-color: #e3e9fa;
  opacity: 1;
}
        .register-input:focus {
          border: 1.8px solid #3577f1;
          box-shadow: 0 2px 10px 0 rgba(60,100,220,0.05);
          outline: none;
        }
        .input-wrap {
          position: relative;
          width: 100%;
          margin-bottom: 8px;
        }
        .verify-btn, .confirm-btn {
  position: absolute;
  top: 50%; 
  transform: translateY(-50%);
  top: 25px;          /* input 상단과 동일 여백 (input padding-top과 맞춰줌) */
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
        .submit-btn {
          width: 100%;
          padding: 13px 0;
          border: none;
          border-radius: 9px;
          background: linear-gradient(90deg, #3577f1 65%, #296fff 100%);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -1px;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.17s;
        }
        .submit-btn:disabled {
          background: #b8c9e6;
          color: #fff;
          cursor: not-allowed;
        }
        @media (max-width: 500px) {
          .register-step2-form {
            padding: 0;
          }
          .register-input {
            padding: 9px 10px;
            margin-bottom: 10px;
            font-size: 14.2px;
            border-radius: 7px;
          }
          .register-input.input-disabled {
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
          .submit-btn {
            padding: 10px 0;
            font-size: 15px;
            border-radius: 7px;
            margin-top: 7px;
          }
        }
      `}</style>
    </form>
  );
}

function AgreementItem({ checked, setAgree, setOpenModal, openKey, label }) {
  const isMobile = useIsMobile();
  const router = useRouter();

  return (
    <div className="agreement-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          if (checked) {
            setAgree(false);
          } else {
            if (isMobile) {
              router.push("/register/agreements");
            } else {
              setOpenModal(openKey);
            }
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (isMobile) {
            router.push("/register/agreements");
          } else {
            setOpenModal(openKey);
          }
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 8,
            fontSize: 13,
            color: "#3577f1",
            textDecoration: "underline",
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
        .agreement-item input[type="checkbox"] {
          accent-color: #3577f1;
          width: 16px;
          height: 16px;
        }
        .agreement-item button {
          all: unset;
          cursor: pointer;
          color: #3577f1;
          font-weight: 400;
          font-size: 14px;
          margin-left: 5px;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

