// 📄 frontend/components/admin/ProductSchedulesModal.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "@/lib/api";

const ProductSchedulesModal = ({ productId, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`admin/products/${productId}/schedules`);
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

  const formatDate = (d) =>
    new Date(d)
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "16px" }}>일정보기</h3>
        <button onClick={onClose} style={closeButton}>
          ×
        </button>

        {loading ? (
          <p>불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p>등록된 일정이 없습니다.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {schedules.map((s) => (
              <li key={s.id} style={itemStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      color: "#555",
                      lineHeight: "1.5",
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{s.title}</div>
                    <div style={{ marginTop: 2 }}>
                      {formatDate(s.start_date)} ~ {formatDate(s.end_date)} /{" "}
                      {s.status}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/schedules/${s.id}`)}
                    style={moveButton}
                  >
                    이동
                  </button>
                </div>
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
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#999",
};

const itemStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};

const moveButton = {
  marginLeft: "12px",
  padding: "4px 10px",
  fontSize: "13px",
  backgroundColor: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
