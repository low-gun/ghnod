import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import InquiryModal from "@/components/inquiry/InquiryModal";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 추가
import GlobalDialog from "@/components/common/GlobalDialog";

export default function Inquiries({ data }) {
  const [inquiries, setInquiries] = useState(data || []);
  const [showModal, setShowModal] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const isMobile = useIsMobile();
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const { showConfirm } = useGlobalConfirm(); // ✅ 추가
  const [editTarget, setEditTarget] = useState(null);

  // 목록 새로고침
  const fetchData = async () => {
    try {
      const res = await api.get("/mypage/inquiries");
      if (res.data.success) setInquiries(res.data.inquiries);
    } catch (err) {
      console.error("❌ 문의 목록 조회 실패:", err);
    }
  };

  if (!inquiries) return null;

  // 스타일
  const containerStyle = { padding: isMobile ? 0 : 20 };
  const headerRow = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: 0, // ← 타이틀의 marginBottom(20px)만 사용해 통일
  };
  const topButtonStyle = {
    padding: isMobile ? "10px 0" : "7px 20px",
    width: isMobile ? "100%" : "auto",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: isMobile ? "1rem" : "1.07rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <div style={headerRow}>
  <h2 style={titleStyle}>1:1 문의내역</h2>
</div>


{inquiries.length === 0 ? (
  <div
    style={{
      padding: isMobile ? "56px 0 40px 0" : "70px 0 60px 0",
      textAlign: "center",
      color: "#bbb",
      fontSize: isMobile ? "1rem" : "1.1rem",
      minHeight: 200,
      fontWeight: 400,
    }}
  >
    <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}></span>
    1:1 문의 내역이 없습니다.
  </div>
) : (
  <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {inquiries.map((inquiry, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={inquiry.id || index}
                style={{
                  border: "1.5px solid #e4eaf5",
                  borderRadius: 14,
                  padding: isMobile ? 13 : 18,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 10px 0 rgba(40,90,200,0.07)",
                  cursor: "pointer",
                  transition: "box-shadow 0.16s",
                  position: "relative",
                }}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                {/* 제목, 상태 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, fontSize: isMobile ? 15.5 : 16 }}
                  >
                    {inquiry.title}
                  </span>
                  <span
                    style={{
                      ...badgeStyle[inquiry.status],
                      fontWeight: 600,
                      minWidth: 66,
                      textAlign: "center",
                    }}
                  >
                    {inquiry.status}
                  </span>
                </div>
                {/* 메타 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 7,
                    fontSize: "13.2px",
                    color: "#7a849a",
                    fontWeight: 400,
                    gap: 8,
                  }}
                >
                  <span>작성일: {formatDate(inquiry.created_at)}</span>
                  <span>
                    답변일:{" "}
                    {inquiry.answered_at
                      ? formatDate(inquiry.answered_at)
                      : "미답변"}
                  </span>
                </div>

                {/* 펼침 본문 */}
                {isOpen && (
                  <div
                    style={{
                      marginTop: 13,
                      borderTop: "1px solid #f3f4fa",
                      paddingTop: 13,
                    }}
                  >
                    <div style={sectionTitle}>📩 문의 내용</div>
                    <p
                      style={{
                        ...messageText,
                        background: "#f9fafd",
                        borderRadius: 7,
                        padding: "10px 12px",
                        color: "#40485c",
                        border: "1px solid #f2f2f2",
                      }}
                    >
                      {inquiry.message}
                    </p>

                    {/* 첨부파일 */}
                    {inquiry.attachment && (
                      <div style={{ marginTop: 6 }}>
                        <button
                          style={{
                            ...downloadButtonStyle,
                            background: "#f5f8fe",
                            border: "1.1px solid #cdd4ed",
                            color: "#415aad",
                            fontWeight: 500,
                            fontSize: 13.3,
                          }}
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
                    <p
                      style={{
                        ...messageText,
                        background: "#f9fafd",
                        borderRadius: 7,
                        padding: "10px 12px",
                        color: "#40485c",
                        border: "1px solid #f2f2f2",
                      }}
                    >
                      {inquiry.answer || "아직 답변이 등록되지 않았습니다."}
                    </p>

                    {/* 삭제 */}
                    {inquiry.status === "접수" && (
                      <div style={{ textAlign: "right", marginTop: 12 }}>
                        <button
                          style={{
                            background: "#fff",
                            border: "1.2px solid #e4eaf5",
                            borderRadius: 8,
                            color: "#f34b4b",
                            fontSize: "13.5px",
                            padding: "4.5px 15px",
                            cursor: "pointer",
                            fontWeight: 500,
                            transition: "background 0.12s",
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok =
                              await showConfirm("정말 삭제하시겠습니까?");
                            if (!ok) return;
                            try {
                              await api.delete(
                                `/mypage/inquiries/${inquiry.id}`
                              );
                              await fetchData();
                            } catch (err) {
                              showAlert("삭제 실패");
                              console.error(err);
                            }
                          }}
                        >
                          삭제
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
{/* 하단 액션 영역 */}
<div
  style={{
    marginTop: 16,
    display: "flex",
    justifyContent: "center",   // ← 가운데 정렬
  }}
>
  <button
    onClick={() => setShowModal(true)}
    style={{
      ...topButtonStyle,
       // ← 버튼 폭 자동
      alignSelf: "center",       // ← 수직도 중앙(혹시 높이 변동 시)
    }}
  >
    문의하기
  </button>
</div>

<GlobalDialog
  open={showModal}
  onClose={() => {
    setShowModal(false);
    setEditTarget(null);
  }}
  title="1:1 문의"
>
  <InquiryModal
    mode="mypage"
    initialData={editTarget}
    onClose={() => {
      setShowModal(false);
      setEditTarget(null);
    }}
    onSubmitSuccess={() => {
      setShowModal(false);
      setEditTarget(null);
      fetchData();  {/* ✅ 함수 이름 맞춤 */}
    }}
  />
</GlobalDialog>

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
const titleStyle = {
  fontSize: "1.2rem",
  fontWeight: "bold",
  marginBottom: "20px",
};
const sectionTitle = {
  fontWeight: 600,
  fontSize: "14.5px",
  color: "#40508d",
  margin: "12px 0 2px 0",
};

const messageText = {
  marginTop: 4,
  fontSize: "14.2px",
  lineHeight: 1.7,
  whiteSpace: "pre-line",
  letterSpacing: "-0.2px",
};

const badgeStyle = {
  접수: {
    backgroundColor: "#e3e7f3",
    padding: "2.8px 11px",
    borderRadius: 12,
    fontSize: 13,
    color: "#2a305c",
    border: "1px solid #d0d9ee",
    display: "inline-block",
  },
  답변완료: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    padding: "2.8px 11px",
    borderRadius: 12,
    fontSize: 13,
    border: "1px solid #aacafe",
    display: "inline-block",
  },
};

const downloadButtonStyle = {
  backgroundColor: "#f1f1f1",
  border: "1px solid #ccc",
  borderRadius: "7px",
  padding: "6.5px 16px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#415aad",
  fontWeight: 500,
  marginTop: 1,
};
