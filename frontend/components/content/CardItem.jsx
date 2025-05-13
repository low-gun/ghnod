import { useRouter } from "next/router";

export default function CardItem({ item, type }) {
  const router = useRouter();
  const today = new Date();
  const isPast = new Date(item.start_date) < today;

  return (
    <div
      onClick={() => router.push(`/education/${type}/${item.id}`)}
      style={{
        width: 260,
        border: ".0625rem solid #ddd",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 .125rem .375rem rgba(0,0,0,0.05)",
        cursor: "pointer",
        filter: isPast ? "grayscale(0.1) brightness(0.8)" : "none",
      }}
    >
      {/* 썸네일 */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          style={{
            width: "100%",
            height: 140,
            objectFit: "contain",
          }}
        />
      ) : item.product_image ? (
        <img
          src={item.product_image}
          alt={item.title}
          style={{
            width: "100%",
            height: 140,
            objectFit: "contain",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 140,
            background: "#f2f2f2",
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

      {/* 텍스트 */}
      <div style={{ padding: 12 }}>
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
            {item.title}
          </h4>
          {isPast && (
            <span
              style={{
                fontSize: 11,
                fontWeight: "bold",
                backgroundColor: "#f3dcdc",
                color: "#d9534f",
                padding: "2px 6px",
                borderRadius: 4,
                marginLeft: 6,
                whiteSpace: "nowrap",
              }}
            >
              지난 일정
            </span>
          )}
        </div>

        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#666" }}>
          {new Date(item.start_date).toLocaleDateString()} ~{" "}
          {new Date(item.end_date).toLocaleDateString()}
        </p>

        {isPast && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#d9534f",
              fontWeight: "bold",
            }}
          >
            종료된 일정입니다.
          </p>
        )}
      </div>
    </div>
  );
}
