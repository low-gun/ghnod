import React, { useState } from "react";
import api from "@/lib/api";
import ChangePasswordModal from "./ChangePasswordModal";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert"; 
import { useGlobalConfirm } from "@/stores/globalConfirm"; 

export default function MyInfo({ data }) {
  if (!data || data.length === 0) return <></>;

  const {
    name: initialUsername,
    email,
    phone: initialPhone,
    company: initialCompany = "",
    department: initialDepartment = "",
    position: initialPosition = "",
    marketing_agree: initialMarketingAgree = 0,
  } = data[0];

  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [company, setCompany] = useState(initialCompany);
  const [department, setDepartment] = useState(initialDepartment);
  const [position, setPosition] = useState(initialPosition);
  const [marketingAgree, setMarketingAgree] = useState(initialMarketingAgree === 1);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawHover, setWithdrawHover] = useState(false); // 🔹 호버 상태
  const isMobile = useIsMobile();
  const { showAlert } = useGlobalAlert(); 
  const { showConfirm } = useGlobalConfirm(); 

  const containerStyle = {
    padding: isMobile ? "0 4px" : "0 20px",
    maxWidth: 900,
    margin: "0 0",
  };
  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: isMobile ? "12px 8px 24px 8px" : "28px 32px 36px 32px",
    boxShadow: isMobile ? "none" : "0 2px 10px rgba(0,0,0,0.06)",
    maxWidth: "900px",
    marginBottom: isMobile ? "10px" : "20px",
    marginTop: isMobile ? "10px" : "28px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? "10px" : "22px",
  };

  const cardTitleStyle = {
    fontSize: isMobile ? "1.08rem" : "1.13rem",
    fontWeight: 600,
    color: "#232323",
    letterSpacing: "0.02em",
  };

  const infoGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    rowGap: isMobile ? "10px" : "18px",
    columnGap: isMobile ? "0px" : "32px",
    width: "100%",
  };

  const buttonRow = {
    marginTop: isMobile ? "18px" : "28px",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "8px" : "12px",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  };

  const editButton = {
    flex: 1,
    width: isMobile ? "100%" : "180px",
    minWidth: isMobile ? "unset" : "140px",
    padding: isMobile ? "14px 0" : "12px 0",
    fontSize: "1rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.14s",
  };

  const saveButton = {
    ...editButton,
    backgroundColor: "#2196F3",
  };

  const cancelButton = {
    ...editButton,
    backgroundColor: "#f3f4f6",
    color: "#333",
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.patch("/mypage/info", {
        username,
        phone,
        company,
        department,
        position,
        marketing_agree: marketingAgree ? 1 : 0,
      });
      showAlert("정보가 수정되었습니다.");
      setEditing(false);
    } catch (err) {
      console.error("❌ 수정 실패", err);
      showAlert("정보 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => setShowPasswordModal(true);

  const handleWithdraw = async () => {
    const ok = await showConfirm(
      "정말 탈퇴하시겠습니까?\n탈퇴 후에는 복구할 수 없습니다."
    );
    if (!ok) return;
    try {
      await api.delete("/mypage/delete-account");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      showAlert("탈퇴가 완료되었습니다. 메인 페이지로 이동합니다.");
      window.location.href = "/";
    } catch (err) {
      console.error("❌ 탈퇴 실패:", err);
      showAlert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  // ───────────── render ─────────────
  return (
    <div style={containerStyle}>
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          marginTop: "20px",
          marginBottom: "8px",
          color: "#2c2c2c",
          letterSpacing: "0.02em",
        }}
      >
        내 정보
      </h2>

      {/* 기본정보 카드 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={cardTitleStyle}>기본정보</div>
          <span
            onClick={handleWithdraw}
            onMouseEnter={() => setWithdrawHover(true)}
            onMouseLeave={() => setWithdrawHover(false)}
            style={{
              color: "#d92d20",
              fontSize: "0.85rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: withdrawHover ? "rgba(217,45,32,0.08)" : "transparent",
              transition: "background 0.15s",
            }}
          >
            회원 탈퇴
          </span>
        </div>

        <div style={infoGrid}>
          <InfoField
            label="이름"
            value={username}
            editing={editing}
            onChange={setUsername}
          />
          <InfoField
            label="연락처"
            value={phone}
            editing={editing}
            onChange={setPhone}
          />
          <div style={infoItem}>
            <span style={infoLabel}>이메일</span>
            <span style={infoValue}>{email}</span>
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>비밀번호</span>
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <button style={miniButton} onClick={handlePasswordChange}>
                변경
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 추가정보 카드 */}
      <div style={{ ...cardStyle, marginTop: isMobile ? "10px" : "24px" }}>
        <div style={cardTitleStyle}>추가정보</div>
        <div style={{ ...infoGrid, marginTop: isMobile ? "0" : "8px" }}>
          <InfoField
            label="소속"
            value={company}
            editing={editing}
            onChange={setCompany}
          />
          <InfoField
            label="부서"
            value={department}
            editing={editing}
            onChange={setDepartment}
          />
          <InfoField
            label="직책"
            value={position}
            editing={editing}
            onChange={setPosition}
          />
          <div style={infoItem}>
            <span style={infoLabel}>마케팅 수신 동의</span>
            {editing ? (
              <div>
                <label style={{ marginRight: "12px" }}>
                  <input
                    type="radio"
                    value="1"
                    checked={marketingAgree}
                    onChange={() => setMarketingAgree(true)}
                  />{" "}
                  동의함
                </label>
                <label>
                  <input
                    type="radio"
                    value="0"
                    checked={!marketingAgree}
                    onChange={() => setMarketingAgree(false)}
                  />{" "}
                  동의 안 함
                </label>
              </div>
            ) : (
              <span style={infoValue}>
                {marketingAgree ? "동의함" : "동의 안 함"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={buttonRow}>
        {editing ? (
          <>
            <button onClick={handleSave} style={saveButton} disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </button>
            <button onClick={() => setEditing(false)} style={cancelButton}>
              취소
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={editButton}>
            수정하기
          </button>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 재사용 필드 컴포넌트
function InfoField({ label, value, editing, onChange }) {
  return (
    <div style={infoItem}>
      <span style={infoLabel}>{label}</span>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      ) : (
        <span style={infoValue}>{value || "-"}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 스타일
const infoItem = {
  display: "flex",
  flexDirection: "column",
};

const infoLabel = {
  fontSize: "0.85rem",
  color: "#888",
  marginBottom: "4px",
};

const infoValue = {
  fontSize: "1rem",
  color: "#222",
  fontWeight: "500",
};

const inputStyle = {
  padding: "7px",
  fontSize: "0.98rem",
  borderRadius: "5px",
  border: "1px solid #ccc",
  background: "#f9f9f9",
};

const miniButton = {
  fontSize: "0.78rem",
  padding: "4px 10px",
  borderRadius: "4px",
  backgroundColor: "#f1f1f1",
  border: "none",
  cursor: "pointer",
  color: "#333",
  fontWeight: 500,
};