// /frontend/components/admin/UnansweredInquiriesModal.jsx
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import AdminDialog from "@/components/common/AdminDialog";
import api from "@/lib/api";
import PaginationControls from "@/components/common/PaginationControls";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { Pencil, Save, Trash2, Reply, Search} from "lucide-react"; // ✅ Trash2 추가

export default function UnansweredInquiriesModal({ open, onClose }) {
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();
  const [grandTotal, setGrandTotal] = useState(0);

  // 서버 데이터
  const [list, setList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalUnanswered, setTotalUnanswered] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI 상태
  const [tab, setTab] = useState("unanswered"); // all | unanswered | answered
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const isMobile = useIsMobile();

  // 답변 작성 상태
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        search: search.trim(),
        status: tab,
      };
      const res = await api.get("admin/inquiries", { params });
      if (res.data?.success) {
        setList(res.data.inquiries || []);
        setTotalCount(res.data.totalCount || 0); // 검색/탭 기준 totalCount
        setTotalAnswered(res.data.totalAnswered || 0);
        setTotalUnanswered(res.data.totalUnanswered || 0);
        setGrandTotal(res.data.grandTotal || 0); // 전체 기준
      }
    } catch (err) {
      console.error("❌ 문의 조회 실패:", err);
      showAlert("문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 탭/페이지 변경 시 로드
  useEffect(() => {
    if (!open) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, page]);

  const handleSearch = () => {
    setPage(1);
    fetchAll();
  };

  // ... 위쪽 코드들 동일

const submitAnswer = async (id) => {
  if (!replyText.trim()) {
    showAlert("답변 내용을 입력하세요.");
    return;
  }
  const ok = await showConfirm("정말 답변을 등록하시겠습니까?");
  if (!ok) return;

  try {
    setSubmitting(true);
    await api.put(`admin/users/inquiries/${id}/answer`, {
      answer: replyText.trim(),
    });
    showAlert("답변이 등록되었습니다.");
    setReplyingId(null);
    setReplyText("");
    fetchAll();
  } catch (err) {
    console.error("❌ 답변 등록 실패:", err);
    showAlert("답변 등록 실패");
  } finally {
    setSubmitting(false);
  }
};

// ✅ 답변 삭제 함수 추가
const handleDeleteAnswer = async (id) => {
  const ok = await showConfirm("정말 답변을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    setSubmitting(true);
    await api.delete(`admin/users/inquiries/${id}/answer`);
    showAlert("답변이 삭제되었습니다.");
    fetchAll();
  } catch (err) {
    console.error("❌ 답변 삭제 실패:", err);
    showAlert("답변 삭제 실패");
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
      open={open}
      onClose={submitting ? undefined : onClose}
      title="문의 빠른작업"
      subtitle={`총 ${grandTotal}건`}
      size="lg"
      footer={footer}
      closeOnBackdrop={!submitting}
    >
      {/* 상단 컨트롤: 탭 + 검색 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          justifyContent: "space-between",
        }}
      >
        {/* 좌측: 탭 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: "100%" }}>
          <TabButton
            active={tab === "all"}
            onClick={() => {
              setTab("all");
              setPage(1);
            }}
          >
            전체
          </TabButton>
          <TabButton
            active={tab === "unanswered"}
            onClick={() => {
              setTab("unanswered");
              setPage(1);
            }}
          >
            미답변 {totalUnanswered ? `(${totalUnanswered})` : ""}
          </TabButton>
          <TabButton
            active={tab === "answered"}
            onClick={() => {
              setTab("answered");
              setPage(1);
            }}
          >
            답변완료 {totalAnswered ? `(${totalAnswered})` : ""}
          </TabButton>
        </div>

        {/* 우측: 검색 */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: "100%" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목/내용/사용자/이메일 검색"
              style={searchInput}
            />
            <button
  type="button"
  onClick={handleSearch}
  disabled={loading}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: loading ? "#e5e7eb" : "#2563eb",
    cursor: loading ? "not-allowed" : "pointer",
  }}
>
  <Search size={18} color={loading ? "#9ca3af" : "#fff"} />
</button>
          </div>
        )}
      </div>

      {/* 로딩 오버레이 */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 500,
            zIndex: 10,
          }}
        >
          불러오는 중...
        </div>
      )}

      {/* 목록 */}
      {list.length === 0 ? (
        <div style={empty}>조회된 문의가 없습니다.</div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {list.map((q) => {
            const answered = q.status === "답변완료";
            return (
              <article key={q.id} style={card(answered)}>
                <header style={cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <strong style={{ fontSize: 15, color: "#111827", overflowWrap: "anywhere" }}>
    {q.title}
  </strong>
  {q.product_id ? (
  <a
    className="badgeLink"
    href={`/admin/products/${q.product_id}`}
    target="_blank"
    rel="noopener noreferrer"
    title={q.product_title ? `상품: ${q.product_title}` : "상품 상세로 이동"}
  >
    상품: {q.product_title || "알 수 없음"}
  </a>
) : q.origin === "forum" ? (   // 👈 공론화 구분 필드(origin) 기준
  <span className="badgeStatic" title="공론화문의">공론화</span>
) : q.company_name || q.department || q.position ? (
  <span className="badgeStatic" title="일반문의">일반문의</span>
) : (
  <span className="badgeStatic" title="1:1문의">1:1문의</span>
)}


  {/* ✅ 공개/비공개 여부 표시 */}
  {q.is_private ? (
    <span style={{ fontSize: 12, color: "#e11d48", fontWeight: 600 }}>비공개</span>
  ) : (
    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>공개</span>
  )}
</div>

                  <StatusPill answered={answered} />
                </header>

                <section style={{ padding: "12px 14px" }}>
                  <div style={sectTitle}>문의 내용</div>
                  <p style={message}>{q.message}</p>

                  {answered && (
  <div style={{ marginTop: 12 }}>
    <div style={sectTitle}>답변 내용</div>

    {replyingId === q.id ? (
  <div style={{ position: "relative", marginTop: 6 }}>
    <textarea
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      placeholder="답변 내용을 수정하세요 (Ctrl+Enter 저장)"
      disabled={submitting}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === "Enter") submitAnswer(q.id);
      }}
      style={{ ...textarea, paddingRight: 60 }}
    />
    {/* 저장 아이콘 */}
    <button
      onClick={() => submitAnswer(q.id)}
      disabled={submitting || replyText.trim() === q.answer.trim()}
      style={{
        position: "absolute",
        right: 30,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <Save size={18} color={submitting ? "#ccc" : "#2563eb"} />
    </button>
    {/* 취소 아이콘(연필 대신 초기화 느낌) */}
    <button
      onClick={() => {
        setReplyingId(null);
        setReplyText("");
      }}
      style={{
        position: "absolute",
        right: 5,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      ✕
    </button>
  </div>
) : (
  <div style={{ position: "relative", marginTop: 6 }}>
    <p style={{ ...message, marginTop: 6, paddingRight: 60 }}>{q.answer}</p>

{/* 수정 버튼 */}
<button
  onClick={() => {
    setReplyingId(q.id);
    setReplyText(q.answer || "");
  }}
  style={{
    position: "absolute",
    right: 35,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
  }}
>
  <Pencil size={18} color="#555" />
</button>

{/* 삭제 버튼 */}
<button
  onClick={() => handleDeleteAnswer(q.id)}
  style={{
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
  }}
>
  <Trash2 size={18} color="#e63946" />
</button>
</div>

)}
  </div>
)}
                  <div style={metaLines}>
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "#f9fafb", borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>작성자(작성일시)</div>

{/* ✅ 회원 / 비회원 각각 기업명/부서/직책 표시 */}
{q.user_id ? (
  <>
    {q.user_company && (
      <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>
        <strong>기업명:</strong> {q.user_company}
        {q.user_department && <> | <strong>부서:</strong> {q.user_department}</>}
        {q.user_position && <> | <strong>직책:</strong> {q.user_position}</>}
      </div>
    )}
    <div>
      {q.user_name || "-"} | {q.user_email || "-"} | {q.user_phone || "-"}
    </div>
  </>
) : (
  <>
    {q.company_name && (
      <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>
        <strong>기업명:</strong> {q.company_name}
        {q.department && <> | <strong>부서:</strong> {q.department}</>}
        {q.position && <> | <strong>직책:</strong> {q.position}</>}
      </div>
    )}
    <div>
      {q.guest_name || "-"} | {q.guest_email || "-"} | {q.guest_phone || "-"}
    </div>
  </>
)}

<div style={{ color: "#6b7280" }}>{toDateTime(q.created_at)}</div>
</div>


{answered && (
  <>
    {/* 답변자(작성일시) 그룹 */}
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        background: "#ecfdf5", // 옅은 초록색 배경
        borderRadius: 6,
      }}
    >
      <div style={{ fontWeight: 600 }}>답변자(작성일시)</div>
      <div>
        {q.answered_name || "-"} | {q.answered_email || "-"} | {q.answered_phone || "-"}
      </div>
      <div>
        {q.answered_at ? toDateTime(q.answered_at) : "-"}
      </div>
    </div>

    {/* 답변자(수정일시) 그룹 - 반복 */}
    {Array.isArray(q.answerHistories) &&
      q.answerHistories.map((h, idx) => (
        <div
          key={idx}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "#ecfdf5", // 옅은 초록색 배경
            borderRadius: 6,
          }}
        >
          <div style={{ fontWeight: 600}}>답변자(수정일시)</div>
          <div>
            {h.editor_name || "-"} | {h.editor_email || "-"} | {h.editor_phone || "-"}
          </div>
          <div>
            {h.edited_at ? toDateTime(h.edited_at) : "-"}
          </div>
        </div>
      ))}
  </>
)}
                  </div>

                  {!answered && (
  replyingId === q.id ? (
    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="답변 내용을 입력하세요 (Ctrl+Enter 등록)"
        disabled={submitting}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === "Enter") submitAnswer(q.id);
        }}
        style={textarea}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setReplyingId(null);
            setReplyText("");
          }}
          disabled={submitting}
          style={btnGhost}
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => submitAnswer(q.id)}
          disabled={submitting || !replyText.trim()}
          style={btnPrimary}
        >
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  ) : (
    <div style={{ textAlign: "right", marginTop: 8 }}>
      {/* ✅ 문의내용 옆에 Reply 아이콘만 표시 */}
      <button
        onClick={() => {
          setReplyingId(q.id);
          setReplyText("");
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Reply size={20} color="#2563eb" />
      </button>
    </div>
  )
)}

                </section>
              </article>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <style jsx>{`
        .badgeLink, .badgeStatic {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          color: #374151;
          display: inline-block;
          max-width: 260px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .badgeLink {
          cursor: pointer;
          text-decoration: none;
          transition: color .15s ease, border-color .15s ease, background .15s ease;
        }
        .badgeLink:hover, .badgeLink:focus-visible {
          color: #1e40af;
          border-color: #bfdbfe;
          background: #eef5ff;
          outline: none;
        }
      `}</style>
    </AdminDialog>
  );
}

/* 서브 컴포넌트/유틸/스타일 */
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
    : { background: "#f59e0b", label: "미답변" };
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

const toDateTime = (s) =>
  new Date(s).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const searchInput = {
  flex: "1 1 160px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontSize: 14,
};
const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
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
const empty = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  background: "#f8fafc",
  border: "1px dashed #e5e7eb",
  borderRadius: 12,
};
const card = (answered) => ({
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
});
const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
};
const metaLines = {
  display: "grid",
  rowGap: 6,
  padding: "10px 12px",
  marginTop: 10,
  borderTop: "1px dashed #f1f5f9",
  color: "#6b7280",
  fontSize: 13,
};
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
