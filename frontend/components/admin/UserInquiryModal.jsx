// /frontend/components/admin/UserInquiryModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import AdminDialog from "@/components/common/AdminDialog";

export default function UserInquiryModal({ userId, username, onClose }) {
  const { showConfirm } = useGlobalConfirm();
  const { showAlert } = useGlobalAlert();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI 상태
  const [tab, setTab] = useState("all"); // all | unanswered | answered
  const [sort, setSort] = useState("new"); // new | old
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/users/${userId}/inquiries`);
        if (res.data?.success) setInquiries(res.data.inquiries || []);
      } catch (err) {
        console.error("문의 목록 조회 실패:", err);
        showAlert("문의 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, showAlert]);

  const formatDate = (str) =>
    new Date(str).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const filtered = useMemo(() => {
    let arr = inquiries;
    if (tab === "unanswered") arr = arr.filter((q) => !q.answer);
    if (tab === "answered") arr = arr.filter((q) => !!q.answer);
    arr = [...arr].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sort === "new" ? bTime - aTime : aTime - bTime;
    });
    return arr;
  }, [inquiries, tab, sort]);

  const countUnanswered = inquiries.filter((q) => !q.answer).length;
  const countAnswered = inquiries.filter((q) => !!q.answer).length;

  const handleSubmitAnswer = async (inquiryId) => {
    if (!replyText.trim()) {
      showAlert("답변 내용을 입력해주세요.");
      return;
    }
    const ok = await showConfirm("정말 답변을 등록하시겠습니까?");
    if (!ok) return;

    try {
      setSubmitting(true);
      await api.put(`/admin/users/inquiries/${inquiryId}/answer`, {
        answer: replyText.trim(),
      });
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === inquiryId
            ? {
                ...i,
                answer: replyText.trim(),
                answered_at: new Date().toISOString(),
              }
            : i
        )
      );
      setReplyingTo(null);
      setReplyText("");
      showAlert("답변이 등록되었습니다.");
    } catch (err) {
      showAlert("답변 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <button
      type="button"
      onClick={onClose}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
      }}
    >
      닫기
    </button>
  );

  return (
    <AdminDialog
      open={true}
      onClose={submitting ? undefined : onClose}
      title={`${username}님의 문의 내역`}
      subtitle={`전체 ${inquiries.length}건 · 미답변 ${countUnanswered}건 · 답변완료 ${countAnswered}건`}
      size="lg"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      {/* 상단 컨트롤바: 탭 + 정렬 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            전체
          </TabButton>
          <TabButton
            active={tab === "unanswered"}
            onClick={() => setTab("unanswered")}
          >
            미답변 {countUnanswered > 0 ? `(${countUnanswered})` : ""}
          </TabButton>
          <TabButton
            active={tab === "answered"}
            onClick={() => setTab("answered")}
          >
            답변완료 {countAnswered > 0 ? `(${countAnswered})` : ""}
          </TabButton>
        </div>

        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={sel}
            aria-label="정렬"
          >
            <option value="new">최신순</option>
            <option value="old">오래된순</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((q) => {
            const isReplying = replyingTo === q.id;
            const answered = !!q.answer;
            return (
              <article
                key={q.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: answered ? "#ffffff" : "#fff7ed",
                  // 미답변은 살짝 강조(주황빛)
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* 헤더 */}
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "12px 14px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <strong
                    style={{
                      fontSize: 15,
                      color: "#111827",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {q.title}
                  </strong>
                  <StatusPill answered={answered} />
                </header>

                {/* 본문 */}
                <section style={{ padding: "12px 14px" }}>
                  <div style={sectTitle}>문의 내용</div>
                  <p style={message}>{q.message}</p>

                  {/* ✅ 메타를 본문 하단으로 이동 + 라벨 '작성일시/답변일시' */}
                  <div style={metaLines}>
                    <div>작성일시 : {formatDate(q.created_at)}</div>
                    <div>
                      답변일시 :{" "}
                      {q.answered_at
                        ? `${formatDate(q.answered_at)} (${q.answered_by_name || q.answered_by || "-"})`
                        : "-"}
                    </div>
                  </div>

                  {answered && (
                    <>
                      <div style={sectTitle}>답변 내용</div>
                      <p style={message}>{q.answer}</p>
                    </>
                  )}

                  {/* 답변 작성 */}
                  {!answered && (
                    <div style={{ marginTop: 12 }}>
                      {isReplying ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답변 내용을 입력하세요 (Ctrl+Enter 등록)"
                            disabled={submitting}
                            onKeyDown={(e) => {
                              if (e.ctrlKey && e.key === "Enter") {
                                handleSubmitAnswer(q.id);
                              }
                            }}
                            style={textarea}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              disabled={submitting}
                              style={btnGhost}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitAnswer(q.id)}
                              disabled={submitting}
                              style={btnPrimary}
                            >
                              {submitting ? "등록 중..." : "답변 등록"}
                            </button>
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            • 단축키: <b>Ctrl + Enter</b>로 빠르게 등록
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(q.id);
                              setReplyText("");
                            }}
                            style={btnPrimary}
                            aria-label="답변하기"
                          >
                            답변하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </article>
            );
          })}
        </div>
      )}
    </AdminDialog>
  );
}

/* ── 서브 컴포넌트 ── */
function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
        background: active ? "#eff6ff" : "#fff",
        color: active ? "#2563eb" : "#374151",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

function StatusPill({ answered }) {
  const style = answered
    ? { background: "#16a34a", label: "답변완료" }
    : { background: "#f59e0b", label: "미답변" }; // 주황색으로 가독성 향상
  return (
    <span
      style={{
        backgroundColor: style.background,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
      aria-label={style.label}
    >
      {style.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        color: "#6b7280",
        background: "#f8fafc",
        border: "1px dashed #e5e7eb",
        borderRadius: 12,
      }}
    >
      조회된 문의가 없습니다.
    </div>
  );
}

/* ── 스타일 ── */
const sectTitle = {
  fontWeight: 700,
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
};

const message = {
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: "pre-line",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
};

const textarea = {
  width: "100%",
  minHeight: 110,
  fontSize: 14,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  resize: "vertical",
  background: "#fff",
};

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const btnGhost = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
};
const sel = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
};
const metaLines = {
  display: "grid",
  rowGap: 6,
  padding: "8px 14px",
  marginTop: 8,
  borderTop: "1px dashed #f1f5f9",
  color: "#6b7280",
  fontSize: 13,
};
