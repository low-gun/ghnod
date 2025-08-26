import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, Key } from "lucide-react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function FindPasswordPage() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pwError, setPwError] = useState("");

  // 비밀번호 유효성 (백엔드 정책과 동일)
  const pwValid = (() => {
    const pw = password || "";
    const hasLen = pw.length >= 6;
    const hasNum = /\d/.test(pw);
    const hasAlpha = /[a-zA-Z]/.test(pw);
    const hasSymbol = /[~!@#$%^&*()_+{}\[\]:;<>,.?/\\\-]/.test(pw);
    return hasLen && hasNum && hasAlpha && hasSymbol && pw === passwordConfirm;
  })();

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [showVerificationInput, setShowVerificationInput] = useState(false); // 유지하되 렌더는 hasRequestedCode 기준
  const [verificationError, setVerificationError] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);

  // 전화번호 정규화: 숫자만 + 82 → 0 변환 + 11자리 제한
  const normalizePhone = (raw = "") => {
    let v = String(raw || "").replace(/\D/g, "");
    if (v.startsWith("82")) v = "0" + v.slice(2);
    return v.slice(0, 11);
  };

  // 타이머 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 입력 변경 시: 인증 요청 전/미인증 상태에서만 초기화
  useEffect(() => {
    if (!hasRequestedCode && !isVerified) {
      setIsVerified(false);
      setVerificationCode("");
      setShowVerificationInput(false);
      setHasRequestedCode(false);
      setVerificationError("");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
    }
  }, [phone, email, hasRequestedCode, isVerified]);

  const handleSendCode = async () => {
    const mail = (email || "").trim();
    if (!mail) {
      setVerificationError("가입 이메일을 입력해 주세요.");
      setShowVerificationInput(true);
      return;
    }
    try {
      await api.post("/auth/phone/send-code", {
        phone: normalizePhone(phone),
        email: mail,
      });
      showAlert("인증번호가 전송되었습니다.");
      setVerificationError("");
      setHasRequestedCode(true);     // 성공시에만 입력란/타이머 노출
      setShowVerificationInput(true);
      setTimeLeft(180);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setVerificationError(e?.response?.data?.error || "인증번호 전송 실패");
      setHasRequestedCode(false);    // 실패면 숨김
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
      showAlert("인증번호 전송 실패");
      // 실패 시 setShowVerificationInput(true) 하지 않음
    }
  };

  const handleVerify = async () => {
    try {
      await api.post("/auth/phone/verify-code", {
        phone: normalizePhone(phone),
        code: verificationCode,
        email: (email || "").trim(),
      });
      setIsVerified(true);
      setVerificationError("");
      showAlert("인증 성공");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
    } catch (e) {
      const msg = e?.response?.data?.error || "인증번호가 일치하지 않습니다.";
      setVerificationError(msg);
    }
  };

  const handleResetPassword = async () => {
    const pw = password || "";
    const okLen = pw.length >= 6;
    const okNum = /\d/.test(pw);
    const okAlpha = /[a-zA-Z]/.test(pw);
    const okSym = /[~!@#$%^&*()_+{}\[\]:;<>,.?/\\\-]/.test(pw);
    if (!(okLen && okNum && okAlpha && okSym)) {
      showAlert("영문+숫자+특수문자 포함, 6자 이상이어야 합니다.");
      return;
    }
    if (pw !== passwordConfirm) {
      showAlert("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      await api.post("/auth/reset-password", {
        email: (email || "").trim(),
        phone: normalizePhone(phone),
        newPassword: pw,
      });
      showAlert("비밀번호가 재설정되었습니다. 다시 로그인하세요.");
      router.push("/login");
    } catch {
      showAlert("비밀번호 재설정 실패");
    }
  };

  const isDisabled =
    !(email || "").trim() ||
    normalizePhone(phone).length < 10 ||
    (hasRequestedCode && timeLeft > 0);

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="title-bar">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.back()}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="title-wrap">
            <Key size={32} color="#3577f1" style={{ marginBottom: 4 }} />
            <h2 className="title">비밀번호 찾기</h2>
          </div>
        </div>

        <form
          id="find-password-form"
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
          className="login-form"
        >
          <input
            type="email"
            placeholder="가입 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
            autoComplete="email"
          />

          <div className="input-wrap">
            <input
              type="tel"
              placeholder="휴대폰번호"
              value={phone}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
              onKeyDown={(e) => {
                const allow = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
                if (allow.includes(e.key)) return;
                if (!/^\d$/.test(e.key)) e.preventDefault(); // 하이픈 등 비숫자 차단
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData("text") || "";
                const cleaned = normalizePhone(text);
                setPhone((prev) => normalizePhone(prev + cleaned));
              }}
              maxLength={11}
              className="login-input"
              required
              style={{ paddingRight: 100 }}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
            />
            {!isVerified && (
              <button
                type="button"
                className="verify-btn"
                onClick={handleSendCode}
                disabled={isDisabled} // 에러 여부와 무관하게 재전송 허용
              >
                {!hasRequestedCode
                  ? "인증하기"
                  : timeLeft > 0
                  ? "전송완료"
                  : "재전송"}
              </button>
            )}
          </div>

          {/* 전송 실패 에러: 코드 입력란 없이 휴대폰 입력 아래에만 노출 */}
          {!hasRequestedCode && !!verificationError && (
            <div className="register-error" aria-live="assertive" style={{ marginTop: 6 }}>
              {verificationError}
            </div>
          )}

          {/* 인증번호 입력 */}
          {hasRequestedCode && !isVerified && (
            <div className="input-wrap" style={{ marginBottom: 6 }}>
              <input
                type="text"
                placeholder="인증번호 입력"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                className="login-input"
                maxLength={6}
                style={{ paddingRight: 80 }}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                aria-label="인증번호 입력"
              />
              <button
                type="button"
                className="confirm-btn"
                onClick={handleVerify}
                disabled={!verificationCode}
              >
                확인
              </button>
            </div>
          )}

          {/* 메시지 출력 */}
          {hasRequestedCode &&
            (isVerified ? (
              <div className="verified-message" style={{ marginTop: 8 }} aria-live="polite">
                ✅ 인증이 완료되었습니다.
              </div>
            ) : verificationError ? (
              <div className="register-error" aria-live="assertive">{verificationError}</div>
            ) : (
              <div className="timer-message" aria-live="polite">
                {timeLeft > 0
                  ? `남은 시간: ${String(Math.floor(timeLeft / 60)).padStart(
                      2,
                      "0"
                    )}:${String(timeLeft % 60).padStart(2, "0")}`
                  : "인증 시간이 만료되었습니다."}
              </div>
            ))}

          {/* 비밀번호 재설정 */}
          {isVerified && (
            <>
              <input
                type="password"
                placeholder="새 비밀번호"
                value={password}
                onChange={(e) => {
                  const v = e.target.value;
                  setPassword(v);
                  const okLen = v.length >= 6;
                  const okNum = /\d/.test(v);
                  const okAlpha = /[a-zA-Z]/.test(v);
                  const okSym = /[~!@#$%^&*()_+{}\[\]:;<>,.?/\\\-]/.test(v);
                  if (!okLen || !okNum || !okAlpha || !okSym) {
                    setPwError("영문+숫자+특수문자 포함, 6자 이상이어야 합니다.");
                  } else if (passwordConfirm && v !== passwordConfirm) {
                    setPwError("비밀번호 확인이 일치하지 않습니다.");
                  } else {
                    setPwError("");
                  }
                }}
                className="login-input"
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => {
                  const v = e.target.value;
                  setPasswordConfirm(v);
                  if ((password || "").length < 6) {
                    setPwError("영문+숫자+특수문자 포함, 6자 이상이어야 합니다.");
                  } else if (password !== v) {
                    setPwError("비밀번호 확인이 일치하지 않습니다.");
                  } else {
                    setPwError("");
                  }
                }}
                className="login-input"
                autoComplete="new-password"
              />

              {pwError && (
                <div className="register-error" style={{ marginTop: 6 }}>{pwError}</div>
              )}
              <button
                type="button"
                className="login-btn desktop-only"
                onClick={handleResetPassword}
                disabled={!pwValid}
              >
                비밀번호 재설정
              </button>
            </>
          )}
        </form>
      </div>

      {/* 모바일 하단바 */}
      {!isVerified && !hasRequestedCode && (
        <div className="login-bottom-bar mobile-only">
          <button
            type="button"
            className="login-btn"
            onClick={handleSendCode}
            disabled={isDisabled}
          >
            {!hasRequestedCode ? "인증하기" : timeLeft > 0 ? "전송완료" : "재전송"}
          </button>
        </div>
      )}

      {hasRequestedCode && !isVerified && (
        <div className="login-bottom-bar mobile-only">
          <button
            type="button"
            className="login-btn"
            onClick={handleVerify}
            disabled={!verificationCode}
          >
            확인
          </button>
        </div>
      )}

      {isVerified && (
        <div className="login-bottom-bar mobile-only">
          <button
            type="button"
            className="login-btn"
            onClick={handleResetPassword}
            disabled={!pwValid}
          >
            비밀번호 재설정
          </button>
        </div>
      )}

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
          box-shadow: 0 2px 10px 0 rgba(60, 100, 220, 0.05);
        }
        .input-wrap {
          position: relative;
          width: 100%;
          min-width: 0;
          margin-bottom: 0;
        }
        .verify-btn,
        .confirm-btn {
          position: absolute;
          top: 25px;
          right: 16px;
          transform: translateY(-50%);
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1.2px solid #3577f1;
          background: #fff;
          color: #3577f1;
          cursor: pointer;
          transition: background 0.14s, color 0.14s, border 0.14s;
        }
        .verify-btn:disabled,
        .confirm-btn:disabled {
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
          font-weight: 400;
          line-height: 1.7;
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
          .input-wrap {
            margin-bottom: 6px;
          }
          .verify-btn,
          .confirm-btn {
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
          .login-btn {
            padding: 10px 0;
            font-size: 15px;
            border-radius: 7px;
            margin-top: 7px;
          }
        }
      `}</style>
    </div>
  );
}
