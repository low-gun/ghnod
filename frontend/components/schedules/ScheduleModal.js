import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function ScheduleModal({ scheduleId, onClose, onRefresh }) {
  const [form, setForm] = useState({
    title: "",
    product_id: "",
    start_date: "",
    end_date: "",
    location: "",
    instructor: "",
    description: "",
    total_spots: 0,
    price: 0,
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(scheduleId);

  useEffect(() => {
    api.get("/api/admin/products").then((res) => {
      if (res.data.success) setProducts(res.data.products);
    });
  }, []);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    api
      .get(`/api/admin/schedules/${scheduleId}`)

      .then((res) => {
        if (res.data.success) {
          const data = res.data.schedule;
          setForm({
            ...data,
            start_date: data.start_date?.replace(" ", "T") || "",
            end_date: data.end_date?.replace(" ", "T") || "",
            total_spots: Number(data.total_spots) || 0,
            price: Number(data.price) || 0,
          });
        }
      })
      .catch(() => alert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsed =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    setForm((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        total_spots: Number(form.total_spots) || 0,
      };

      const method = isEdit ? "put" : "post";
      const url = isEdit
        ? `/api/admin/schedules/${scheduleId}`
        : "/api/admin/schedules";

      const res = await api[method](url, payload);
      if (res.data.success) {
        alert(isEdit ? "수정 완료!" : "등록 완료!");
        onRefresh?.();
        onClose();
      } else {
        alert("저장 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("저장 오류:", err);
      alert("저장 중 오류 발생");
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !scheduleId) return;
    if (confirm("정말로 이 일정을 삭제(숨김처리)하시겠습니까?")) {
      try {
        const res = await api.delete(`/api/admin/schedules/${scheduleId}`);
        if (res.data.success) {
          alert("삭제 완료");
          onRefresh?.();
          onClose();
        } else {
          alert("삭제 실패: " + res.data.message);
        }
      } catch (err) {
        console.error("삭제 오류:", err);
        alert("삭제 중 오류 발생");
      }
    }
  };

  const fields = [
    ["일정명", "title", "text"],
    ["시작일", "start_date", "datetime-local"],
    ["종료일", "end_date", "datetime-local"],
    ["장소", "location", "text"],
    ["강사", "instructor", "text"],
    ["설명", "description", "textarea"],
    ["정원", "total_spots", "number"],
    ["가격", "price", "number"],
  ];

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2
          style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "bold" }}
        >
          {isEdit ? "🛠 일정 수정" : "일정 등록"}
        </h2>

        {loading ? (
          <p>⏳ 불러오는 중...</p>
        ) : (
          <>
            <div style={formGroup}>
              <label style={labelStyle}>상품</label>
              <select
                name="product_id"
                value={form.product_id || ""}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">상품 선택</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            {fields.map(([label, name, type]) => (
              <div style={formGroup} key={name}>
                <label style={labelStyle}>{label}</label>
                {type === "textarea" ? (
                  <textarea
                    name={name}
                    value={form[name] || ""}
                    onChange={handleChange}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type={type}
                      name={name}
                      value={form[name] || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                    {name === "price" && form.price ? (
                      <span style={{ fontSize: "0.85rem", color: "#666" }}>
                        {formatPrice(form.price)}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              {isEdit && (
                <button onClick={handleDelete} style={dangerButtonStyle}>
                  삭제
                </button>
              )}
              <button onClick={onClose} style={secondaryButtonStyle}>
                닫기
              </button>
              <button onClick={handleSave} style={primaryButtonStyle}>
                저장
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "#fff",
  padding: "24px 32px",
  borderRadius: "12px",
  width: "560px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
  fontFamily: "'Noto Sans KR', sans-serif",
};

const formGroup = {
  marginBottom: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle = {
  fontWeight: 500,
  fontSize: "14px",
  marginBottom: "4px",
};

const inputStyle = {
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "8px 10px",
  fontSize: "14px",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  backgroundColor: "#0070f3",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  padding: "8px 16px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "#f9f9f9",
  color: "#333",
};

const dangerButtonStyle = {
  backgroundColor: "#e74c3c",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
};
