import { useRouter } from "next/router";
import { useEffect, useState, useContext } from "react";
import dynamic from "next/dynamic";   // ✅ 다시 추가
import AdminLayout from "@/components/layout/AdminLayout";
import { User as UserIcon } from "lucide-react";

const UserTabs = dynamic(() => import("@/components/admin/UserTabs"), {
  ssr: false,
  loading: () => null,
});
const UserDetailPageComponent = dynamic(
  () => import("@/components/admin/UserDetailPageComponent"),
  { ssr: false, loading: () => null }
);

import api from "@/lib/api";
import { UserContext } from "@/context/UserContext";
export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useContext(UserContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!id || !currentUser || currentUser.role !== "admin") return;

    api
      .get(`/admin/users/${id}`)
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ 유저 정보 로딩 실패:", err);
        setLoading(false);
      });
  }, [id, currentUser]);

  if (!currentUser) return null;
  if (currentUser.role !== "admin") return null;

  return (
    <AdminLayout
  pageTitle={
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
<UserIcon size={20} style={{ verticalAlign: "middle" }} />
사용자 상세정보
    </span>
  }
>      {loading ? null : user ? (
        <>
          <UserDetailPageComponent user={user} />
          <div style={{ marginTop: "40px" }}>
            <UserTabs userId={id} />
          </div>
        </>
      ) : (
        <p>사용자를 찾을 수 없습니다.</p>
      )}
    </AdminLayout>
  );
}
