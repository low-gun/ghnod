import React, { useState } from "react";
import api from "@/lib/api";
import ChangePasswordModal from "./ChangePasswordModal"; // 비밀번호 변경 모달 import

export default function MyInfo({ data }) {
  if (!data || !data[0]) return <p>로딩 중...</p>;

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

  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

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
      <h2 style={titleStyle}>내 정보</h2>
      <div style={cardStyle}>
        <h3 style={subTitleStyle}>기본정보</h3>
        <button onClick={handleWithdraw} style={withdrawButton}>
          ✖
        </button>

        <div style={infoGrid}>
          <div style={infoItem}>
            <span style={infoLabel}>이름</span>
            {editing ? (
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <span style={infoValue}>{username}</span>
            )}
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>연락처</span>
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <span style={infoValue}>{phone}</span>
            )}
          </div>
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

      <div style={cardStyle}>
        <h3 style={subTitleStyle}>추가정보</h3>
        <div style={infoGrid}>
          <div style={infoItem}>
            <span style={infoLabel}>소속</span>
            {editing ? (
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <span style={infoValue}>{company || "-"}</span>
            )}
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>부서</span>
            {editing ? (
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <span style={infoValue}>{department || "-"}</span>
            )}
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>직책</span>
            {editing ? (
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <span style={infoValue}>{position || "-"}</span>
            )}
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>마케팅 수신 동의</span>
            {editing ? (
              <div>
                <label style={{ marginRight: "12px" }}>
                  <input
                    type="radio"
                    value="1"
                    checked={marketingAgree === true}
                    onChange={() => setMarketingAgree(true)}
                  />{" "}
                  동의함
                </label>
                <label>
                  <input
                    type="radio"
                    value="0"
                    checked={marketingAgree === false}
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

      {/* ✅ 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 스타일
const containerStyle = {
  padding: "20px",
  fontFamily: "sans-serif",
};

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

const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  maxWidth: "900px",
  position: "relative",
  marginBottom: "24px",
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

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  rowGap: "16px",
  columnGap: "32px",
};

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

const editButton = {
  padding: "8px 24px",
  fontSize: "0.9rem",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const saveButton = {
  ...editButton,
  backgroundColor: "#2196F3",
};

const cancelButton = {
  ...editButton,
  backgroundColor: "#ccc",
  color: "#333",
  marginLeft: "8px",
};
