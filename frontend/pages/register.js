import { useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, UserPlus } from "lucide-react";
import AgreementModal from "@/components/AgreementModal";
import RegisterStep1 from "@/components/register/RegisterStep1";
import RegisterStep2 from "@/components/register/RegisterStep2";
import useRegisterForm from "@/components/register/useRegisterForm";


export default function RegisterPage() {
  const form = useRegisterForm();
  const router = useRouter();
  const {
    step,
    setStep,
    openModal,
    setOpenModal,
    setTermsAgree,
    setPrivacyAgree,
    setMarketingAgree,
  } = form;
  // 쿼리 파라미터에서 step 읽어와서 반영
  useEffect(() => {
    if (!router.isReady) return;
    const qsStep = Number(router.query.step);
    if (qsStep === 1 || qsStep === 2) setStep(qsStep);
  }, [router.isReady, router.query.step, setStep]);

  return (
    <div className="login-root">
      {/* 약관 모달 */}
      <AgreementModal
        openKey="terms"
        title="이용약관 동의"
        content={<p>이용약관 내용</p>}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setTermsAgree={setTermsAgree}
        setPrivacyAgree={setPrivacyAgree}
        setMarketingAgree={setMarketingAgree}
      />
      <AgreementModal
        openKey="privacy"
        title="개인정보 수집 및 이용 동의"
        content={<p>개인정보 수집 및 이용 내용이 여기에 들어갑니다.</p>}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setPrivacyAgree={setPrivacyAgree}
      />
      <AgreementModal
        openKey="marketing"
        title="마케팅 정보 수신 동의"
        content={<p>마케팅 정보 수신에 대한 내용이 여기에 들어갑니다.</p>}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setMarketingAgree={setMarketingAgree}
      />

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
            setOpenModal={form.setOpenModal}
            handleRegister={form.handleRegister}
            canRegister={form.canRegister}
            error={form.error}
            phoneExists={form.phoneExists}
            handleErrorClear={form.handleErrorClear}
          />
        )}
        {/* 소셜 회원가입이 있다면 아래처럼 추가 */}
        {/* <div className="login-social-box desktop-only">
          <div className="social-label">소셜 계정으로 회원가입</div>
          <SocialLoginButtons />
        </div> */}
      </div>

      {/* 모바일 하단 소셜/버튼은 Step1/Step2 내부에서 구현하거나 필요시 아래처럼 추가 */}
      {/* <div className="login-bottom-bar mobile-only">
        <div className="login-social-box">
          <div className="social-label">소셜 계정으로 회원가입</div>
          <SocialLoginButtons />
        </div>
        <button
          type="submit"
          className="login-btn"
          form="register-step1-form" // 또는 "register-step2-form"
        >
          {step === 1 ? "다음" : "가입하기"}
        </button>
      </div> */}
    </div>
  );
}
