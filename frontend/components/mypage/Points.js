import React, { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize"; // 상단 import 추가
export default function Points({ data }) {
  const [tab, setTab] = useState("전체");

  // 적립 후 사용된 동일 금액 데이터 병합
  const merged = [];
  const usedMap = new Map();
  data?.forEach((point) => {
    if (point.change_type === "사용") {
      usedMap.set(point.amount, point);
    } else {
      const used = usedMap.get(point.amount);
      if (used) {
        merged.push({
          ...used,
          created_at: point.created_at, // 적립일시
          change_type: "사용", // 구분은 사용
        });
        usedMap.delete(point.amount);
      } else {
        merged.push(point);
      }
    }
  });
  usedMap.forEach((v) => merged.push(v));
  const isMobile = useIsMobile(); // 컴포넌트 내부
  const containerStyle = {
    padding: isMobile ? 0 : 20,
  };
  const filtered = merged.filter((point) => {
    if (tab === "전체") return true;
    return point.change_type === tab;
  });

  const username = data[0]?.username || "사용자";
  const availablePoints = data.reduce((acc, cur) => {
    if (cur.change_type === "적립") return acc + cur.amount;
    if (cur.change_type === "사용") return acc - cur.amount;
    return acc;
  }, 0);

  const renderBadge = (type) => {
    const color = type === "적립" ? "#10b981" : "#ef4444";
    return (
      <span
        style={{
          backgroundColor: color,
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          minWidth: "40px", // ✅ 고정 너비
          textAlign: "center", // ✅ 가운데 정렬
          whiteSpace: "nowrap", // ✅ 줄바꿈 방지
          display: "inline-block", // ✅ width 적용 위해 필요
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div style={containerStyle}>
      {!isMobile && <h2 style={titleStyle}>포인트</h2>}

      {/* 상단 카드 */}
      <div style={cardStyle}>
        <div style={cardLeft}>{username}님의 포인트</div>
        <div style={cardRight}>{formatPrice(availablePoints)}P</div>
      </div>

      {/* 탭 버튼 */}
      <div style={tabRowStyle}>
        {["전체", "적립", "사용"].map((type) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            style={{
              ...tabButtonStyle,
              borderBottom: tab === type ? "2px solid #0070f3" : "none",
              fontWeight: tab === type ? "bold" : "normal",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <p style={{ marginTop: "16px" }}>포인트 내역이 없습니다.</p>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={thStyle}>구분</th>
                <th style={thStyle}>금액</th>
                <th style={thStyle}>설명</th>
                <th style={thStyle}>적립일시</th>
                {(tab === "전체" || tab === "사용") && (
                  <th style={thStyle}>사용일시</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((point, idx) => (
                <tr
                  key={point.point_id || idx}
                  style={idx % 2 === 0 ? rowEven : rowOdd}
                >
                  <td style={tdStyle}>{renderBadge(point.change_type)}</td>
                  <td style={tdStyle}>{formatPrice(point.amount)}P</td>
                  <td style={tdStyle}>{point.description}</td>
                  <td style={tdStyle}>
                    {new Date(point.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  {(tab === "전체" || tab === "사용") && (
                    <td style={tdStyle}>
                      {point.used_at
                        ? new Date(point.used_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const titleStyle = {
  fontSize: "1.2rem",
  marginBottom: "16px",
};

const cardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#f0f8ff",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const cardLeft = {
  fontSize: "1rem",
  fontWeight: "bold",
};

const cardRight = {
  fontSize: "1.2rem",
  fontWeight: "bold",
  color: "#0070f3",
};

const tabRowStyle = {
  display: "flex",
  gap: "16px",
  borderBottom: "1px solid #ccc",
  marginBottom: "12px",
};

const tabButtonStyle = {
  padding: "8px 12px",
  background: "none",
  border: "none",
  fontSize: "1rem",
  cursor: "pointer",
};

const tableWrapperStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "15px",
  lineHeight: "1.6",
};

const theadStyle = {
  backgroundColor: "#f9f9f9",
  borderBottom: "1px solid #ddd",
};

const thStyle = {
  padding: "10px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "14px",
  color: "#333",
};

const tdStyle = {
  padding: "12px",
  textAlign: "center",
  fontSize: "14px",
  color: "#222",
};

const rowEven = {
  backgroundColor: "#fff",
};

const rowOdd = {
  backgroundColor: "#fafafa",
};
