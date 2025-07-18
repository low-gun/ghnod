import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import RegisterStep2 from "components/register/RegisterStep2";
import * as jwt_decode from "jwt-decode"; // 꼭 설치: npm install jwt-decode

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
    // name, email, photo 등 자동값도 필요하면 추가 가능
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // (선택) 토큰 없으면 진입 막기
  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      // token 값이 있으면 프로필 값 자동 세팅
      const payload = jwt_decode(token);
      setForm(prev => ({
        ...prev,
        username: payload.name || prev.username,
        phone: payload.phone || prev.phone,
        email: payload.email || prev.email,
        // photo: payload.photo || prev.photo,
      }));
    } catch (e) {
      // 토큰 파싱 오류(유효하지 않은 토큰) → 로그인으로 리디렉션
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
      // 가입완료 후 로그인 처리/이동 등
      router.replace("/login?success=social");
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  // RegisterStep2를 소셜모드로 활용
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
      checkPhoneDuplicate={() => {}}  // (실제 구현에 맞게)
      isVerified={false}              // (실제 인증로직에 맞게)
      setIsVerified={() => {}}        // (실제 인증로직에 맞게)
      verificationCode={form.verificationCode}
      setVerificationCode={val => setForm(f => ({ ...f, verificationCode: val }))}
      showVerificationInput={form.showVerificationInput}
      setShowVerificationInput={val => setForm(f => ({ ...f, showVerificationInput: val }))}
      hasRequestedCode={form.hasRequestedCode}
      setHasRequestedCode={val => setForm(f => ({ ...f, hasRequestedCode: val }))}
      timeLeft={form.timeLeft}
      setTimeLeft={val => setForm(f => ({ ...f, timeLeft: val }))}
      timerRef={{ current: null }}    // (타이머 로직 연결 시 실제 값)
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
      setOpenModal={() => {}}  // (실제 약관 모달로직 연결)
      handleRegister={handleSubmit}
      canRegister={true}       // (조건 맞게 구현)
      error={error}
      phoneExists={false}      // (중복확인로직 연결 시 값)
      handleErrorClear={() => {}}
    />
  );
  
}
