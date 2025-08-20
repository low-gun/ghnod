// /frontend/components/admin/ProductSchedulesModal.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import AdminDialog from "@/components/common/AdminDialog";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function ProductSchedulesModal({ productId, onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const router = useRouter();

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const res = await api.get(`admin/products/${productId}/schedules`);
        if (res.data?.success !== false) {
          setSchedules(res.data?.schedules || []);
        } else {
          setSchedules([]);
        }
      } catch (err) {
        showAlert("일정 조회 실패");
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchSchedules();
  }, [productId, showAlert]);

  const formatDate = (d) =>
    new Date(d)
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");

  const footer = (
    <button
      type="button"
      onClick={onClose}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
      }}
    >
      닫기
    </button>
  );

  return (
    <AdminDialog
      open={true}
      onClose={onClose}
      title="일정 보기"
      subtitle={productId ? `상품 #${productId}` : ""}
      size="sm"
      footer={footer}
    >
      {loading ? (
        <p>불러오는 중...</p>
      ) : schedules.length === 0 ? (
        <div
          style={{
            padding: 16,
            textAlign: "center",
            color: "#6b7280",
            background: "#f8fafc",
            border: "1px dashed #e5e7eb",
            borderRadius: 10,
          }}
        >
          등록된 일정이 없습니다.
        </div>
      ) : (
        <ul
          style={{
            paddingLeft: 0,
            listStyle: "none",
            margin: 0,
            display: "grid",
            gap: 10,
          }}
        >
          {schedules.map((s) => (
            <li
              key={s.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      fontSize: 14,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
                    {formatDate(s.start_date)} ~ {formatDate(s.end_date)}
                    {s.status ? ` · ${s.status}` : ""}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => router.push(`/admin/schedules/${s.id}`)}
                    style={{
                      padding: "6px 10px",
                      fontSize: 13,
                      backgroundColor: "#fff",
                      color: "#374151",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    이동
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminDialog>
  );
}
