import { useEffect, useState } from "react";
import TextContent from "../layout/contents/TextContent";
import FilterControls from "./FilterControls";
import CardList from "./CardList";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function PageLayout({
  type,
  title,
  subtitle,
  imageSrc,
  tabs = [],
  paragraphs = [],
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("start_date");
  const [order, setOrder] = useState("asc");
  const [showPast, setShowPast] = useState(false);
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/schedules/public?type=${type}&sort=${sort}&order=${order}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.schedules);
      })
      .catch(() => showAlert("일정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [type, sort, order]);

  return (
    <div style={{ padding: 32 }}>
      <TextContent
        title={title}
        subtitle={subtitle}
        paragraphs={paragraphs}
        imageSrc={imageSrc}
        tabs={tabs}
      />

      <div style={{ marginTop: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 20, margin: 0 }}>진행 중인 {subtitle}</h3>

            {items.filter(
              (item) => showPast || new Date(item.start_date) >= new Date()
            ).length > 0 && (
              <FilterControls
                sort={sort}
                order={order}
                showPast={showPast}
                onChange={(next) => {
                  if ("sort" in next) setSort(next.sort);
                  if ("order" in next) setOrder(next.order);
                  if ("showPast" in next) setShowPast(next.showPast);
                }}
              />
            )}
          </div>

          {loading ? (
            <p>불러오는 중...</p>
          ) : (
            <CardList
              items={items}
              type={type}
              showPast={showPast}
              onShowPast={() => setShowPast(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
