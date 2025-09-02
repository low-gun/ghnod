import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const HistoryModal = dynamic(
  () => import("@/components/admin/HistoryModal"),
  { ssr: false, loading: () => null }
);import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ showAlert용
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 상단 import 추가

export default function UserDetailPageComponent({ user }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    department: "",
    position: "",
    company: "",
    marketing_agree: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { showAlert } = useGlobalAlert(); // ✅
  const { showConfirm } = useGlobalConfirm(); // ✅ 함수 내 선언
  useEffect(() => {
    if (!user || !user.username) return;

    setFormData({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      company: user.company || "",
      department: user.department || "",
      position: user.position || "",
      marketing_agree: !!user.marketing_agree,
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = () => {
    const changedFields = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (user[key] !== value) {
        changedFields[key] = { before: user[key], after: value };
      }
    });

    if (Object.keys(changedFields).length === 0) {
      showAlert("변경된 내용이 없습니다.");
      return;
    }

    api
      .put(`/admin/users/${user.id}`, formData)
      .then(async (res) => {
        if (res.data.success) {
          showAlert("수정이 완료되었습니다.");
          setIsEditing(false);
        } else {
          showAlert("수정에 실패했습니다.");
        }
      })
      .catch(() => showAlert("서버 오류가 발생했습니다."));
  };

  const renderField = (label, name, value) => (
    <label style={labelStyle}>
      {label}
      {isEditing ? (
        <input
          name={name}
          value={value}
          onChange={handleChange}
          style={inputStyle}
        />
      ) : (
        <div style={readOnlyStyle}>{value || "-"}</div>
      )}
    </label>
  );

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        {renderField("이름", "username", formData.username)}
        {renderField("연락처", "phone", formData.phone)}
        {renderField("이메일", "email", formData.email)}
        <label style={labelStyle}>
          비밀번호
          <button
            disabled={!isEditing}
            style={{
              ...inputStyle,
              cursor: isEditing ? "pointer" : "not-allowed",
              textAlign: "center",
              backgroundColor: isEditing ? "#eee" : "#f5f5f5",
            }}
            onClick={async () => {
              if (!isEditing) return;
              const ok = await showConfirm(
                "이 사용자의 비밀번호를 [1234]로 초기화하시겠습니까?"
              );
              if (!ok) return;

              try {
                const res = await api.put(
                  `/admin/users/${user.id}/reset-password`
                );
                if (res.data.success) {
                  showAlert("비밀번호가 [1234]로 초기화되었습니다.");
                } else {
                  showAlert("초기화에 실패했습니다.");
                }
              } catch (error) {
                console.error("❌ 비밀번호 초기화 오류:", error);
                showAlert("비밀번호 초기화 중 오류가 발생했습니다.");
              }
            }}
          >
            초기화
          </button>
        </label>
        {renderField("소속", "company", formData.company)}
        {renderField("부서", "department", formData.department)}
        {renderField("직책", "position", formData.position)}
        <label style={labelStyle}>
          <span style={{ marginBottom: "4px" }}>마케팅 수신 동의</span>
          <div style={readOnlyStyle}>
            {formData.marketing_agree ? "동의" : "미동의"}
          </div>
        </label>
      </div>

      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        {isEditing ? (
          <button
            onClick={async () => {
              const ok = await showConfirm("정말 수정하시겠습니까?");
              if (ok) handleSubmit();
            }}
            style={submitButtonStyle}
          >
            저장
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} style={editButtonStyle}>
            수정
          </button>
        )}

        <button
          onClick={() => setShowHistoryModal(true)}
          style={historyButtonStyle}
        >
          수정이력
        </button>
      </div>

      {showHistoryModal && (
  <HistoryModal
    userId={user.id}
    onClose={() => setShowHistoryModal(false)}
  />
)}
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const readOnlyStyle = {
  padding: "8px",
  fontSize: "14px",
  backgroundColor: "#f9f9f9",
  borderRadius: "4px",
  border: "1px solid #eee",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "14px",
};

const submitButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#4f46e5",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};

const editButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#ccc",
  color: "black",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};

const historyButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#f3f3f3",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};
