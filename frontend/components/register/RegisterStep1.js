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
    <form onSubmit={handleNext} autoComplete="off">
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
        style={{
          ...inputStyle,
          borderColor:
            error && (error.includes("이메일") || error.includes("형식"))
              ? "red"
              : "#ccc",
        }}
      />
      {error && error.includes("이메일") && (
        <p style={errorTextStyle}>{error}</p>
      )}

      <div style={{ position: "relative", marginBottom: "15px" }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="비밀번호"
          value={password}
          onFocus={handleEmailCheck}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          style={{
            ...inputStyle,
            marginBottom: 0,
            paddingRight: "40px",
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={toggleButtonStyle}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {passwordError && <p style={errorTextStyle}>{passwordError}</p>}

      <div style={{ position: "relative", marginBottom: "15px" }}>
        <input
          type={showPasswordConfirm ? "text" : "password"}
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          autoComplete="new-password"
          style={{
            ...inputStyle,
            marginBottom: 0,
            paddingRight: "40px",
          }}
        />
        <button
          type="button"
          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
          style={toggleButtonStyle}
        >
          {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {passwordConfirmError && (
        <p style={errorTextStyle}>{passwordConfirmError}</p>
      )}

      <div style={{ fontSize: "13px", color: "#444", marginBottom: "10px" }}>
        <p style={{ marginBottom: "6px" }}>비밀번호 조건:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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
        !error.includes("형식") && <p style={errorTextStyle}>{error}</p>}

      <button
        type="submit"
        disabled={!canGoNext}
        style={{
          ...buttonStyle,
          backgroundColor: canGoNext ? "#0070f3" : "#ccc",
          cursor: canGoNext ? "pointer" : "not-allowed",
        }}
      >
        다음
      </button>
    </form>
  );
}

function PasswordHint({ valid, label }) {
  return (
    <span style={{ color: valid ? "green" : "red", width: "48%" }}>
      {valid ? "✔️" : "❌"} {label}
    </span>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
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

const errorTextStyle = {
  color: "red",
  fontSize: "13px",
  marginTop: "-10px",
  marginBottom: "10px",
};

const toggleButtonStyle = {
  position: "absolute",
  top: 0,
  right: "12px",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#666",
};
