import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function UserInquiryModal({ userId, username, onClose }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await api.get(`/admin/users/${userId}/inquiries`);
        if (res.data.success) {
          setInquiries(res.data.inquiries);
        }
      } catch (err) {
        console.error("문의 목록 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [userId]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const formatDate = (str) =>
    new Date(str).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const filtered = (
    showOnlyUnanswered ? inquiries.filter((q) => !q.answer) : inquiries
  ).sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortNewestFirst ? bTime - aTime : aTime - bTime;
  });

  const handleSubmitAnswer = async (inquiryId) => {
    try {
      await api.put(`/admin/users/inquiries/${inquiryId}/answer`, {
        answer: replyText,
      });
      const updated = inquiries.map((i) =>
        i.id === inquiryId
          ? { ...i, answer: replyText, answered_at: new Date().toISOString() }
          : i
      );
      setInquiries(updated);
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      alert("답변 등록 실패");
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeIconStyle} aria-label="닫기">
          ×
        </button>

        <h3 style={{ marginBottom: 16 }}>{username}님의 문의 내역</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <label style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              checked={showOnlyUnanswered}
              onChange={(e) => setShowOnlyUnanswered(e.target.checked)}
            />
            &nbsp;미답변만 보기
          </label>
          <button
            onClick={() => setSortNewestFirst((prev) => !prev)}
            style={{ ...closeBtnStyle, padding: "4px 10px", fontSize: "12px" }}
          >
            {sortNewestFirst ? "📅 최신순" : "📅 오래된순"}
          </button>
        </div>

        {loading ? (
          <p>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p>문의 내역이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((q) => {
              const status = q.answer ? "답변완료" : "미답변";
              const badge =
                status === "답변완료" ? badgeStyle.done : badgeStyle.pending;
              const isReplying = replyingTo === q.id;

              return (
                <div key={q.id} style={cardStyle}>
                  <div style={cardHeader}>
                    <strong>{q.title}</strong>
                    <span style={badge}>{status}</span>
                  </div>
                  <div style={metaRow}>
                    <span>작성일: {formatDate(q.created_at)}</span>
                    <span>
                      답변일: {q.answered_at ? formatDate(q.answered_at) : "-"}
                    </span>
                  </div>
                  <div style={sectionTitle}>📩 문의 내용</div>
                  <p style={messageText}>{q.message}</p>

                  {q.answer && (
                    <>
                      <div style={sectionTitle}>✅ 답변 내용</div>
                      <p style={messageText}>{q.answer}</p>
                    </>
                  )}

                  {!q.answer && (
                    <div style={{ marginTop: 12 }}>
                      {isReplying ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답변 내용을 입력하세요"
                            style={{
                              width: "100%",
                              fontSize: 13,
                              padding: 8,
                              borderRadius: 4,
                              border: "1px solid #ccc",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              onClick={() => setReplyingTo(null)}
                              style={{
                                ...closeBtnStyle,
                                backgroundColor: "#ccc",
                              }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSubmitAnswer(q.id)}
                              style={closeBtnStyle}
                            >
                              답변 등록
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <button
                            onClick={() => setReplyingTo(q.id)}
                            style={closeBtnStyle}
                          >
                            ✏️ 답변하기
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
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 8,
  width: "700px",
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  position: "relative",
};

const closeIconStyle = {
  position: "absolute",
  top: 12,
  right: 12,
  fontSize: 20,
  background: "transparent",
  border: "none",
  color: "#888",
  cursor: "pointer",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  backgroundColor: "#fafafa",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const metaRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  color: "#666",
  marginBottom: 10,
};

const sectionTitle = {
  fontWeight: "bold",
  fontSize: "14px",
  color: "#333",
  marginBottom: 6,
};

const messageText = {
  fontSize: "14px",
  lineHeight: 1.6,
  whiteSpace: "pre-line",
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 4,
  padding: 10,
};

const badgeStyle = {
  done: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
  },
  pending: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
  },
};

const closeBtnStyle = {
  padding: "6px 12px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "13px",
};
