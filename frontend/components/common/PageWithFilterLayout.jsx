// components/common/PageWithFilterLayout.jsx
import Head from "next/head";
import ScheduleCardGrid from "@/components/education/ScheduleCardGrid";
import ProductCardGrid from "@/components/content/ProductCardGrid";

export default function PageWithFilterLayout({
  domain,       // "education" | "diagnosis" | "consulting"
  title,
  description,
  ogImage,
  ogUrl,
  heroImage,
  heroTitle,
  heroSubtitle,
  subTabs,
  filterBox,
  items = [],
  type,
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={ogUrl} />
      </Head>

      <div style={{ padding: 32 }}>
        {subTabs}

        {/* Hero */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ width: "100%", maxWidth: 1200, height: "clamp(220px,28vw,360px)", borderRadius: 8, overflow: "hidden", margin: "0 auto" }}>
            <img src={heroImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", top: 20, left: 32 }}>
            <h1>{heroTitle}</h1>
            {heroSubtitle && <p>{heroSubtitle}</p>}
          </div>
        </div>

        {filterBox}

        {/* 카드 리스트 분기 */}
        {domain === "education" ? (
  <ScheduleCardGrid schedules={items} type={type} />
) : (
  <ProductCardGrid products={items} />
)}
      </div>
    </>
  );
}
