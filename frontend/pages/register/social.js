import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import RegisterStep2 from "components/register/RegisterStep2";
import { jwtDecode } from "jwt-decode";

export default function SocialRegisterPage() {
  const router = useRouter();
  const { token } = router.query;

  const [form, setForm] = useState({
    username: "",
    phone: "",
    email: "",
    company: "",
    department: "",
    position: "",
    terms_agree: false,
    privacy_agree: false,
    marketing_agree: false,
  });

  useEffect(() => {
    window.onerror = function (message, source, lineno, colno, error) {
      // 예기치 못한 런타임 에러도 확인
      console.log("[window.onerror] 메시지:", message);
      console.log("[window.onerror] error 객체:", error);
      alert(`[window.onerror]\n${message}\n${error}`);
    };

    console.log("[social] token 값:", token);
    // ✅ typeof 체크로 빌드/번들 문제 즉시 확인
      console.log("[social] typeof jwtDecode:", typeof jwtDecode, jwtDecode);
      if (!jwtDecode || typeof jwtDecode !== "function") {
        alert("jwtDecode 함수 import 실패! 번들/빌드 환경 오류, 관리자 문의 필요");
        console.error("[social] jwtDecode import 실패: ", jwtDecode);
        return;
      }

    if (!token) {
      console.log("[social] token이 undefined/null/빈값");
      return;
    }

    console.log("[social] jwtDecode 호출 try 블록 진입");
    try {
      console.log("[social] jwtDecode 호출 직전");
      const payload = jwtDecode(token);
      console.log("[social] jwtDecode 호출 직후");
      console.log("[social] jwt payload:", payload);

      setForm(prev => ({
        ...prev,
        username: payload.name || prev.username,
        phone: payload.phone || prev.phone,
        email: payload.email || prev.email,
      }));
    } catch (e) {
      console.log("[social] jwtDecode catch 진입. e:", e);
      if (e) {
        console.log("[social] jwtDecode 실패. name:", e.name);
        console.log("[social] jwtDecode 실패. message:", e.message);
        console.log("[social] jwtDecode 실패. stack:", e.stack);
        alert(
          "[social] jwtDecode 실패\n" +
          "name: " + e.name + "\n" +
          "message: " + e.message + "\n" +
          "stack: " + (e.stack ? e.stack.split("\n")[0] : "")
        );
      } else {
        alert("[social] jwtDecode catch문에서 e가 undefined 또는 null");
      }
      router.replace("/login");
    }
  }, [token, router]);

  // 입력 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 소셜 추가정보 최종 제출
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "서버 오류");
      setSuccess(true);
      router.replace("/login?success=social");
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        height: "80vh",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "360px",
          padding: "40px",
          borderRadius: "8px",
          background: "#fff",
          boxShadow: "none",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              position: "absolute",
              left: 0,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "#666",
              fontWeight: "bold",
            }}
            aria-label="뒤로가기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#666",
                margin: 0,
              }}
            >
              회원가입
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#999",
                marginTop: "6px",
              }}
            >
              개인정보
            </p>
          </div>
        </div>
  
        <RegisterStep2
          socialMode={true}
          email={form.email}
          setEmail={val => setForm(f => ({ ...f, email: val }))}
          username={form.username}
          setUsername={val => setForm(f => ({ ...f, username: val }))}
          phone={form.phone}
          setPhone={val => setForm(f => ({ ...f, phone: val }))}
          formatPhone={v =>
            v.replace(/(\d{3})(\d{3,4})?(\d{4})?/, function (_, a, b, c) {
              return b && c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a;
            })
          }
          checkPhoneDuplicate={() => {}}
          isVerified={false}
          setIsVerified={() => {}}
          verificationCode={form.verificationCode}
          setVerificationCode={val => setForm(f => ({ ...f, verificationCode: val }))}
          showVerificationInput={form.showVerificationInput}
          setShowVerificationInput={val => setForm(f => ({ ...f, showVerificationInput: val }))}
          hasRequestedCode={form.hasRequestedCode}
          setHasRequestedCode={val => setForm(f => ({ ...f, hasRequestedCode: val }))}
          timeLeft={form.timeLeft}
          setTimeLeft={val => setForm(f => ({ ...f, timeLeft: val }))}
          timerRef={{ current: null }}
          verificationError={form.verificationError}
          setVerificationError={val => setForm(f => ({ ...f, verificationError: val }))}
          company={form.company}
          setCompany={val => setForm(f => ({ ...f, company: val }))}
          department={form.department}
          setDepartment={val => setForm(f => ({ ...f, department: val }))}
          position={form.position}
          setPosition={val => setForm(f => ({ ...f, position: val }))}
          termsAgree={form.terms_agree}
          setTermsAgree={val => setForm(f => ({ ...f, terms_agree: val }))}
          privacyAgree={form.privacy_agree}
          setPrivacyAgree={val => setForm(f => ({ ...f, privacy_agree: val }))}
          marketingAgree={form.marketing_agree}
          setMarketingAgree={val => setForm(f => ({ ...f, marketing_agree: val }))}
          setOpenModal={() => {}}
          handleRegister={handleSubmit}
          canRegister={true}
          error={error}
          phoneExists={false}
          handleErrorClear={() => {}}
        />
      </div>
    </div>
  );
  }
