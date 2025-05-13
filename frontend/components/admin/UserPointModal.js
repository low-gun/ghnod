import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function UserPointModal({ user, onClose, onRefresh }) {
  const [pointAmount, setPointAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pointHistory, setPointHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  const handleSubmit = async () => {
    if (!pointAmount) {
      return alert("포인트 금액을 입력해주세요.");
    }

    try {
      await api.post(`/admin/batch-points`, {
        userIds: [user.id], // ✅ 배열 형태로 단일 지급
        amount: Number(pointAmount),
        description: description || "관리자 지급",
      });

      alert("포인트가 지급되었습니다.");
      setPointAmount("");
      setDescription("");
      fetchPointHistory();
      if (onRefresh) {
        onRefresh(); // ✅ UserSummaryTable 데이터 갱신
      }
    } catch (error) {
      console.error("❌ 포인트 지급 실패:", error);
      alert("포인트 지급 중 오류가 발생했습니다.");
    }
  };

  const fetchPointHistory = async () => {
    try {
      const res = await api.get(`/admin/users/${user.id}/points`);
      if (res.data.success) {
        setPointHistory(res.data.points);
      }
    } catch (error) {
      console.error("❌ 포인트 내역 조회 실패:", error);
    }
  };

  useEffect(() => {
    fetchPointHistory();
  }, [user.id]);

  // ✅ ESC 키 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const paginatedHistory = pointHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(pointHistory.length / pageSize);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ✅ X 버튼 추가 */}
        <button onClick={onClose} style={closeButtonStyle} aria-label="닫기">
          ×
        </button>

        <h3 style={{ marginBottom: "16px" }}>💰 포인트 지급</h3>
        <p>
          대상: <strong>{user.username}</strong> ({user.email})
        </p>

        <div style={{ marginTop: "16px" }}>
          <label>포인트 금액</label>
          <input
            type="number"
            placeholder="예: 1000"
            value={pointAmount}
            onChange={(e) => setPointAmount(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginTop: "16px" }}>
          <label>지급 사유</label>
          <input
            type="text"
            placeholder="예: 출석 이벤트 보상"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button onClick={onClose} style={buttonStyleCancel}>
            취소
          </button>
          <button onClick={handleSubmit} style={buttonStyle}>
            지급
          </button>
        </div>

        {/* 📄 포인트 사용/지급 내역 */}
        <h4 style={{ marginTop: "32px" }}>📄 포인트 내역</h4>
        {pointHistory.length === 0 ? (
          <p style={{ marginTop: "8px" }}>포인트 내역이 없습니다.</p>
        ) : (
          <>
            <table
              style={{ width: "100%", marginTop: "8px", fontSize: "14px" }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>구분</th>
                  <th style={thStyle}>금액</th>
                  <th style={thStyle}>사유</th> {/* ✅ 추가 */}
                  <th style={thStyle}>날짜</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((item, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{item.change_type}</td>
                    <td style={tdStyle}>{item.amount}</td>
                    <td style={tdStyle}>{item.description || "-"}</td>{" "}
                    {/* ✅ 추가 */}
                    <td style={tdStyle}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 📄 페이징 */}
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ 이전
              </button>
              <span style={{ margin: "0 8px" }}>
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                다음 ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ✅ 스타일
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  position: "relative",
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "500px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};

const closeButtonStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "transparent",
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "4px",
};

const buttonStyle = {
  padding: "8px 16px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginLeft: "8px",
};

const buttonStyleCancel = {
  ...buttonStyle,
  backgroundColor: "#ccc",
  color: "#000",
};

const thStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const tdStyle = {
  padding: "8px",
  textAlign: "center",
};
