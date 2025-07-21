import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import PaymentsTable from "@/components/admin/PaymentsTable";
import api from "@/lib/api";
import { UserContext } from "@/context/UserContext"; // 🔥 누락 없이 꼭 추가!

export default function AdminPaymentsPage() {
  const { user } = useContext(UserContext); // 🔥 관리자 체크
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 관리자 외 접근 차단: useEffect에서 리디렉트
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return; // 권한자만 API 호출

    const fetchPayments = async () => {
      try {
        console.log("[ADMIN] ▶ GET /admin/payments 요청");
        const res = await api.get("admin/payments");
        console.log("[ADMIN] ◀ 응답:", res.data);

        if (res.data?.success) {
          setPayments(res.data.payments || []);
        } else {
          setError(res.data?.message || "❌ 결제내역 조회 실패");
        }
      } catch (err) {
        console.error("[ADMIN] ❌ /admin/payments axios 오류:", err);
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
  }, [user]);

  // 🔥 SSR에서 user null일 때(로딩 중) → null
  if (!user) return null;
  // 🔥 비관리자면 아예 렌더 차단 (리디렉트도 위에서 실행됨)
  if (user.role !== "admin") return null;

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
