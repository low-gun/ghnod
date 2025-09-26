// components/common/Breadcrumb.js
import { useRouter } from "next/router";

const categorySlugMap = {
  "진단": "diagnosis",
  "조직개발": "orgdev",
  "리더십개발": "leadership",
  "공개과정": "opencourse",
  "공론화": "forum",
};

export default function Breadcrumb({ category, type }) {
  const router = useRouter();
  const slug = categorySlugMap[category] || category;

  return (
    <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
      <span
        onClick={() => router.push(`/${slug}`)}
        style={{ cursor: "pointer", marginRight: 6 }}
      >
        {category}
      </span>
      &gt;
      <span style={{ marginLeft: 6 }}>{type}</span>
    </div>
  );
}
