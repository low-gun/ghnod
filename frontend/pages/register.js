import { useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, UserPlus } from "lucide-react";
import RegisterStep1 from "@/components/register/RegisterStep1";
import RegisterStep2 from "@/components/register/RegisterStep2";
import useRegisterForm from "@/components/register/useRegisterForm";

export default function RegisterPage() {
  const form = useRegisterForm();
  const router = useRouter();
  const { step, setStep } = form;

  // 페이지 진입 시 localStorage 초기화
// 페이지 진입 시 localStorage 초기화 (모바일 referrer 미제공 대비)
useEffect(() => {
  const before = localStorage.getItem("registerStep2Form");
  const shouldReset = router.query.reset === "1";
  const stepParam = String(router.query.step || "");
  const isInternalNav = stepParam === "1" || stepParam === "2"; // 약관/등록 내부 이동

  const action = shouldReset ? "reset=1" : (!isInternalNav ? "external-init" : "keep");
  console.log("[REGISTER] init", {
    stepParam,
    isInternalNav,
    shouldReset,
    action,
    beforeParsed: (() => { try { return JSON.parse(before || "{}"); } catch { return {}; } })(),
  });

  if (action !== "keep") {
    localStorage.removeItem("registerStep2Form");
    console.log("[REGISTER] cleared LS due to:", action);
  } else {
    console.log("[REGISTER] kept LS");
  }
}, [router.query.reset, router.query.step]);


  

  // 쿼리 파라미터에서 step 읽어와서 반영
  useEffect(() => {
    if (!router.isReady) return;
    const qsStep = Number(router.query.step);
    if (qsStep === 1 || qsStep === 2) setStep(qsStep);
  }, [router.isReady, router.query.step, setStep]);


  return (
    <div className="login-root">
      <div className="login-card">
        <div className="title-bar">
          <button
            type="button"
            className="back-btn"
            onClick={() => (step === 1 ? router.back() : setStep(1))}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="title-wrap">
            <UserPlus size={32} color="#3577f1" style={{ marginBottom: 4 }} />
            <h2 className="title">회원가입</h2>
            <p className="subtitle">
              {step === 1 ? "계정정보" : "개인정보"}
            </p>
          </div>
        </div>
        {step === 1 ? (
          <RegisterStep1 {...form} />
        ) : (
          <RegisterStep2
            socialMode={false}
            email={form.email}
            setEmail={form.setEmail}
            password={form.password}
            setPassword={form.setPassword}
            username={form.username}
            setUsername={form.setUsername}
            phone={form.phone}
            setPhone={form.setPhone}
            formatPhone={form.formatPhone}
            checkPhoneDuplicate={form.checkPhoneDuplicate}
            isVerified={form.isVerified}
            setIsVerified={form.setIsVerified}
            verificationCode={form.verificationCode}
            setVerificationCode={form.setVerificationCode}
            showVerificationInput={form.showVerificationInput}
            setShowVerificationInput={form.setShowVerificationInput}
            hasRequestedCode={form.hasRequestedCode}
            setHasRequestedCode={form.setHasRequestedCode}
            timeLeft={form.timeLeft}
            setTimeLeft={form.setTimeLeft}
            timerRef={form.timerRef}
            verificationError={form.verificationError}
            setVerificationError={form.setVerificationError}
            company={form.company}
            setCompany={form.setCompany}
            department={form.department}
            setDepartment={form.setDepartment}
            position={form.position}
            setPosition={form.setPosition}
            termsAgree={form.termsAgree}
            setTermsAgree={form.setTermsAgree}
            privacyAgree={form.privacyAgree}
            setPrivacyAgree={form.setPrivacyAgree}
            marketingAgree={form.marketingAgree}
            setMarketingAgree={form.setMarketingAgree}
            // setOpenModal 제거
            handleRegister={form.handleRegister}
            canRegister={form.canRegister}
            error={form.error}
            emailExists={form.emailExists}         // ★★★ 추가
            setEmailExists={form.setEmailExists}   // ★★★ 추가
            phoneExists={form.phoneExists}
            handleErrorClear={form.handleErrorClear}
            handleEmailCheck={form.handleEmailCheck} // ★이 라인 추가
          />
        )}
        {/* 소셜 회원가입 등 기타 주석은 그대로 두셔도 됩니다 */}
      </div>
      {/* 모바일 하단 소셜/버튼 등 기타 주석도 필요하면 남기세요 */}
    </div>
  );
}
