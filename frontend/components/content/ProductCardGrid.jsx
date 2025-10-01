import ProductCard from "./ProductCard";
import ResponsiveGrid from "@/components/common/ResponsiveGrid";

export default function ProductCardGrid({ products }) {
  if (!products || products.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "40px 0" }}>
        등록된 상품이 없습니다.
      </p>
    );
  }

  return (
    <ResponsiveGrid
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      gap={24}
      centerItems
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ResponsiveGrid>
  );
}
