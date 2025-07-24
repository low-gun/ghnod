import { Eye, EyeOff } from "lucide-react";

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
}) {
  return (
    <form onSubmit={handleNext} autoComplete="off" className="register-step1-form">
      <input type="text" name="fake_email" autoComplete="username" style={{ display: "none" }} />
      <input type="password" name="fake_password" autoComplete="new-password" style={{ display: "none" }} />

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="off"
        className={`register-input ${error && (error.includes("이메일") || error.includes("형식")) ? "input-error" : ""}`}
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
          className="register-input"
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
          className="register-input"
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
          <PasswordHint valid={/[~!@#$%^&*()_+{}\[\]:;<>,.?/\\\-]/.test(password)} label="특수문자 포함" />
        </div>
      </div>

      {error && !error.includes("이메일") && !error.includes("비밀번호") && !error.includes("형식") &&
        <p className="register-error">{error}</p>
      }

      <button
        type="submit"
        disabled={!canGoNext}
        className="register-next-btn"
      >
        다음
      </button>

      <style jsx>{`
        .register-step1-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 2px;
        }
        .register-input {
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 2px;
          border-radius: 11px;
          border: 1.5px solid #e3e9fa;
          font-size: 16.2px;
          background: #fafdff;
          transition: border 0.18s, box-shadow 0.17s;
        }
        .register-input:focus {
          border: 1.8px solid #3577f1;
          box-shadow: 0 2px 10px 0 rgba(60,100,220,0.05);
        }
        .register-input.input-error {
          border-color: #e51b1b;
        }
        .input-wrap {
          position: relative;
          width: 100%;
        }
        .toggle-btn {
          position: absolute;
          right: 15px;
          top: 0;
          height: 100%;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          color: #687491;
          cursor: pointer;
          padding: 0;
        }
        .register-error {
          color: #e51b1b;
          font-size: 13.5px;
          margin: 0 0 8px 2px;
          font-weight: 600;
          line-height: 1.7;
        }
        .password-conditions {
          font-size: 13.3px;
          color: #444;
          margin-bottom: 10px;
        }
        .password-hints {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 무조건 2열 */
  gap: 7px 0;
  margin-top: 3px;
}
.password-hints span {
  min-width: 0;
  font-size: 13.2px;
  font-weight: 600;
}

        .register-next-btn {
          margin-top: 12px;
          width: 100%;
          padding: 12px 0;
          border: none;
          border-radius: 9px;
          background: linear-gradient(90deg, #3577f1 65%, #296fff 100%);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -1px;
          cursor: pointer;
          transition: background 0.17s;
        }
        .register-next-btn:disabled {
          background: #b8c9e6;
          color: #fff;
          cursor: not-allowed;
        }
        @media (max-width: 500px) {
          .register-step1-form {
            gap: 7px;
            padding-top: 0;
          }
          .register-input {
            padding: 10px 11px;
            font-size: 15px;
            border-radius: 7px;
          }
          .toggle-btn {
            right: 10px;
          }
          .register-error {
            font-size: 12.2px;
            margin-bottom: 5px;
          }
          .password-conditions {
            font-size: 12.2px;
            margin-bottom: 7px;
          }
          .password-hints {
            gap: 4px 0;
            font-size: 12px;
          }
          .register-next-btn {
            margin-top: 8px;
            padding: 10px 0;
            font-size: 15.2px;
            border-radius: 7px;
          }
        }
      `}</style>
    </form>
  );
}

function PasswordHint({ valid, label }) {
  return (
    <span style={{
      color: valid ? "#24a340" : "#e51b1b",
      fontWeight: 400,
      fontSize: "13.2px"
    }}>
      {valid ? "✔️" : "❌"} {label}
    </span>
  );
}
