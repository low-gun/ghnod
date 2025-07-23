import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import RegisterStep2 from "components/register/RegisterStep2";
// 네임스페이스+default+require 방식 모두 체크
import jwt_decode_def, * as jwt_decode_ns from "jwt-decode";

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
    // window.onerror로 예기치 못한 에러까지 확인
    window.onerror = function (message, source, lineno, colno, error) {
      console.log("[window.onerror] 메시지:", message);
      console.log("[window.onerror] error 객체:", error);
      alert(`[window.onerror]\n${message}\n${error}`);
    };

    // jwt-decode import, 번들링 상태 전체 점검
    console.log("[social] token 값:", token);

    // 네임스페이스/디폴트/직접 require까지 모두 체크
    const jwt_decode_func =
      jwt_decode_def && typeof jwt_decode_def === "function"
        ? jwt_decode_def
        : jwt_decode_ns && typeof jwt_decode_ns.default === "function"
        ? jwt_decode_ns.default
        : jwt_decode_ns && typeof jwt_decode_ns === "function"
        ? jwt_decode_ns
        : undefined;

    // 함수 타입/네임스페이스/직접 값 콘솔 전체 찍기
    console.log("[social] typeof jwt_decode_def:", typeof jwt_decode_def, jwt_decode_def);
    console.log("[social] typeof jwt_decode_ns:", typeof jwt_decode_ns, jwt_decode_ns);
    console.log("[social] typeof jwt_decode_func:", typeof jwt_decode_func, jwt_decode_func);

    // 함수 아닌 경우 (빌드/번들 문제) 얼럿 + 콘솔
    if (!jwt_decode_func || typeof jwt_decode_func !== "function") {
      console.log("[social] jwt_decode_func이 function이 아님! 빌드/번들/import 문제입니다.");
      alert("jwt_decode import 실패! 번들/배포 환경 문제! 관리자에게 문의해주세요.");
      return;
    }

    if (!token) {
      console.log("[social] token이 undefined/null/빈값");
      return;
    }

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
        alert(
          "[social] jwt_decode 실패\n" +
          "name: " + e.name + "\n" +
          "message: " + e.message + "\n" +
          "stack: " + (e.stack ? e.stack.split("\n")[0] : "")
        );
      } else {
        console.log("[social] catch문에서 e가 undefined 또는 null");
        alert("[social] jwt_decode catch문에서 e가 undefined 또는 null");
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
