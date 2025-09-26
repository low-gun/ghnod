import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
const EMPTY_PX = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

export default function ProductCard({ product }) {
  const router = useRouter();

  const categorySlugMap = {
    "진단": "diagnosis",
    "조직개발": "orgdev",
    "리더십개발": "leadership",
    "공개과정": "opencourse",
    "공론화": "forum",
  };
  const slugCategory = categorySlugMap[product.category] || product.category;

  const handleClick = () => {
    router.push(`/${slugCategory}/${product.type}/${product.id}`);
  };

  const imgSrc = product.image_url || EMPTY_PX;
  const hasImg = imgSrc !== EMPTY_PX;

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100%",
        maxWidth: 360,
        border: "1px solid #ddd",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 썸네일 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 3",
          background: hasImg ? "#fff" : "#f2f2f2",
        }}
      >
       <Image
  src={imgSrc}
  alt={product.title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
  placeholder={hasImg ? "blur" : undefined}
  blurDataURL={hasImg ? EMPTY_PX : undefined}
  style={{ objectFit: "contain" }}
  priority
  loading="eager"
/>
        {!hasImg && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: 13,
            }}
          >
            썸네일 없음
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ padding: 12, flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.2,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.title}
          </h4>

          {product.purchase_type === "buy" ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 6px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {Number(product.price ?? 0).toLocaleString()}원
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: "#0070F3",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              문의
            </span>
          )}
               </div>

{/* ✅ 태그 표시 */}
{Array.isArray(product.tags) && product.tags.length > 0 && (
  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
    {product.tags.map((tag) => (
      <span
        key={tag}
        style={{
          fontSize: 11,
          padding: "2px 6px",
          borderRadius: 6,
          background: "#f3f4f6",
          color: "#374151",
        }}
      >
        {tag}
      </span>
    ))}
  </div>
)}
</div>
</div>
);
}

