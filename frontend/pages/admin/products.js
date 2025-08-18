import { useEffect, useState, useContext } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ProductTable from "@/components/admin/ProductTable";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useRouter } from "next/router";
import { UserContext } from "@/context/UserContext"; // ✅ 추가

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext); // ✅ 추가
  const router = useRouter(); // ✅ 추가
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  // 🔥 권한 체크용 useEffect
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("admin/products", {
        params: { all: true },
      });
      if (res.data.success) {
        setProducts(res.data.products);
        const allTypes = [
          ...new Set(res.data.products.map((p) => p.type).filter(Boolean)),
        ];
        setProductTypes(allTypes);
      }
    } catch (err) {
      showAlert("상품 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user && user.role === "admin") {
      // 🔥 관리자일 때만 fetch!
      fetchProducts();
    }
  }, [user]);

  // 로딩 처리
  // 로딩 처리
  if (user && user.role !== "admin") return null; // 권한 없는 경우 리턴

  // ===== UI 스타일 상수(사이드바 톤 매칭) =====
  const primaryBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#0f172a", // 사이드바와 동일 계열
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "background 0.15s ease",
    outline: "none",
  };
  const cardStyle = {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderLeft: "4px solid #0f172a", // 사이드바 컬러 포인트
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    padding: 16,
  };

  // 기존 코드
  return (
    <AdminLayout pageTitle="📦 상품관리">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => (window.location.href = "/admin/products/new")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          +등록
        </button>
      </div>
      {!loading && (
        <ProductTable
          products={products}
          productTypes={productTypes}
          onEdit={handleEdit}
          onRefresh={setProducts}
        />
      )}
    </AdminLayout>
  );

  function handleEdit(product) {
    window.location.href = `/admin/products/${product.id}`;
  }
}
