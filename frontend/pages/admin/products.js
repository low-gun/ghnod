// ✅ admin/products.js (리팩터 완료 버전)
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ProductTable from "@/components/admin/ProductTable";
import api from "@/lib/api";
import { toast } from "react-toastify";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products", {
        params: { all: true }, // ✅ 전체 데이터 한번에 요청
      });
      if (res.data.success) {
        setProducts(res.data.products);

        const allTypes = [
          ...new Set(res.data.products.map((p) => p.type).filter(Boolean)),
        ];
        setProductTypes(allTypes);
      }
    } catch (err) {
      toast.error("상품 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    window.location.href = `/admin/products/${product.id}`;
  };

  return (
    <AdminLayout pageTitle="📦 상품관리">
      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <ProductTable
          products={products}
          productTypes={productTypes}
          onEdit={handleEdit}
          onRefresh={setProducts} // ✅ 상태 반영만 상위에서
        />
      )}
    </AdminLayout>
  );
}
