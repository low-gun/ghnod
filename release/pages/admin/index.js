import { useEffect, useContext } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/layout/AdminLayout";
import { UserContext } from "@/context/UserContext";
import AdminDashboard from "@/components/admin/AdminDashboard";
export default function AdminPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
