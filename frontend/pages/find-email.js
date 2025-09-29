import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, Mail } from "lucide-react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import Head from "next/head"; // 👈 추가

export default function FindEmailPage() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [didSearch, setDidSearch] = useState(false); // 이메일 조회 여부

  // 결과 1개면 자동 선택
  useEffect(() => {
    if (emails.length === 1) {
      setSelectedEmail(emails[0] || "");
    } else {
      setSelectedEmail("");
    }
  }, [emails]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 입력값 변경 시 불필요 초기화 방지: 인증 요청 전/미인증 상태에서만 초기화
  useEffect(() => {
    if (!hasRequestedCode && !isVerified) {
      resetVerificationFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, username]);

  const resetVerificationFlow = () => {
    setIsVerified(false);
    setVerificationCode("");
    setShowVerificationInput(false);
    setHasRequestedCode(false);
    setVerificationError("");
    setEmails([]);           // 이전 조회 결과 초기화
    setDidSearch(false);     // 조회 여부 초기화
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(0);
  };

  const handleSendCode = async () => {
    const name = (username || "").trim();
    if (!name) {
      setVerificationError("이름을 입력해 주세요.");
      setShowVerificationInput(true);
      return;
    }

    try {
      await api.post("/auth/phone/send-code/recover", {
        phone: (phone || "").replace(/\D/g, ""),
        username: name,
      });     
      showAlert("인증번호가 전송되었습니다.");
      setVerificationError("");
      setShowVerificationInput(true);
      setHasRequestedCode(true);
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
      setHasRequestedCode(false);            // 전송 실패: 조회 상태 해제
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
      showAlert("인증번호 전송 실패");
      // setShowVerificationInput(true) 제거 → 실패 시 입력란 안 보이게
    }
    
  };

  const handleVerify = async () => {
    try {
      await api.post("/auth/phone/verify-code/recover", {
        phone: (phone || "").replace(/\D/g, ""),
        code: verificationCode,
        username,
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

  const handleFindEmail = async () => {
    try {
      const { data } = await api.post("/auth/find-email", {
        username,
        phone: (phone || "").replace(/\D/g, ""),
      });
      setDidSearch(true);
      setEmails(data.emails || []);
      if (!data.emails || data.emails.length === 0) {
        showAlert("해당 정보로 조회된 이메일이 없습니다.");
        setEmails([]);
      }
    } catch {
      setDidSearch(true);
      showAlert("이메일 찾기 실패");
    }
  };

  const isDisabled =
    !(username || "").trim() ||
    (phone || "").length < 10 ||
    (hasRequestedCode && timeLeft > 0);

  const maskEmail = (e = "") => {
    const [id = "", domain = ""] = e.split("@");
    if (!id || !domain) return e;
    const head = id.slice(0, 2);
    const tail = id.length > 2 ? id.slice(-1) : "";
    const maskedId =
      head + "*".repeat(Math.max(1, id.length - head.length - tail.length)) + tail;
    return `${maskedId}@${domain}`;
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
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
            <Mail size={32} color="#3577f1" style={{ marginBottom: 4 }} />
            <h2 className="title">이메일 찾기</h2>
          </div>
        </div>

        <form
          id="find-email-form"
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
          className="login-form"
        >
          <input
            type="text"
            placeholder="이름"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
            autoComplete="name"
          />

          <div className="input-wrap">
          <input
  type="tel"
  placeholder="휴대폰번호"
  value={phone}
  onChange={(e) =>
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
  }
  onKeyDown={(e) => {
    const allowKeys = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End",
    ];
    if (allowKeys.includes(e.key)) return;
    // 숫자 1글자만 허용 (하이픈 포함 비숫자 전부 차단)
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }}
  onPaste={(e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text") || "";
    const cleaned = text.replace(/\D/g, "").slice(0, 11);
    // 붙여넣기도 숫자만 11자리까지 반영
    setPhone((prev) => (prev + cleaned).slice(0, 11));
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
            disabled={isDisabled}
          >
          
                {!hasRequestedCode
                  ? "인증하기"
                  : timeLeft > 0
                  ? "전송완료"
                  : "재전송"}
              </button>
            )}
          </div>
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
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
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
    <div className="verified-message" aria-live="polite">✅ 인증이 완료되었습니다.</div>
  ) : verificationError ? (
    <div className="register-error" aria-live="assertive">{verificationError}</div>
  ) : (
    <div className="timer-message" aria-live="polite">
      {timeLeft > 0
        ? `남은 시간: ${String(Math.floor(timeLeft / 60)).padStart(2,"0")}:${String(timeLeft % 60).padStart(2,"0")}`
        : "인증 시간이 만료되었습니다."}
    </div>
  ))}


          {/* 데스크탑: 이메일 확인 버튼 (조회 전 상태에서만 노출) */}
          {isVerified && !didSearch && (
            <button
              type="button"
              className="login-btn desktop-only"
              onClick={handleFindEmail}
            >
              이메일 확인
            </button>
          )}

          {/* 결과 영역: 인증완료 + 조회 후에만 노출 */}
          {isVerified && didSearch && (
            emails.length > 0 ? (
              <div className="result" style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                  >
                  찾은 계정 중 하나를 선택해 주세요.<br />
                  (보안을 위해 일부 마스킹되었습니다)
                </div>
                {emails.map((email, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "6px 0",
                    }}
                  >
                    <input
                      type="radio"
                      name="foundEmail"
                      value={email}
                      checked={selectedEmail === email}
                      onChange={() => setSelectedEmail(email)}
                      style={{ accentColor: "#3577f1" }}
                      aria-label={`이메일 선택: ${maskEmail(email)}`}
                    />
                    <span>{maskEmail(email)}</span>
                  </label>
                ))}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    className="login-btn"
                    onClick={() =>
                      router.push(
                        `/login?email=${encodeURIComponent(selectedEmail)}`
                      )
                    }
                    disabled={!selectedEmail}
                  >
                    로그인하러 가기
                  </button>
                  <button
  type="button"
  className="login-btn"
  onClick={() =>
    router.push(
      `/find-password?email=${encodeURIComponent(selectedEmail)}`
    )
  }
  disabled={!selectedEmail}
>
  비밀번호 초기화
</button>

                </div>
              </div>
            ) : (
              <div
                className="result"
                style={{ marginTop: 20, textAlign: "center" }}
                aria-live="polite"
              >
                <p style={{ marginBottom: 10 }}>
                  가입된 계정을 찾을 수 없습니다.
                </p>
                <button
                  type="button"
                  className="login-btn"
                  onClick={() => router.push("/register")}
                >
                  회원가입 하기
                </button>
              </div>
            )
          )}
        </form>
      </div>

      {/* 모바일 하단바 */}
      {!isVerified && !showVerificationInput && (
  <div className="login-bottom-bar mobile-only">
    <button
      type="button"
      className="login-btn"
      onClick={handleSendCode}
      disabled={isDisabled}
    >

            {!hasRequestedCode
              ? "인증하기"
              : timeLeft > 0
              ? "전송완료"
              : "재전송"}
          </button>
        </div>
      )}

      {showVerificationInput && !isVerified && (
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

      {/* 인증 완료 후 아직 이메일 조회 전 */}
      {isVerified && !didSearch && (
        <div className="login-bottom-bar mobile-only">
          <button
            type="button"
            className="login-btn"
            onClick={handleFindEmail}
          >
            이메일 확인
          </button>
        </div>
      )}

      {/* 조회 후 결과 없음 */}
      {isVerified && didSearch && emails.length === 0 && (
        <div className="login-bottom-bar mobile-only">
          <button
            type="button"
            className="login-btn"
            onClick={() => router.push("/register")}
          >
            회원가입 하러 가기
          </button>
        </div>
      )}

      {/* 스타일은 기존 그대로 유지 */}
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
        .confirm-btn:disabled {f
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
      `}</style>
 </div>
    </>
  );
}