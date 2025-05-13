import { useState, useEffect } from "react";
import AlertModal from "../common/AlertModal";
import ConfirmModal from "../common/ConfirmModal";
import api from "@/lib/api"; // ✅ axios 인스턴스 추가

export default function UserDetail({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
  });

  const [alertMessage, setAlertMessage] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

      console.log(
        `📢 [프론트엔드 요청] user_id: ${user.id}, page: ${currentPage}`
      );

      api
        .get(`/admin/users/${user.id}/history?page=${currentPage}&limit=5`)
        .then((res) => {
          const data = res.data;
          console.log(
            `📌 [프론트엔드 응답] 페이지: ${currentPage}, 데이터 개수: ${data.history.length}`
          );
          setHistory([...data.history]);
          setTotalPages(Math.ceil(data.total / 5));
        })
        .catch((error) => {
          console.error(
            "❌ [프론트엔드 오류] 이력을 불러오지 못했습니다.",
            error
          );
          setAlertMessage("이력을 불러오지 못했습니다.");
        });
    }
  }, [user, currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActualSubmit = () => {
    api
      .put(`/admin/users/${user.id}`, formData)
      .then((res) => {
        const data = res.data;
        if (data.success) {
          setAlertMessage("수정이 완료되었습니다.");
          setTimeout(() => {
            onUpdate({ ...user, ...formData });
            onClose();
            window.location.reload();
          }, 2000);
        } else {
          setAlertMessage("수정에 실패했습니다.");
        }
      })
      .catch(() => setAlertMessage("서버와 연결할 수 없습니다."));
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, history.length);
  const currentHistory = history.slice(startIndex, endIndex);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "480px",
          height: "700px",
        }}
      >
        <h2
          style={{
            marginBottom: "15px",
            fontSize: "1.25rem",
            fontWeight: "bold",
          }}
        >
          상세보기
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label>사용자명</label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            style={{ padding: "6px", border: "1px solid #ddd" }}
          />

          <label>이메일</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ padding: "6px", border: "1px solid #ddd" }}
          />

          <label>전화번호</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ padding: "6px", border: "1px solid #ddd" }}
          />

          <label>권한</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{ padding: "6px", border: "1px solid #ddd" }}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <h3 style={{ fontWeight: "bold" }}>🕒 수정 이력</h3>
          <div
            style={{ Height: "500px", overflowY: "auto", marginTop: "10px" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ddd", padding: "5px" }}>
                    항목
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "5px" }}>
                    수정 전
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "5px" }}>
                    수정 후
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: "5px" }}>
                    수정일시
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td
                        style={{
                          textAlign: "center",
                          border: "1px solid #ddd",
                        }}
                      >
                        {item.field}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          border: "1px solid #ddd",
                        }}
                      >
                        {item.old_value}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          border: "1px solid #ddd",
                        }}
                      >
                        {item.new_value}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          border: "1px solid #ddd",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {new Date(item.changed_at)
                          .toLocaleString("ko-KR")
                          .replace(/(오전|오후)/, "\n$1")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: "10px" }}
                    >
                      수정 이력이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={{ marginRight: "20px", padding: "4px 8px" }}
              >
                이전
              </button>
              <span>{currentPage}</span>
              <button
                disabled={history.length < itemsPerPage}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                style={{ marginLeft: "20px", padding: "4px 8px" }}
              >
                다음
              </button>
            </div>
          </div>
          <div>
            <button
              onClick={() => setConfirmMessage("정말 수정하시겠습니까?")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#4f46e5",
                color: "#fff",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
            <button
              onClick={onClose}
              style={{ padding: "6px 12px", marginLeft: "5px" }}
            >
              취소
            </button>
          </div>
        </div>
        {alertMessage && (
          <AlertModal
            message={alertMessage}
            onClose={() => setAlertMessage("")}
          />
        )}
        {confirmMessage && (
          <ConfirmModal
            message={confirmMessage}
            onConfirm={() => {
              handleActualSubmit();
              setConfirmMessage("");
            }}
            onCancel={() => setConfirmMessage("")}
          />
        )}
      </div>
    </div>
  );
}
