import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import RegisterStep2 from "components/register/RegisterStep2";
import { jwtDecode } from "jwt-decode";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function SocialRegisterPage() {
  const router = useRouter();
  const { token } = router.query;
  const [socialProvider, setSocialProvider] = useState("");
  const [nameEditable, setNameEditable] = useState(true);
  const { showAlert } = useGlobalAlert(); // ✅ 추가
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
  const [isVerified, setIsVerified] = useState(false);

  function normalizePhone(phone) {
    if (!phone) return "";
    let num = phone.replace(/\D/g, "");
    if (phone.startsWith("+82")) {
      if (num.startsWith("82")) num = "0" + num.slice(2);
    }
    return num.slice(0, 11);
  }

  useEffect(() => {
    if (!token) return;
    try {
      const payload = jwtDecode(token);
      if (!payload.email || !payload.name) {
        showAlert(
          "소셜 계정에서 필요한 정보를 모두 받아오지 못했습니다.\n플랫폼에서 이름, 이메일 제공에 동의해 주세요."
        );
        return;
      }
      setSocialProvider(payload.socialProvider || "");
      setForm((prev) => ({
        ...prev,
        username: payload.name,
        phone: normalizePhone(payload.phone),
        email: payload.email,
      }));
      setNameEditable(!payload.name || payload.name.trim() === "");
    } catch (e) {
      showAlert("[social] 인증정보 해석 실패: " + e.message);
    }
  }, [token, router]);

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

      if (res.status === 409) {
        let msg = "";
        // provider: "local" | "kakao" | "naver" | "google"
        let providerText = "";
        if (data.provider === "kakao") providerText = "카카오";
        else if (data.provider === "naver") providerText = "네이버";
        else if (data.provider === "google") providerText = "구글";
        else providerText = ""; // 일반

        if (data.errorType === "email") {
          if (providerText) {
            msg = `이미 ${providerText} 계정으로 가입된 이메일입니다.\n${providerText} 로그인을 이용해 주세요.`;
          } else {
            msg =
              "이미 일반 회원으로 가입된 이메일입니다.\n일반 로그인을 이용해 주세요.";
          }
        } else if (data.errorType === "phone") {
          if (providerText) {
            msg = `이미 ${providerText} 계정으로 가입된 휴대폰번호입니다.\n${providerText} 로그인을 이용해 주세요.`;
          } else {
            msg =
              "이미 일반 회원으로 가입된 휴대폰번호입니다.\n일반 로그인을 이용해 주세요.";
          }
        } else {
          msg =
            "이미 가입된 정보입니다. 로그인 또는 다른 소셜 로그인을 이용해 주세요.";
        }
        showAlert(msg);
        router.replace("/login");
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || "서버 오류");
      showAlert(
        `안녕하세요, ${form.username}님.\n회원가입이 완료되었습니다.\n감사합니다.`
      );

      setSuccess(true);
      router.replace("/login?success=social");
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  const canRegister =
    !!form.username.trim() &&
    !!form.phone.trim() &&
    isVerified &&
    form.terms_agree &&
    form.privacy_agree;

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
              <path
                d="M15 18l-6-6 6-6"
                stroke="#666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
          socialProvider={socialProvider}
          email={form.email}
          setEmail={(val) => setForm((f) => ({ ...f, email: val }))}
          username={form.username}
          setUsername={(val) => setForm((f) => ({ ...f, username: val }))}
          phone={form.phone}
          setPhone={(val) => setForm((f) => ({ ...f, phone: val }))}
          formatPhone={(v) =>
            (v || "").replace(
              /(\d{3})(\d{3,4})?(\d{4})?/,
              function (_, a, b, c) {
                return b && c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a;
              }
            )
          }
          isVerified={isVerified}
          setIsVerified={setIsVerified}
          verificationCode={form.verificationCode}
          setVerificationCode={(val) =>
            setForm((f) => ({ ...f, verificationCode: val }))
          }
          showVerificationInput={form.showVerificationInput}
          setShowVerificationInput={(val) =>
            setForm((f) => ({ ...f, showVerificationInput: val }))
          }
          hasRequestedCode={form.hasRequestedCode}
          setHasRequestedCode={(val) =>
            setForm((f) => ({ ...f, hasRequestedCode: val }))
          }
          timeLeft={form.timeLeft}
          setTimeLeft={(val) => setForm((f) => ({ ...f, timeLeft: val }))}
          timerRef={{ current: null }}
          verificationError={form.verificationError}
          setVerificationError={(val) =>
            setForm((f) => ({ ...f, verificationError: val }))
          }
          company={form.company}
          setCompany={(val) => setForm((f) => ({ ...f, company: val }))}
          department={form.department}
          setDepartment={(val) => setForm((f) => ({ ...f, department: val }))}
          position={form.position}
          setPosition={(val) => setForm((f) => ({ ...f, position: val }))}
          termsAgree={form.terms_agree}
          setTermsAgree={(val) => setForm((f) => ({ ...f, terms_agree: val }))}
          privacyAgree={form.privacy_agree}
          setPrivacyAgree={(val) =>
            setForm((f) => ({ ...f, privacy_agree: val }))
          }
          marketingAgree={form.marketing_agree}
          setMarketingAgree={(val) =>
            setForm((f) => ({ ...f, marketing_agree: val }))
          }
          setOpenModal={() => {}}
          handleRegister={handleSubmit}
          canRegister={canRegister}
          error={error}
          nameEditable={nameEditable}
        />
      </div>
    </div>
  );
}
