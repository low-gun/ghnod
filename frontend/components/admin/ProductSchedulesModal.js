// 📄 frontend/components/admin/ProductSchedulesModal.js
import { useEffect, useState } from "react";
import axios from "@/lib/api";
import { toast } from "react-toastify";

const ProductSchedulesModal = ({ productId, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`/admin/products/${productId}/schedules`);
      setSchedules(res.data.schedules);
    } catch (err) {
      toast.error("일정 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [productId]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "16px" }}>연결된 교육일정</h3>
        <button onClick={onClose} style={closeButton}>
          닫기
        </button>

        {loading ? (
          <p>불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p>등록된 일정이 없습니다.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {schedules.map((s) => (
              <li key={s.id} style={itemStyle}>
                <strong>{s.title}</strong>
                <br />
                {new Date(s.start_date).toLocaleDateString()} ~{" "}
                {s.end_date ? new Date(s.end_date).toLocaleDateString() : "-"} /{" "}
                {s.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProductSchedulesModal;

// 스타일
const overlayStyle = {
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
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  width: "400px",
  maxHeight: "80vh",
  overflowY: "auto",
  position: "relative",
};

const closeButton = {
  position: "absolute",
  top: "10px",
  right: "12px",
  background: "#ccc",
  border: "none",
  padding: "4px 10px",
  borderRadius: "4px",
  cursor: "pointer",
};

const itemStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};
