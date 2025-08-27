import { Eye, EyeOff } from "lucide-react";
import { useEffect } from "react"; // ★ 이 줄 추가

export default function RegisterStep1({
  email,
  password,
  passwordConfirm,
  error,
  passwordError,
  passwordConfirmError,
  showPassword,
  setShowPassword,
  showPasswordConfirm,
  setShowPasswordConfirm,
  handleEmailCheck,
  handleNext,
  setEmail,
  setPassword,
  setPasswordConfirm,
  canGoNext,
  setPasswordConfirmError, // ← props로 받을 것
}) {
  // 비밀번호 확인 에러 자동 세팅
  useEffect(() => {
    if (!passwordConfirm) {
      setPasswordConfirmError("");
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordConfirmError("");
    }
  }, [password, passwordConfirm, setPasswordConfirmError]);
  return (
    <>
    <form
  onSubmit={(e) => {
    e.preventDefault();
    // 기존 값 불러오기
    const prev = JSON.parse(localStorage.getItem("registerStep2Form") || "{}");

    // Step1 값 병합해서 저장
    const merged = {
      ...prev,
      email,
      password,
    };
    localStorage.setItem("registerStep2Form", JSON.stringify(merged));

    // 원래 handleNext 실행
    handleNext(e);
  }}
  autoComplete="off"
  className="login-form"
  id="register-step1-form"
>

        <input
          type="text"
          name="fake_email"
          autoComplete="username"
          style={{ display: "none" }}
        />
        <input
          type="password"
          name="fake_password"
          autoComplete="new-password"
          style={{ display: "none" }}
        />

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
          className={`login-input ${error && (error.includes("이메일") || error.includes("형식")) ? "input-error" : ""}`}
        />
        {error && error.includes("이메일") && (
          <p className="register-error">{error}</p>
        )}

        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            value={password}
            onFocus={handleEmailCheck}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="login-input"
          />
          <button
            type="button"
            tabIndex={-1}
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {passwordError && <p className="register-error">{passwordError}</p>}

        <div className="input-wrap">
          <input
            type={showPasswordConfirm ? "text" : "password"}
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="login-input"
          />
          <button
            type="button"
            tabIndex={-1}
            className="toggle-btn"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
          >
            {showPasswordConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {passwordConfirmError && (
          <p className="register-error">{passwordConfirmError}</p>
        )}

        <div className="password-conditions">
          <span>비밀번호 조건:</span>
          <div className="password-hints">
            <PasswordHint valid={password.length >= 6} label="6자 이상" />
            <PasswordHint valid={/[a-zA-Z]/.test(password)} label="영문 포함" />
            <PasswordHint valid={/\d/.test(password)} label="숫자 포함" />
            <PasswordHint
              valid={/[~!@#$%^&*()_+{}\[\]:;<>,.?/\\\-]/.test(password)}
              label="특수문자 포함"
            />
          </div>
        </div>

        {error &&
          !error.includes("이메일") &&
          !error.includes("비밀번호") &&
          !error.includes("형식") && <p className="register-error">{error}</p>}
        <button
          type="submit"
          disabled={!canGoNext}
          className="login-btn desktop-only"
        >
          다음
        </button>
      </form>
      <div className="login-bottom-bar mobile-only">
        <button
          type="submit"
          className="login-btn"
          disabled={!canGoNext}
          form="register-step1-form"
        >
          다음
        </button>
      </div>
    </>
  );
}

function PasswordHint({ valid, label }) {
  return (
    <span
      style={{
        color: valid ? "#24a340" : "#e51b1b",
        fontWeight: 400,
        fontSize: "13.2px",
      }}
    >
      {valid ? "✔️" : "❌"} {label}
    </span>
  );
}
