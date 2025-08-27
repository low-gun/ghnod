import { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import api, { setAccessToken } from "@/lib/api";
import { getClientSessionId } from "@/lib/session";
import { UserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function useRegisterForm() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false); // ★추가
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  const router = useRouter();
  const { login } = useContext(UserContext);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setShowVerificationInput(false);
      setVerificationCode("");
      setVerificationError("");
      setIsVerified(false);
      setHasRequestedCode(false);
      // ❌ 약관 동의는 사용자가 체크한 상태를 유지해야 하므로 초기화하지 않음
    };
  }, []);
  

  useEffect(() => {
    if (timeLeft === 0 && !isVerified) {
      setShowVerificationInput(false);
    }
  }, [timeLeft, isVerified]);
  useEffect(() => {
    if (phone.length === 10 || phone.length === 11) {
      checkPhoneDuplicate(phone);
    } else {
      setPhoneExists(false); // 자리수 미달시 중복 상태 초기화
    }
    // eslint-disable-next-line
  }, [phone]);
  const formatPhone = (num) => {
    if (!num) return "";
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7)
      return cleaned.slice(0, 3) + "-" + cleaned.slice(3);
    return (
      cleaned.slice(0, 3) +
      "-" +
      cleaned.slice(3, 7) +
      "-" +
      cleaned.slice(7, 11)
    );
  };

  const checkPhoneDuplicate = async (value) => {
    try {
      const res = await api.post("/auth/check-phone", { phone: value });
      setPhoneExists(res.data.exists);
      // 여기서는 setError 사용하지 않음
    } catch {
      showAlert("휴대폰 확인 실패");
    }
  };

  const handleEmailCheck = async () => {
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailExists(false); // ★추가: 잘못된 형식은 중복 아님
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    try {
      const res = await api.post("/auth/check-email", { email });
      setEmailExists(res.data.exists); // ★이 줄 추가
      setError(""); // ★에러 직접 표시 안함
    } catch {
      setEmailExists(false);
      setError("이메일 확인 실패");
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    try {
      const res = await api.post("/auth/check-email", { email });
      if (res.data.exists) {
        setError("이미 가입된 이메일입니다.");
        return;
      }
      setStep(2);
    } catch {
      setError("이메일 확인 중 오류가 발생했습니다.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !phone) {
      showAlert("이름과 휴대폰번호는 필수 입력 항목입니다.");
      setError("");
      return;
    }
    if (phoneExists) {
      showAlert("이미 가입된 휴대폰번호입니다.");
      setError("");
      return;
    }
    if (!termsAgree || !privacyAgree) {
      showAlert("필수 약관에 모두 동의해야 합니다.");
      setError("");
      return;
    }
    try {
      await api.post("/auth/register", {
        email,
        username,
        password,
        phone,
        company,
        department,
        position,
        marketing_agree: marketingAgree ? 1 : 0,
        terms_agree: termsAgree ? 1 : 0,
        privacy_agree: privacyAgree ? 1 : 0,
      });
      showAlert("회원가입이 완료되었습니다!\n이전 페이지로 이동합니다.");

      const clientSessionId = getClientSessionId();
      const loginRes = await api.post("/auth/login", {
        email,
        password,
        clientSessionId,
      });
      const data = loginRes.data;
      if (data.success) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.username,
          role: data.user.role,
        };
        setAccessToken(data.accessToken);
        login(userData, data.accessToken, data.cartItems || []);
        localStorage.removeItem("guest_token");
        delete api.defaults.headers.common["x-guest-token"];
        const prevUrl = document.referrer;
        if (prevUrl.includes("/login")) {
          router.replace("/");
        } else {
          router.back();
        }
      }
      // else 블록(로그인 실패)은 삭제
    } catch (err) {
      // 409 등 백엔드 메시지 그대로 사용
      let msg = "회원가입 또는 로그인 실패";
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      }
      showAlert(msg);
      setError("");
    }
  };

  const canGoNext =
    email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6 &&
    password === passwordConfirm;

  const canRegister =
    username &&
    phone.length >= 10 &&
    isVerified &&
    termsAgree &&
    privacyAgree &&
    !emailExists && // ★이메일 중복 추가
    !phoneExists;

  const handleErrorClear = () => {
    if (error && error.includes("휴대폰")) setError("");
  };

  return {
    step,
    setStep,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    username,
    setUsername,
    phone,
    setPhone,
    phoneExists,
    setPhoneExists,
    emailExists, // ★추가
    setEmailExists, // ★추가
    company,
    setCompany,
    department,
    setDepartment,
    position,
    setPosition,
    marketingAgree,
    setMarketingAgree,
    termsAgree,
    setTermsAgree,
    privacyAgree,
    setPrivacyAgree,
    error,
    setError,
    passwordError,
    setPasswordError,
    passwordConfirmError,
    setPasswordConfirmError,
    showPassword,
    setShowPassword,
    showPasswordConfirm,
    setShowPasswordConfirm,
    openModal,
    setOpenModal,
    showVerificationInput,
    setShowVerificationInput,
    verificationCode,
    setVerificationCode,
    timeLeft,
    setTimeLeft,
    timerRef,
    isVerified,
    setIsVerified,
    verificationError,
    setVerificationError,
    hasRequestedCode,
    setHasRequestedCode,
    formatPhone,
    checkPhoneDuplicate,
    handleNext,
    handleRegister,
    handleEmailCheck,
    canGoNext,
    canRegister,
    handleErrorClear,
  };
}
