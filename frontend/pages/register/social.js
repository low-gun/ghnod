import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import RegisterStep2 from "components/register/RegisterStep2";
// 다양한 환경에서 안전하게 import
import jwt_decode_def, * as jwt_decode_ns from "jwt-decode";

export default function SocialRegisterPage() {
  const router = useRouter();
  const { token } = router.query; // 쿼리에서 임시토큰 추출

  // Step2용 상태값 준비
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // window.onerror로 예상치 못한 런타임 에러까지 포착
    window.onerror = function (message, source, lineno, colno, error) {
      console.log("[window.onerror] 메시지:", message);
      console.log("[window.onerror] error 객체:", error);
    };

    console.log("[social] token 값:", token);
    if (!token) return;

    // 다양한 번들링 환경을 위한 함수 선택
    const jwt_decode_func =
      jwt_decode_def || jwt_decode_ns.default || jwt_decode_ns;

    console.log(
      "[social] typeof jwt_decode_def:",
      typeof jwt_decode_def,
      jwt_decode_def
    );
    console.log(
      "[social] typeof jwt_decode_ns:",
      typeof jwt_decode_ns,
      jwt_decode_ns
    );
    console.log(
      "[social] typeof jwt_decode_func:",
      typeof jwt_decode_func,
      jwt_decode_func
    );

    console.log("[social] jwt_decode 호출 try 블록 진입");
    try {
      console.log("[social] jwt_decode 호출 직전");
      const payload = jwt_decode_func(token);
      console.log("[social] jwt_decode 호출 직후");

      console.log("[social] jwt payload:", payload);
      setForm(prev => ({
        ...prev,
        username: payload.name || prev.username,
        phone: payload.phone || prev.phone,
        email: payload.email || prev.email,
      }));
    } catch (e) {
      console.log("[social] jwt_decode catch 진입. e:", e);
      if (e) {
        console.log("[social] jwt_decode 실패. name:", e.name);
        console.log("[social] jwt_decode 실패. message:", e.message);
        console.log("[social] jwt_decode 실패. stack:", e.stack);
      } else {
        console.log("[social] catch문에서 e가 undefined 또는 null");
      }
      router.replace("/login");
    }
  }, [token, router]);

  // 입력 핸들러 예시
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 소셜 추가정보 최종 제출
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
    <RegisterStep2
      socialMode={true}
      email={form.email}
      setEmail={val => setForm(f => ({ ...f, email: val }))}
      username={form.username}
      setUsername={val => setForm(f => ({ ...f, username: val }))}
      phone={form.phone}
      setPhone={val => setForm(f => ({ ...f, phone: val }))}
      formatPhone={v => v.replace(/(\d{3})(\d{3,4})?(\d{4})?/, function(_, a, b, c) {
        return b && c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a;
      })}
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
  );
}
