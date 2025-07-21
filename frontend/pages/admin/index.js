import { useEffect, useContext } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/layout/AdminLayout";
import { UserContext } from "@/context/UserContext";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  // 권한 없는 경우 리다이렉트
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  if (user === undefined) return null; // 🚩 제일 먼저 undefined 체크
  // (1) user null → 로딩중
  if (user === null) return <div style={{ padding: 100, textAlign: "center" }}>로딩중...</div>;
  // (2) user는 있는데 admin이 아님
  if (user.role !== "admin") return null; // useEffect에서 이미 replace

  // (3) 진짜 관리자만 보여줌
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
