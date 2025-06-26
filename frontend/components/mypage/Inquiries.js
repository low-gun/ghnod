import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import InquiryModal from "./InquiryModal";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";

export default function Inquiries({ data }) {
  const [inquiries, setInquiries] = useState(data || []);
  const [showModal, setShowModal] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const isMobile = useIsMobile(); // ✅ 1번만 호출
  const containerStyle = {
    padding: isMobile ? 0 : 20,
  };
  // 목록 새로고침
  const fetchData = async () => {
    try {
      const res = await api.get("/mypage/inquiries");
      if (res.data.success) {
        setInquiries(res.data.inquiries);
      }
    } catch (err) {
      console.error("❌ 문의 목록 조회 실패:", err);
    }
  };

  if (!inquiries) return <></>;

  // ✅ 조건 분기된 스타일
  const headerRow = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: 20,
  };

  const topButtonStyle = {
    padding: isMobile ? "10px 0" : "6px 12px",
    width: isMobile ? "100%" : "auto",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: isMobile ? 0 : 0,
  };

  return (
    <div style={containerStyle}>
      <div style={headerRow}>
        {!isMobile && <h2 style={titleStyle}>1:1 문의내역</h2>}
        <button onClick={() => setShowModal(true)} style={topButtonStyle}>
          문의하기
        </button>
      </div>

      {inquiries.length === 0 ? (
        <p style={{ marginTop: 20 }}>1:1 문의 내역이 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {inquiries.map((inquiry, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={inquiry.id || index}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <div style={cardHeaderRow}>
                  <strong>{inquiry.title}</strong>
                  <span style={badgeStyle[inquiry.status]}>
                    {inquiry.status}
                  </span>
                </div>

                <div style={metaRow}>
                  <span>작성일: {formatDate(inquiry.created_at)}</span>
                  <span>
                    답변일:{" "}
                    {inquiry.answered_at
                      ? formatDate(inquiry.answered_at)
                      : "미답변"}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div style={sectionTitle}>📩 문의 내용</div>
                    <p style={messageText}>{inquiry.message}</p>

                    {inquiry.attachment && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          style={downloadButtonStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/${inquiry.attachment}`, "_blank");
                          }}
                        >
                          📎 첨부파일 다운로드
                        </button>
                      </div>
                    )}

                    <div style={sectionTitle}>✅ 관리자 답변</div>
                    <p style={messageText}>
                      {inquiry.answer || "아직 답변이 등록되지 않았습니다."}
                    </p>

                    {inquiry.status === "접수" && (
                      <div style={{ textAlign: "right", marginTop: 16 }}>
                        <button
                          style={deleteButtonStyle}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("정말 삭제하시겠습니까?")) {
                              try {
                                await api.delete(
                                  `/mypage/inquiries/${inquiry.id}`
                                );
                                await fetchData();
                              } catch (err) {
                                alert("삭제 실패");
                                console.error(err);
                              }
                            }
                          }}
                        >
                          ❌ 삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <InquiryModal
          onClose={() => setShowModal(false)}
          onSubmitted={() => {
            fetchData();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ────────────── 유틸 ──────────────
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

// ────────────── 공통 스타일 ──────────────
const titleStyle = { fontSize: "1.2rem", margin: 0 };

const cardHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const metaRow = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 6,
  fontSize: "13px",
  color: "#666",
};

const sectionTitle = {
  fontWeight: "bold",
  marginTop: 12,
  fontSize: "14px",
  color: "#333",
};

const messageText = {
  marginTop: 6,
  fontSize: "14px",
  lineHeight: 1.6,
  whiteSpace: "pre-line",
};

const deleteButtonStyle = {
  background: "#f9f9f9",
  border: "1px solid #ccc",
  borderRadius: "6px",
  color: "#333",
  fontSize: "13px",
  padding: "4px 10px",
  cursor: "pointer",
};

const badgeStyle = {
  접수: {
    backgroundColor: "#ddd",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    color: "#333",
  },
  답변완료: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
  },
};

const downloadButtonStyle = {
  backgroundColor: "#f1f1f1",
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#333",
};
