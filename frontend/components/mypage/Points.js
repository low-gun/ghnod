import React, { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

export default function Points({ data }) {
  const [tab, setTab] = useState("적립");
  const [detail, setDetail] = useState(null);
  const isMobile = useIsMobile();

  // 포인트 누적(적립-사용)
  const availablePoints = data.reduce((acc, cur) => {
    if (cur.change_type === "적립") return acc + cur.amount;
    if (cur.change_type === "사용") return acc - cur.amount;
    return acc;
  }, 0);

  // 탭별 필터링
  const filtered = data.filter((point) => point.change_type === tab);

  // 스타일
  const containerStyle = { padding: isMobile ? 0 : 20 };
  const cardStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: isMobile ? "12px" : "18px",
    borderRadius: "10px",
    marginBottom: isMobile ? 14 : 22,
    fontSize: isMobile ? 15 : 18,
    height: "64px",
  };
  const tabRowStyle = {
    display: "flex",
    gap: isMobile ? "8px" : "20px",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "8px",
    marginTop: isMobile ? 10 : 20,
  };
  const tabButtonStyle = (active) => ({
    padding: isMobile ? "8px 14px" : "10px 22px",
    background: "none",
    border: "none",
    fontSize: isMobile ? "1rem" : "1.08rem",
    cursor: "pointer",
    borderBottom: active ? "3px solid #0070f3" : "none",
    fontWeight: active ? 700 : 400,
    color: active ? "#0070f3" : "#222",
    outline: "none",
    borderRadius: 0,
  });
  const tableWrapperStyle = { overflowX: "auto" };
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: isMobile ? 14 : 15,
    minWidth: 580,
  };
  const theadStyle = {
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #eee",
  };
  const thStyle = {
    padding: isMobile ? "9px" : "12px",
    textAlign: "center",
    fontWeight: 500,
    fontSize: isMobile ? "13px" : "15px",
    color: "#444",
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: isMobile ? "8px 5px" : "12px",
    textAlign: "center",
    fontSize: isMobile ? "13.5px" : "15px",
    color: "#222",
    whiteSpace: "nowrap",
  };
  const rowEven = { backgroundColor: "#fff" };
  const rowOdd = { backgroundColor: "#f7f9fb" };
  const badgeStyle = (type) => ({
    backgroundColor: type === "적립" ? "#10b981" : "#ef4444",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: 45,
  });

  // 상세 모달
  const renderDetailModal = () =>
    detail && (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 99999,
          width: "100vw",
          height: "100vh",
          background: "rgba(20, 28, 49, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setDetail(null)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 6px 32px 0 rgba(0,0,0,0.14)",
            padding: isMobile ? "20px 14px" : "34px 38px",
            width: isMobile ? "90vw" : 400,
            maxWidth: "95vw",
            fontSize: isMobile ? 15 : 16,
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
            포인트 상세내역
          </div>
          <div style={{ marginBottom: 7 }}>
            <b>구분:</b>{" "}
            <span style={badgeStyle(detail.change_type)}>
              {detail.change_type}
            </span>
          </div>
          <div style={{ marginBottom: 7 }}>
            <b>금액:</b> {formatPrice(detail.amount)}P
          </div>
          <div style={{ marginBottom: 7 }}>
            <b>설명:</b> {detail.description || "-"}
          </div>
          <div style={{ marginBottom: 7 }}>
            <b>적립일시:</b>{" "}
            {detail.created_at
              ? new Date(detail.created_at).toLocaleString("ko-KR")
              : "-"}
          </div>
          {detail.change_type === "사용" && (
            <div style={{ marginBottom: 7 }}>
              <b>사용일시:</b>{" "}
              {detail.used_at
                ? new Date(detail.used_at).toLocaleString("ko-KR")
                : "-"}
            </div>
          )}
          <button
            onClick={() => setDetail(null)}
            style={{
              marginTop: 18,
              padding: "8px 22px",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: isMobile ? 15 : 16,
              width: "100%",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    );

  // 본문
  return (
    <div style={containerStyle}>
      {!isMobile && (
        <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>포인트</h2>
      )}

      {/* 상단 요약카드 */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: isMobile ? 13 : 15,
            color: "#444",
            fontWeight: 500,
          }}
        >
          {data[0]?.username || "회원"}님의 사용가능 포인트
        </div>
        <div
          style={{
            fontSize: isMobile ? 17 : 20,
            color: "#0070f3",
            fontWeight: 700,
          }}
        >
          {formatPrice(availablePoints)}P
        </div>
      </div>

      {/* 탭 버튼 */}
      <div style={tabRowStyle}>
        {["적립", "사용"].map((type) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            style={tabButtonStyle(tab === type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>구분</th>
              <th style={thStyle}>금액</th>
              <th style={thStyle}>설명</th>
              <th style={thStyle}>적립일시</th>
              {tab === "사용" && <th style={thStyle}>사용일시</th>}
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={tab === "사용" ? 6 : 5}
                  style={{
                    color: "#666",
                    fontSize: isMobile ? 14 : 15,
                    textAlign: "center",
                    background: "#f8f9fa",
                    height: "68px",
                  }}
                >
                  포인트 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((point, idx) => (
                <tr
                  key={point.point_id || idx}
                  style={idx % 2 === 0 ? rowEven : rowOdd}
                >
                  <td style={tdStyle}>
                    <span style={badgeStyle(point.change_type)}>
                      {point.change_type}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatPrice(point.amount)}P</td>
                  <td style={tdStyle}>{point.description || "-"}</td>
                  <td style={tdStyle}>
                    {point.created_at
                      ? new Date(point.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  {tab === "사용" && (
                    <td style={tdStyle}>
                      {point.used_at
                        ? new Date(point.used_at).toLocaleString("ko-KR")
                        : "-"}
                    </td>
                  )}
                  <td style={tdStyle}>
                    <button
                      style={{
                        background: "#eee",
                        color: "#0070f3",
                        border: "none",
                        borderRadius: 7,
                        padding: "4px 12px",
                        fontSize: isMobile ? 13 : 14,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      onClick={() => setDetail(point)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderDetailModal()}
    </div>
  );
}
