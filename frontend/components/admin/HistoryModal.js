import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function HistoryModal({ userId, onClose }) {
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api
      .get(
        `/admin/users/${userId}/history?page=${currentPage}&limit=${itemsPerPage}`
      )
      .then((res) => {
        setHistory(res.data.history);
        setTotal(res.data.total);
      })
      .catch((err) => {
        console.error("❌ 이력 불러오기 실패:", err);
      });
  }, [userId, currentPage]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "20px", fontSize: "20px" }}>
          🕒 사용자 수정 이력
        </h3>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={th}>수정일시</th>
              <th style={th}>항목</th>
              <th style={th}>변경 전</th>
              <th style={th}>변경 후</th>
              <th style={th}>수정자</th>
              <th style={th}>권한</th>
              <th style={th}>위치</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item) => (
                <tr key={item.id}>
                  <td style={td}>
                    {new Date(item.changed_at).toLocaleString("ko-KR")}
                  </td>
                  <td style={td}>{item.field}</td>
                  <td style={td}>{item.old_value}</td>
                  <td style={td}>{item.new_value}</td>
                  <td style={td}>{item.modifier_email ?? "-"}</td>
                  <td style={td}>{item.modifier_role ?? "-"}</td>
                  <td style={td}>{item.origin ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  수정 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={paginationStyle}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            style={navBtn}
          >
            ◀ 이전
          </button>
          <span>
            {currentPage} / {totalPages || 1}
          </span>
          <button
            disabled={history.length < itemsPerPage}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={navBtn}
          >
            다음 ▶
          </button>
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button onClick={onClose} style={closeBtn}>
            닫기
          </button>
        </div>
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
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "10px",
  width: "900px",
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const headerRowStyle = {
  backgroundColor: "#f1f1f1",
};

const th = {
  padding: "10px",
  border: "1px solid #ccc",
  fontWeight: "bold",
  textAlign: "center",
};

const td = {
  padding: "8px",
  border: "1px solid #ddd",
  textAlign: "center",
  wordBreak: "break-word",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  marginTop: "20px",
};

const navBtn = {
  padding: "6px 16px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
};

const closeBtn = {
  padding: "8px 20px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};
