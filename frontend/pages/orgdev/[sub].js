import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PageWithFilterLayout from "@/components/common/PageWithFilterLayout";
import ResponsiveSubTabs from "@/components/common/ResponsiveSubTabs";
import SearchFilterBox from "@/components/common/SearchFilterBox";

const tabs = [
  { label: "조직", slug: "org" },
  { label: "팀", slug: "team" },
  { label: "개인", slug: "individual" },
];

export default function OrgDevPage() {
  const router = useRouter();
  const { sub } = router.query;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!sub) return;
    async function fetchProducts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/public?category=조직개발&type=${sub}`
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
      domain="orgdev"
      title="조직 개발 | ORP컨설팅"
      description="조직 개발 관련 과정과 솔루션"
      heroImage="/images/followup.webp"
      heroTitle="조직 개발"
      heroSubtitle={sub}
      subTabs={<ResponsiveSubTabs tabs={tabs} basePath="/orgdev" />}
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
