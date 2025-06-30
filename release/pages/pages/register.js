import { ChevronLeft } from "lucide-react";
import AgreementModal from "@/components/AgreementModal";
import RegisterStep1 from "@/components/register/RegisterStep1";
import RegisterStep2 from "@/components/register/RegisterStep2";
import useRegisterForm from "@/components/register/useRegisterForm";

export default function RegisterPage() {
  const form = useRegisterForm();

  const {
    step,
    setStep,
    openModal,
    setOpenModal,
    setTermsAgree,
    setPrivacyAgree,
    setMarketingAgree,
  } = form;

  return (
    <>
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            position: "relative",
          }}
        >
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => (step === 1 ? history.back() : setStep(1))}
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
              <ChevronLeft size={20} />
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
                {step === 1 ? "계정정보" : "개인정보"}
              </p>
            </div>
          </div>

          {step === 1 ? (
            <RegisterStep1 {...form} />
          ) : (
            <RegisterStep2 {...form} />
          )}
        </div>
      </div>
    </>
  );
}
