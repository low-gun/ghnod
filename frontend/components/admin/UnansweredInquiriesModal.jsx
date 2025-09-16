// /frontend/components/admin/UnansweredInquiriesModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/lib/hooks/useIsDeviceSize";
import AdminDialog from "@/components/common/AdminDialog";
import api from "@/lib/api";
import PaginationControls from "@/components/common/PaginationControls";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";

export default function UnansweredInquiriesModal({ open, onClose }) {
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  // 서버 데이터
  const [list, setList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI 상태
  const [tab, setTab] = useState("unanswered"); // ✅ all | unanswered | answered
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at"); // created_at | answered_at | username | email
  const [order, setOrder] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const isMobile = useIsMobile();
  // 답변 작성
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)), // ✅ 이제 백엔드 totalCount 사용
    [totalCount, pageSize]
  );
  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        search: search.trim(),
        sort,
        order,
        status: tab, // ✅ 탭과 status 연동
      };
      const res = await api.get("admin/inquiries", { params });
      if (res.data?.success) {
        setList(res.data.inquiries || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("❌ 문의 조회 실패:", err);
      showAlert("문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 탭/정렬/페이지 변경 시 로드
  useEffect(() => {
    if (!open) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, page, sort, order]);

  const handleSearch = async () => {
    setPage(1);
    fetchAll();
  };

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
      // 현재 탭 유지 상태로 갱신
      fetchAll();
    } catch (err) {
      console.error("❌ 답변 등록 실패:", err);
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

  const countByStatus = useMemo(() => {
    const a = list.filter((q) => q.answer).length;
    const u = list.filter((q) => !q.answer).length;
    return { answered: a, unanswered: u };
  }, [list]);

  return (
    <AdminDialog
      open={open}
      onClose={submitting ? undefined : onClose}
      title="문의 빠른작업"
      subtitle={`총 ${totalCount}건`}
      size="lg"
      footer={footer}
      closeOnBackdrop={!submitting}
    >

      {/* 상단 컨트롤: 탭 + 검색/정렬 */}
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
  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      maxWidth: "100%",
    }}
  >
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
      미답변 {countByStatus.unanswered ? `(${countByStatus.unanswered})` : ""}
    </TabButton>
    <TabButton
      active={tab === "answered"}
      onClick={() => {
        setTab("answered");
        setPage(1);
      }}
    >
      답변완료 {countByStatus.answered ? `(${countByStatus.answered})` : ""}
    </TabButton>
  </div>

  {/* 우측: 검색/정렬 (모바일에서는 숨김) */}
  {!isMobile && (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        maxWidth: "100%",
      }}
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="제목/내용/사용자/이메일 검색"
        style={searchInput}
      />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        style={sel}
        aria-label="정렬 컬럼"
      >
        <option value="created_at">작성일시</option>
        <option value="answered_at">답변일시</option>
        <option value="username">이름</option>
        <option value="email">이메일</option>
      </select>
      <select
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        style={sel}
        aria-label="정렬 방향"
      >
        <option value="desc">내림차순</option>
        <option value="asc">오름차순</option>
      </select>
      <button
        type="button"
        onClick={handleSearch}
        style={btnPrimary}
        disabled={loading}
      >
        검색
      </button>
    </div>
  )}
</div>


      {/* 목록 */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : list.length === 0 ? (
        <div style={empty}>조회된 문의가 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((q) => {
  const answered = !!q.answer;
  return (
    <article key={q.id} style={card(answered)}>
      <header style={cardHeader}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <strong style={{fontSize:15,color:"#111827",overflowWrap:"anywhere"}}>{q.title}</strong>
          {q.product_id ? (
            <a
              className="badgeLink"
              href={`/admin/products/${q.product_id}`}
              target="_blank"
              rel="noopener noreferrer"
              title={q.product_title ? `상품: ${q.product_title}` : "상품 상세로 이동"}
              aria-label={q.product_title ? `상품 ${q.product_title} 상세로 이동` : "상품 상세로 이동"}
            >
              상품: {q.product_title || "알 수 없음"}
            </a>
          ) : (q.company_name || q.department || q.position) ? (
            <span className="badgeStatic" title="일반문의">일반문의</span>
          ) : (
            <span className="badgeStatic" title="1:1문의">1:1문의</span>
          )}
        </div>
        <StatusPill answered={answered} />
      </header>
  
                <section style={{ padding: "12px 14px" }}>
                  <div style={sectTitle}>문의 내용</div>
                  <p style={message}>{q.message}</p>

{/* ✅ 답변 내용 표시 */}
{answered && (
  <div style={{ marginTop: 12 }}>
    <div style={sectTitle}>답변 내용</div>
    <p style={{ ...message, marginTop: 6 }}>{q.answer}</p>
  </div>
)}
<div style={metaLines}>
  <div style={{fontWeight:600,color:"#111827"}}>작성자(작성일시)</div>
  {q.user_id ? (
    <div>{(q.email || "-")} ({q.username || "-"})</div>
  ) : (
    <div>
      {q.guest_name || "-"} / {q.guest_email || "-"} / {q.guest_phone || "-"}
    </div>
  )}
  <div style={{color:"#6b7280"}}>{toDateTime(q.created_at)}</div>

  {/* ✅ 일반문의일 경우 상세정보 노출 */}
  {q.company_name && (
    <div style={{marginTop:6, color:"#374151"}}>
      <strong>기업명:</strong> {q.company_name}{" "}
      {q.department && <> | <strong>부서:</strong> {q.department}</>}
      {q.position && <> | <strong>직책:</strong> {q.position}</>}
    </div>
  )}

  {answered && (
    <>
      <div style={{marginTop:8,fontWeight:600,color:"#111827"}}>답변자(작성일시)</div>
      <div>{(q.answered_by_email || q.answered_by_name || q.answered_by || "-")} ({q.answered_by_name || "-"})</div>
      <div style={{color:"#6b7280"}}>{q.answered_at ? toDateTime(q.answered_at) : "-"}</div>
    </>
  )}
</div>


{/* 답변 영역 */}
{!answered ? (
  <>
    {replyingId === q.id ? (
                        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답변 내용을 입력하세요 (Ctrl+Enter 등록)"
                            disabled={submitting}
                            onKeyDown={(e) => {
                              if (e.ctrlKey && e.key === "Enter")
                                submitAnswer(q.id);
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
                              disabled={submitting}
                              style={btnPrimary}
                            >
                              {submitting ? "등록 중..." : "답변 등록"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "right", marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(q.id);
                              setReplyText("");
                            }}
                            style={btnPrimary}
                          >
                            답변하기
                          </button>
                        </div>
                      )}
                    </>
                  ) : null}
                </section>
              </article>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
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

const sel = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 14,
};
const searchInput = {
  flex: "1 1 160px", // ← 줄바꿈 시 줄폭에 맞춰 줄어듦
  minWidth: 0, // ← flex-item 축소 허용
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
  background: answered ? "#ffffff" : "#fff7ed",
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
