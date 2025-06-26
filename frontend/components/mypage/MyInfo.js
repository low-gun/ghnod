import React, { useState } from "react";
import api from "@/lib/api";
import ChangePasswordModal from "./ChangePasswordModal";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

export default function MyInfo({ data }) {
  if (!data || data.length === 0) return <></>; // 데이터 없는 경우만

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
  const [marketingAgree, setMarketingAgree] = useState(
    initialMarketingAgree === 1
  );
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const containerStyle = {
    padding: isMobile ? 0 : 20,
  };
  const buttonRow = {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
  };

  const editButton = {
    flex: 1,
    padding: "12px 0",
    fontSize: "1rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    maxWidth: "160px",
  };

  const saveButton = {
    ...editButton,
    backgroundColor: "#2196F3",
  };

  const cancelButton = {
    ...editButton,
    backgroundColor: "#ccc",
    color: "#333",
  };

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: isMobile ? "16px" : "24px",
    boxShadow: isMobile ? "none" : "0 2px 10px rgba(0,0,0,0.06)",
    maxWidth: "900px",
    position: "relative",
    marginBottom: isMobile ? "16px" : "24px",
  };

  const infoGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    rowGap: "16px",
    columnGap: isMobile ? "0px" : "32px",
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
      alert("정보가 수정되었습니다.");
      setEditing(false);
    } catch (err) {
      console.error("❌ 수정 실패", err);
      alert("정보 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => setShowPasswordModal(true);

  const handleWithdraw = async () => {
    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까? 탈퇴 후에는 복구할 수 없습니다."
    );
    if (!confirmed) return;
    try {
      await api.delete("/mypage/delete-account");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      alert("탈퇴가 완료되었습니다. 메인 페이지로 이동합니다.");
      window.location.href = "/";
    } catch (err) {
      console.error("❌ 탈퇴 실패:", err);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={containerStyle}>
      {!isMobile && <h2 style={titleStyle}>내 정보</h2>}

      {/* ✅ 기본정보 카드 */}
      <div style={cardStyle}>
        {!isMobile && <h3 style={subTitleStyle}>기본정보</h3>}
        <button onClick={handleWithdraw} style={withdrawButton}>
          ✖
        </button>

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
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
              <span style={infoValue}>********</span>
              <button style={miniButton} onClick={handlePasswordChange}>
                변경
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 추가정보 카드 */}
      <div style={{ ...cardStyle, marginTop: isMobile ? "16px" : "24px" }}>
        {!isMobile && <h3 style={subTitleStyle}>추가정보</h3>}

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
const titleStyle = {
  fontSize: "1.4rem",
  fontWeight: "bold",
  marginBottom: "20px",
};

const subTitleStyle = {
  fontSize: "1.1rem",
  fontWeight: "bold",
  marginBottom: "16px",
};

const withdrawButton = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "transparent",
  border: "none",
  fontSize: "1rem",
  color: "#888",
  cursor: "pointer",
};

const infoGrid = {}; // 조건부 스타일은 컴포넌트 내부에서 분기

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
  padding: "6px",
  fontSize: "0.95rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const miniButton = {
  fontSize: "0.75rem",
  padding: "4px 8px",
  borderRadius: "4px",
  backgroundColor: "#ddd",
  border: "none",
  cursor: "pointer",
};

const buttonRow = {
  marginTop: "24px",
  textAlign: "center",
};
