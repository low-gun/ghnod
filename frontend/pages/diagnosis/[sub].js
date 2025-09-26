// frontend/pages/diagnosis/[sub].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PageWithFilterLayout from "@/components/common/PageWithFilterLayout";
import ResponsiveSubTabs from "@/components/common/ResponsiveSubTabs";
import SearchFilterBox from "@/components/common/SearchFilterBox";

const tabs = [
  { label: "조직", slug: "org" },
  { label: "팀", slug: "team" },
  { label: "리더십", slug: "leadership" },
  { label: "개인", slug: "individual" },
];

export default function DiagnosisPage() {
  const router = useRouter();
  const { sub } = router.query;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!sub) return; // query 준비 안 됐을 때 방어
    async function fetchProducts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/public?category=진단&type=${sub}`
        );
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("❌ 상품 불러오기 오류:", err);
      }
    }
    fetchProducts();
  }, [sub]);

  return (
    <PageWithFilterLayout
      domain="diagnosis"
      title="진단 | ORP컨설팅"
      description="ORP컨설팅 진단 페이지"
      heroImage="/images/followup.webp"
      heroTitle="진단"
      heroSubtitle={sub}
      subTabs={<ResponsiveSubTabs tabs={tabs} basePath="/diagnosis" />}
      filterBox={
        <SearchFilterBox
          searchType="전체"
          setSearchType={() => {}}
          searchKeyword=""
          setSearchKeyword={() => {}}
          dateRange={{ startDate: null, endDate: null }}
          setDateRange={() => {}}
          sort="start_date"
          setSort={() => {}}
          order="asc"
          setOrder={() => {}}
        />
      }
      items={products}
      type={sub}
    />
  );
}
