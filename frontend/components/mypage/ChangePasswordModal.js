import React, { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/router";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // 👁️ 아이콘 추가
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 추가

export default function ChangePasswordModal({
  onClose,
  userId,
  isForcedReset = false,
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { showConfirm } = useGlobalConfirm(); // ✅ 전역 confirm 함수 import
  const handleChangePassword = async () => {
    if (
      !newPassword ||
      !confirmPassword ||
      (!isForcedReset && !currentPassword)
    ) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    // ✅ 여기 showConfirm 추가
    const ok = await showConfirm("비밀번호를 변경하시겠습니까?");
    if (!ok) return;

    try {
      const payload = isForcedReset
        ? { newPassword, userId }
        : { currentPassword, newPassword };

      await api.post("/mypage/change-password", payload);

      showAlert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      onClose();
      router.replace("/login");
    } catch (err) {
      console.error("❌ 비밀번호 변경 실패:", err);
      setError(
        err.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다."
      );
    }
  };

  const renderPasswordInput = (
    label,
    value,
    setValue,
    isVisible,
    setVisible
  ) => (
    <div style={inputGroup}>
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, paddingRight: "36px" }}
        />
        <span onClick={() => setVisible(!isVisible)} style={eyeIconStyle}>
          {isVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
        </span>
      </div>
    </div>
  );

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h3 style={{ marginBottom: "16px" }}>
          {isForcedReset ? "비밀번호 재설정" : "비밀번호 변경"}
        </h3>

        {!isForcedReset &&
          renderPasswordInput(
            "현재 비밀번호",
            currentPassword,
            setCurrentPassword,
            showCurrent,
            setShowCurrent
          )}

        {renderPasswordInput(
          "새 비밀번호",
          newPassword,
          setNewPassword,
          showNew,
          setShowNew
        )}

        {renderPasswordInput(
          "새 비밀번호 확인",
          confirmPassword,
          setConfirmPassword
        )}

        {error && <p style={errorStyle}>{error}</p>}

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button onClick={onClose} style={cancelButton}>
            취소
          </button>
          <button onClick={handleChangePassword} style={primaryButton}>
            변경하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─ 스타일 ─
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "360px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};

const inputGroup = {
  marginBottom: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const inputStyle = {
  padding: "8px",
  fontSize: "0.95rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  width: "100%",
};

const eyeIconStyle = {
  position: "absolute",
  top: "50%",
  right: "10px",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "18px",
  color: "#888",
};

const errorStyle = {
  color: "red",
  fontSize: "0.85rem",
  marginTop: "6px",
};

const primaryButton = {
  padding: "8px 16px",
  marginRight: "8px",
  backgroundColor: "#2196F3",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const cancelButton = {
  ...primaryButton,
  backgroundColor: "#ccc",
  color: "#333",
};
