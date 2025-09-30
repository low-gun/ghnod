// /frontend/components/inquiry/InquiryModal.jsx
import { useState, useEffect } from "react";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // ✅ 추가
import api from "@/lib/api";
import { useUserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";

/**
 * mode: "general" | "product" | "mypage"
 * - general: 기업명/부서/직책 포함, 비회원 전역 문의
 * - product: 상품 문의 (회원/비회원 모두), 비공개 여부 포함
 * - mypage : 마이페이지 1:1 문의 (회원 전용)
 */
export default function InquiryModal({
  mode = "general",
  productId = null,
  initialData = null,
  onClose,
  onSubmitSuccess,
}) {
  const { user } = useUserContext();
  const { showAlert } = useGlobalAlert();
  const isMobile = useIsMobile(); // ✅ 추가
  // 에러 상태 + 폼 유효 여부
const [errors, setErrors] = useState({});
const [isValid, setIsValid] = useState(false);
const [touched, setTouched] = useState({});


  // 공통 필드
  const [title, setTitle] = useState(initialData?.title || "");
  const [message, setMessage] = useState(initialData?.message || "");
  const [loading, setLoading] = useState(false);

  // 전역문의용/게스트 필드
  const [guestCompany, setGuestCompany] = useState("");
  const [guestDepartment, setGuestDepartment] = useState("");
  const [guestPosition, setGuestPosition] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 게스트 공통 필드
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // 상품 문의 전용
  const [isPrivate, setIsPrivate] = useState(
    initialData?.is_private === 0 ? false : true
  );

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = "제목을 입력하세요.";
    if (!message.trim()) newErrors.message = "내용을 입력하세요.";

    if (!user?.id && (mode === "general" || mode === "product")) {
      if (!guestCompany.trim()) newErrors.company = "기업명은 필수입니다.";
      if (!guestName.trim()) newErrors.name = "이름은 필수입니다.";
      if (!guestEmail.trim()) {
        newErrors.email = "이메일은 필수입니다.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        newErrors.email = "이메일 형식이 올바르지 않습니다.";
      }
      if (!guestPhone.trim()) {
        newErrors.phone = "연락처는 필수입니다.";
      } else if (guestPhone.replace(/\D/g, "").length !== 11) {
        newErrors.phone = "연락처는 숫자 11자리여야 합니다.";
      }     
      
      if (!agreePrivacy) {
        newErrors.privacy = "개인정보 취급방침에 동의해야 제출할 수 있습니다.";
      }
    }

    setErrors(newErrors);

// 필수 필드가 채워져 있고, 에러가 없는 경우만 true
const requiredFilled = Boolean(
  title.trim() &&
  message.trim() &&
  (user?.id || (guestCompany.trim() && guestName.trim() && guestEmail.trim() && guestPhone.trim() && agreePrivacy))
);

const valid = Object.keys(newErrors).length === 0 && requiredFilled;

// ✅ 상태 로그 추가
console.log("validate()", {
  title,
  message,
  guestCompany,
  guestName,
  guestEmail,
  guestPhone,
  agreePrivacy,
  errors: newErrors,
  requiredFilled,
  valid,
});

setIsValid(valid);
return valid;
  };

  // ESC 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 초기/실시간 유효성 반영 (수정 모드 포함)
  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    message,
    guestCompany,
    guestDepartment,
    guestPosition,
    guestName,
    guestEmail,
    guestPhone,
    agreePrivacy,
    mode,
    user?.id,
  ]);

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      user_id: user?.id ?? null,
      title: title.trim(),
      message: message.trim(),
      is_private: mode === "product" ? (isPrivate ? 1 : 0) : null,
      guest_name: !user?.id ? guestName.trim() : null,
      guest_email: !user?.id ? guestEmail.trim() : null,
      guest_phone: !user?.id ? guestPhone.trim() : null,
      company_name: !user?.id ? guestCompany.trim() : null,
      department: !user?.id ? guestDepartment.trim() || null : null,
      position: !user?.id ? guestPosition.trim() || null : null,
      agree_privacy:
        !user?.id && (mode === "general" || mode === "product") ? 1 : null,
    };

    try {
      setLoading(true);
      let res;
      if (initialData?.id) {
        const endpoint =
          mode === "product"
            ? `/products/${productId}/inquiries/${initialData.id}`
            : mode === "mypage"
            ? `/mypage/inquiries/${initialData.id}`
            : `/inquiries/${initialData.id}`;
        res = await api.put(endpoint, payload);
      } else {
        const endpoint =
          mode === "product"
            ? `/products/${productId}/inquiries`
            : mode === "mypage"
            ? `/mypage/inquiries`
            : `/inquiries`;
        res = await api.post(endpoint, payload);
      }

      if (res.data?.success) {
        console.log("[InquiryModal] calling showAlert: success");
        showAlert("문의가 등록되었습니다.");
        onSubmitSuccess?.();
        onClose?.();
      } else {
        console.log("[InquiryModal] calling showAlert: fail", res.data);
        showAlert(res.data?.message || "문의 등록 실패");
      }
      
    } catch (err) {
      console.error("❌ 문의 등록 오류:", err.response?.data || err);
      showAlert(
        err.response?.data?.message || "오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 2001,
      display: "flex",
      justifyContent: "center",
      alignItems: isMobile ? "flex-end" : "center", // ✅ 모바일: 아래 정렬
      padding: isMobile ? 0 : 12,                   // ✅ 모바일: 패딩 제거
    }}
    aria-modal="true"
    role="dialog"
  >
  
  <div
  style={{
    width: "100%",
    maxWidth: isMobile ? "100%" : 520,                // ✅ 모바일: 전체 너비
    background: "#fff",
    borderRadius: isMobile ? "16px 16px 0 0" : 10,    // ✅ 모바일: 위쪽만 둥글게
    boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
    padding: 20,
  }}
>

        {/* 제목 + 닫기 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            {mode === "general"
              ? "문의하기"
              : mode === "product"
              ? initialData?.id
                ? "문의하기"
                : "문의하기"
              : "1:1 문의하기"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#666",
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 기업명/부서명: general + product 비회원 공통 */}
        {!user?.id && (mode === "general" || mode === "product") && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field
              label={
                <>
                  기업명<span style={{ color: "red" }}>*</span>
                </>
              }
            >
             <Input
  value={guestCompany}
  onChange={(val) => setGuestCompany(val)}
  onBlur={() => setTouched((t) => ({ ...t, company: true }))}
  placeholder="예) 오알피컨설팅"
/>
{touched.company && errors.company && (
  <p style={{ color: "red", fontSize: 12 }}>{errors.company}</p>
)}
            </Field>

            <Field label="부서명">
            <Input
  value={guestDepartment}
  onChange={(val) => setGuestDepartment(val)}
  placeholder="예) 인사팀"
/>
            </Field>
          </div>
        )}

        {/* 이름/직급 */}
        {!user?.id && (mode === "general" || mode === "product") && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field
              label={
                <>
                  이름<span style={{ color: "red" }}>*</span>
                </>
              }
            >
              <Input
  value={guestName}
  onChange={(val) => setGuestName(val)}
  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
  placeholder="예) 홍길동"
/>
{touched.name && errors.name && (
  <p style={{ color: "red", fontSize: 12 }}>{errors.name}</p>
)}
            </Field>

            <Field label="직급">
            <Input
  value={guestPosition}
  onChange={(val) => setGuestPosition(val)}
  placeholder="예) 대리"
/>
     </Field>
          </div>
        )}

        {/* 이메일/연락처 */}
        {!user?.id && (mode === "general" || mode === "product") && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field
              label={
                <>
                  이메일<span style={{ color: "red" }}>*</span>
                </>
              }
            >
              <Input
  type="email"
  value={guestEmail}
  onChange={(val) => setGuestEmail(val)}
  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
  placeholder="예) name@example.com"
/>
{touched.email && errors.email && (
  <p style={{ color: "red", fontSize: 12 }}>{errors.email}</p>
)}
            </Field>

            <Field
              label={
                <>
                  연락처<span style={{ color: "red" }}>*</span>
                </>
              }
            >
            <Input
  value={guestPhone}
  onChange={(val) => {
    const onlyNumbers = val.replace(/\D/g, "").slice(0, 11); // ✅ 11자리 제한
    setGuestPhone(onlyNumbers);
  }}
  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
  placeholder="예) 01012345678"
/>
{touched.phone && errors.phone && (
  <p style={{ color: "red", fontSize: 12 }}>{errors.phone}</p>
)}
            </Field>
          </div>
        )}

        {/* 개인정보 동의 (general + product 비회원) */}
        {!user?.id && (mode === "general" || mode === "product") && (
          <div style={{ margin: "10px 0 6px 0" }}>
            <label
              style={{
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
  type="checkbox"
  checked={agreePrivacy}
  onChange={(e) => setAgreePrivacy(e.target.checked)}
  onBlur={() => setTouched((t) => ({ ...t, privacy: true }))}
/>
              개인정보 취급방침에 동의합니다
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#2563eb",
                  textDecoration: "underline",
                  fontSize: 13,
                }}
              >
                보기
              </a>
            </label>
            {touched.privacy && errors.privacy && (
  <p style={{ color: "red", fontSize: 12, marginTop: 4 }}>
    {errors.privacy}
  </p>
)}
          </div>
        )}

        {/* 제목 */}
        <Field label="제목">
  <Input
    value={title}
    onChange={(val) => setTitle(val)}
    onBlur={() => setTouched((t) => ({ ...t, title: true }))}
    placeholder="제목을 입력하세요"
  />
  {touched.title && errors.title && (
    <p style={{ color: "red", fontSize: 12 }}>{errors.title}</p>
  )}
</Field>

        {/* 내용 */}
        <Field label="내용">
        <textarea
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            rows={5}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              outline: "none",
              resize: "vertical",
              fontSize: 14,
            }}
            placeholder="문의하실 내용을 자세히 남겨주세요."
          />
         {touched.message && errors.message && (
  <p style={{ color: "red", fontSize: 12 }}>{errors.message}</p>
)}
        </Field>

        {/* product 모드: 비공개 여부 */}
        {mode === "product" && (
          <div style={{ margin: "10px 0" }}>
            <label style={{ fontSize: 14 }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              비공개 문의
            </label>
          </div>
        )}

        {/* 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 6,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={btnGhost}
          >
            취소
          </button>
          {/* ✅ 버튼 disabled 상태 로그 */}
{console.log("button disabled? =>", loading || !isValid, "isValid:", isValid, "loading:", loading)}

<button
  type="button"
  onClick={handleSubmit}
  disabled={loading || !isValid}
  style={loading || !isValid ? btnPrimaryDisabled : btnPrimary}
>
  {loading ? "제출 중..." : "제출"}
</button>


        </div>
      </div>
    </div>
  );
}

/* 공용 컴포넌트 */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 14,
          marginBottom: 4,
          color: "#374151",
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, onBlur, type = "text", placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}                        // ✅ onBlur 전달
      placeholder={placeholder}
      autoComplete="off"
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        outline: "none",
        fontSize: 14,
      }}
    />
  );
}

/* 스타일 */
const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const btnPrimaryDisabled = {
  ...btnPrimary,
  background: "#9ca3af", // 비활성화 시 회색
  cursor: "not-allowed",
  opacity: 0.6,
};
const btnGhost = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 14,
};
