// /frontend/pages/admin/products.js
import { useEffect, useMemo, useState, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import "react-datepicker/dist/react-datepicker.css";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";

import ProductTable from "@/components/admin/ProductTable";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import { UserContext } from "@/context/UserContext";

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { showAlert } = useGlobalAlert();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [byCategoryType, setByCategoryType] = useState([]); // ✅ 카테고리+유형별 통계 추가

  // 검색 상태(공통 UI)
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ 버튼 눌렀을 때만 적용되는 커밋 상태
  const [appliedType, setAppliedType] = useState("all");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchSyncKey, setSearchSyncKey] = useState(0);
  const [activeStatKey, setActiveStatKey] = useState("all"); // ← 추가

  // 권한 체크
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);

    // 데이터 로드
    const fetchProducts = useCallback(async () => {
      try {
        const res = await api.get("admin/products", { params: { all: true } });
        if (res.data?.success) {
          setProducts(res.data.products || []);
          const types = [
            ...new Set(
              (res.data.products || []).map((p) => p.type).filter(Boolean)
            ),
          ];
          setProductTypes(types);
        }
      } catch (err) {
        showAlert("상품 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }, [showAlert]);
  
    // ✅ 카테고리+유형 통계 불러오기
    const fetchStats = useCallback(async () => {
      try {
        const res = await api.get("admin/products/stats");
        if (res.data?.success) {
          setByCategoryType(res.data.byCategoryType || []);
        }
      } catch (err) {
        console.error("상품 통계 불러오기 실패:", err);
      }
    }, []);
  

    useEffect(() => {
      if (user && user.role === "admin") {
        fetchProducts();
        fetchStats(); // ✅ 추가
      }
    }, [user, fetchProducts, fetchStats]);
  
  // 클라이언트 필터(간단 공통 검색)
  const filteredProducts = useMemo(() => {
    const q = (appliedQuery || "").trim().toLowerCase();
    const t = appliedType;

    if (!q || t === "all") {
      if (!q) return products;
      return (products || []).filter((p) =>
        [
          String(p.id ?? "").toLowerCase(),
          String(p.code ?? "").toLowerCase(),
          String(p.title ?? p.name ?? "").toLowerCase(),
          String(p.type ?? "").toLowerCase(),
          String(p.price ?? "").toLowerCase(),
        ].some((v) => v.includes(q))
      );
    }

    return (products || []).filter((p) => {
      const val = (() => {
        switch (t) {
          case "id":
            return String(p.id ?? "");
          case "code":
            return String(p.code ?? "");
          case "title":
            return String(p.title ?? p.name ?? "");
          case "type":
            return String(p.type ?? "");
          case "is_active":
            return String(p.is_active ?? "");
          default:
            return "";
        }
      })()
        .toString()
        .toLowerCase();
      return val.includes(q);
    });
  }, [products, appliedType, appliedQuery, searchSyncKey]);

  // ✅ 모든 훅 호출 후에 권한 가드
  const [excelData, setExcelData] = useState({ headers: [], data: [] });

  // 상단 액션
  // ✅ 유형별 개수 집계
  const byType = useMemo(() => {
    const counts = products.reduce((acc, p) => {
      const t = p.type || "";
      if (!t) return acc;
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    return productTypes.map((t) => ({ type: t, count: counts[t] || 0 }));
  }, [products, productTypes]);

  // ✅ 상단 패널 표시용 데이터 (카테고리만)
const stats = useMemo(
  () => [
    {
      title: "상품 현황",
      value: [
        { label: `총 ${products.length}개`, key: "all" },
        ...Object.entries(
          products.reduce((acc, p) => {
            const cat = p.category || "기타";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {})
        ).map(([category, count]) => ({
          label: `${category}: ${count}개`,
          key: `cat:${category}`,
        })),
      ],
    },
  ],
  [products]
);

  // ✅ 칩 클릭 시 테이블 필터 적용
  const handleStatClick = (key) => {
    if (key === "all") {
      setSearchType("all");
      setSearchQuery("");
      setAppliedType("all");
      setAppliedQuery("");
    } else if (key.startsWith("cat:")) {
      const category = key.replace("cat:", "");
      setSearchType("category");
      setSearchQuery(category);
      setAppliedType("category");
      setAppliedQuery(category);
    }
    setActiveStatKey(key);
    setSearchSyncKey((k) => k + 1);
  };

  // 상단 액션
  const actions = [
    {
      label: "+ 등록",
      color: "blue",
      onClick: () => router.push("/admin/products/new"),
    },
    {
      label: "- 삭제",
      color: "red",
      onClick: () => {
        // 🔑 schedules.js와 동일하게 window 이벤트 트리거
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("products:deleteSelected"));
        }
      },
    },
  ];

  // AdminSearchFilter 옵션(공통 스펙)
  const searchOptions = [
    { value: "all", label: "전체", type: "text" },
    { value: "code", label: "코드", type: "text" },
    { value: "title", label: "상품명", type: "text" },
    {
      value: "category",                // ✅ 추가됨
      label: "카테고리",
      type: "select",
      options: [
        { value: "진단", label: "진단" },
        { value: "조직개발", label: "조직개발" },
        { value: "리더십개발", label: "리더십개발" },
        { value: "공개과정", label: "공개과정" },
      ],
    },
    {
      value: "type",
      label: "유형",
      type: "select",
      options: productTypes.map((t) => ({ value: t, label: t })),
    },
    {
      value: "is_active",
      label: "활성상태",
      type: "select",
      options: [
        { value: "1", label: "활성" },
        { value: "0", label: "비활성" },
      ],
    },
  ];


  // 엑셀 데이터 (ProductTable에서 onExcelData로 받아옴)
  if (!user || user.role !== "admin") return null;

  return (
    <AdminLayout pageTitle="상품관리">
      {/* 상단 패널(공통) */}
      <AdminTopPanels
        stats={stats}
        onStatClick={handleStatClick}
        activeKey={activeStatKey} // ← 추가
        searchComponent={
          <AdminSearchFilter
            searchType={searchType}
            setSearchType={setSearchType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOptions={searchOptions}
            onSearchClick={({ type, query }) => {
              // ✅ 버튼을 눌렀을 때만 실제 검색 상태로 커밋
              setAppliedType(type ?? searchType);
              setAppliedQuery(query ?? searchQuery);
              setSearchSyncKey((k) => k + 1); // (필요 시 하위 컴포넌트 트리거 용)
            }}
          />
        }
        actions={actions}
        excel={{
          visible: true,
          fileName: "상품목록",
          sheetName: "Products",
          headers: excelData.headers,
          data: excelData.data,
        }}
      />

      {/* 본문 */}
      <ProductTable
  useExternalToolbar={true}
  externalSearchType={appliedType}   // ✅ 버튼 눌러서 커밋된 값 사용
  externalSearchQuery={appliedQuery} // ✅ 버튼 눌러서 커밋된 값 사용
  searchSyncKey={searchSyncKey}      // ✅ 검색 트리거
  onEdit={handleEdit}
  onExcelData={setExcelData}
/>

    </AdminLayout>
  );

  function handleEdit(product) {
    router.push(`/admin/products/${product.id}`);
  }
}

/* 유틸 */
function toLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
