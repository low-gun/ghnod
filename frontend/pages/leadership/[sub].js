import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PageWithFilterLayout from "@/components/common/PageWithFilterLayout";
import ResponsiveSubTabs from "@/components/common/ResponsiveSubTabs";
import SearchFilterBox from "@/components/common/SearchFilterBox";

const tabs = [
  { label: "진단 기반", slug: "assessment" },
  { label: "DCBL", slug: "dcbl" },
  { label: "컨설팅", slug: "consulting" },
  { label: "컨텐츠교육(예정)", slug: "content" },
  { label: "New Solution(예정)", slug: "new" },
];

export default function LeadershipPage() {
  const router = useRouter();
  const { sub } = router.query;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!sub) return;
    async function fetchProducts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/public?category=리더십개발&type=${sub}`
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
      domain="leadership"
      title="리더십 개발 | ORP컨설팅"
      description="리더십 개발 과정과 솔루션"
      heroImage="/images/followup.webp"
      heroTitle="리더십 개발"
      heroSubtitle={sub}
      subTabs={<ResponsiveSubTabs tabs={tabs} basePath="/leadership" />}
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
