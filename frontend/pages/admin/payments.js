import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PaymentsTable from "@/components/admin/PaymentsTable";
import api from "@/lib/api";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        console.log("[ADMIN] ▶ GET /admin/payments 요청"); // 요청 찍기
        const res = await api.get("admin/payments");

        console.log("[ADMIN] ◀ 응답:", res.data); // 응답 찍기
        if (res.data?.success) {
          setPayments(res.data.payments || []);
        } else {
          setError(res.data?.message || "❌ 결제내역 조회 실패");
        }
      } catch (err) {
        console.error("[ADMIN] ❌ /admin/payments axios 오류:", err); // 에러 상세
        if (err.response) {
          console.error("↳ status:", err.response.status);
          console.error("↳ data  :", err.response.data);
        }
        setError("서버 오류");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <AdminLayout pageTitle="💳 결제내역">
      {loading && <></>}
      {!loading && error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && payments.length === 0 && (
        <p>결제 내역이 없습니다.</p>
      )}
      {!loading && !error && payments.length > 0 && (
        <>
          {console.log("✅ CSR: payments 데이터:", payments)}
          <PaymentsTable payments={payments} />
        </>
      )}
    </AdminLayout>
  );
}
