// pages/admin/index.js
import { useEffect, useContext } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import { UserContext } from "@/context/UserContext";

const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 100, textAlign: "center" }}>대시보드 불러오는 중…</div>
  ),
});

export default function AdminPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  // 권한 없는 경우 리다이렉트
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  // 컨텍스트 초기화 대기
  if (user === undefined) return null;

  // 로그인 안 됨 → 로그인 페이지로 유도(필요 시 경로 변경)
  if (user === null) {
    if (typeof window !== "undefined") {
      router.replace("/login?next=/admin");
    }
    return null;
  }

  // 관리자 아님 → useEffect에서 리다이렉트, 여기서는 렌더 막음
  if (user.role !== "admin") return null;

  // 관리자만 접근
  return (
    <AdminLayout>
      <h1 style={{ padding: "24px 24px 0" }}>관리자 대시보드</h1>
      <AdminDashboard />
    </AdminLayout>
  );
}

// ✅ getServerSideProps 없음 (CSR 기반)
