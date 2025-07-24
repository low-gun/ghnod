import { ChevronLeft, UserPlus } from "lucide-react";
import AgreementModal from "@/components/AgreementModal";
import RegisterStep1 from "@/components/register/RegisterStep1";
import RegisterStep2 from "@/components/register/RegisterStep2";
import useRegisterForm from "@/components/register/useRegisterForm";

export default function RegisterPage() {
  const form = useRegisterForm();
  const {
    step, setStep, openModal, setOpenModal,
    setTermsAgree, setPrivacyAgree, setMarketingAgree
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

      <div className="register-root">
        <div className="register-card">
          <div className="register-title-bar">
            <button
              type="button"
              className="register-back-btn"
              onClick={() => (form.step === 1 ? history.back() : setStep(1))}
              aria-label="뒤로가기"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="register-title-wrap">
              <UserPlus size={30} color="#3577f1" style={{marginBottom: 2}} />
              <h1 className="register-title">회원가입</h1>
              <p className="register-step-txt">
                {form.step === 1 ? "계정정보" : "개인정보"}
              </p>
            </div>
          </div>
          <div className="register-contents">
            {form.step === 1 ? (
              <RegisterStep1 {...form} />
            ) : (
              <RegisterStep2 {...form} />
            )}
          </div>
        </div>
        <style jsx>{`
          .register-root {
            min-height: 100vh;
            background: #f8faff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .register-card {
            width: 100%;
            max-width: 410px;
            background: #fff;
            border-radius: 26px;
            box-shadow: 0 8px 40px 0 rgba(48,100,220,0.12);
            padding: 46px 32px 36px 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            animation: fadeup .34s cubic-bezier(.22,.68,.64,1.12);
          }
          .register-title-bar {
            width: 100%;
            position: relative;
            margin-bottom: 19px;
          }
          .register-back-btn {
            background: none;
            border: none;
            position: absolute;
            left: -6px;
            top: 3px;
            color: #3577f1;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            padding: 3px 7px;
            border-radius: 7px;
            transition: background 0.14s;
          }
          .register-back-btn:hover {
            background: #eef5ff;
          }
          .register-title-wrap {
            text-align: center;
          }
          .register-title {
            font-size: 22px;
            font-weight: 800;
            color: #27354c;
            margin: 0 0 0 0;
            letter-spacing: -1px;
          }
          .register-step-txt {
            font-size: 14.5px;
            color: #959fb4;
            margin: 7px 0 0 0;
            font-weight: 500;
          }
          .register-contents {
            width: 100%;
            margin-top: 4px;
          }
          @keyframes fadeup {
            from { opacity: 0; transform: translateY(48px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @media (max-width: 500px) {
  .register-root {
    padding: 0;
    min-height: 100vh;
    background: #f8faff;
  }
  .register-card {
    max-width: 100vw;
    background: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0 7vw 0 7vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .register-title-bar {
    margin-bottom: 16px;
  }
  .register-title {
    font-size: 18.5px;
  }
  .register-step-txt {
    font-size: 13px;
    margin: 5px 0 0 0;
  }
  .register-contents {
    margin-top: 0;
  }
}

        `}</style>
      </div>
    </>
  );
}
