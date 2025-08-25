// frontend/pages/admin/schedules/[id].js
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploader from "@/components/common/ImageUploader";
import FormSection from "@/components/common/FormSection";
import FormField from "@/components/common/FormField";
import SessionRow from "@/components/admin/SessionRow";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import FormFooterBar from "@/components/common/FormFooterBar";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";   // ✅ 모바일/태블릿 모달용

const fmtKRW = (n) => {
  if (n === "" || n === null || n === undefined) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("ko-KR");
};

const LABELS = {
  title: "일정명",
  location: "장소",
  instructor: "강사",
  total_spots: "정원",
};

export default function ScheduleFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = id !== "new";
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();
  const isTabletOrBelow = useIsTabletOrBelow?.() ?? false;   // ✅ 태블릿 이하에서 모달 사용
  const [showScheduleModal, setShowScheduleModal] = useState(false);  // ✅ 모달 상태

  const [form, setForm] = useState({
    product_id: "",
    title: "",
    location: "",
    instructor: "",
    description: "",
    total_spots: "",
    price: "",
    detail: "",
    image_url: "",
    lecture_hours: "",
  });
  const [originalForm, setOriginalForm] = useState({});
  const [sessions, setSessions] = useState([
    { start_date: "", end_date: "", total_spots: "" },
  ]);

  const [priceInput, setPriceInput] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(false);

  const educationTypes = useMemo(() => {
    const types = products
      .filter((p) => p.category === "교육")
      .map((p) => p.type)
      .filter(Boolean);
    return Array.from(new Set(types));
  }, [products]);

  const rowErrors = useMemo(
    () =>
      sessions.map((s) => ({
        invalidDate: s.start_date && s.end_date && s.start_date > s.end_date,
        missing: !s.start_date || !s.end_date,
      })),
    [sessions]
  );

  const hasAnyError =
    rowErrors.some((e) => e.missing || e.invalidDate) ||
    !form.title ||
    !form.product_id ||
    form.price === "" ||
    form.price === null;

  useEffect(() => {
    api.get("admin/products").then((res) => {
      if (res.data.success) setProducts(res.data.products);
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get(`admin/schedules/${id}`)
      .then((res) => {
        if (!res.data.success) return showAlert("일정 정보를 불러오지 못했습니다.");
        const data = res.data.schedule;

        setForm({
          ...data,
          total_spots: data.total_spots ?? "",
          price: data.price ?? "",
          image_url: data.image_url || "",
          lecture_hours: data.lecture_hours ?? "",
        });
        setOriginalForm(data);
        setPriceInput(fmtKRW(data.price ?? ""));
        setSelectedType(data.product_type || "");

        if (Array.isArray(data.sessions) && data.sessions.length) {
          setSessions(
            data.sessions.map((s) => ({
              start_date: (s.start_date || s.session_date || "").slice(0, 10),
              end_date: (s.end_date || s.session_date || "").slice(0, 10),
              total_spots: s.total_spots ?? "",
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, showAlert]);

  useEffect(() => {
    setPriceInput(fmtKRW(form.price));
  }, [form.price]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      const digits = value.replace(/[^0-9]/g, "");
      setPriceInput(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")); // 보기용
      setForm((prev) => ({ ...prev, price: digits === "" ? "" : Number(digits) })); // 실제 값
      return;
    }
    if (name === "lecture_hours") {
      const clean = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, lecture_hours: clean }));
      return;
    }
    if (name === "product_type") {
      setSelectedType(value);
      setForm((prev) => ({ ...prev, product_id: "" }));
      return;
    }
    if (name === "product_id") {
      const selected = products.find((p) => p.id === Number(value));
      setSelectedType(selected?.type || "");
      setForm((prev) => ({
        ...prev,
        product_id: value,
        title: selected?.title || "",
        price: selected?.price ?? "",
        description: selected?.description || "",
        detail: selected?.detail || "",
        image_url: selected?.image_url || "",
      }));
      setPriceInput(fmtKRW(selected?.price ?? ""));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetSession = (idx) => {
    if (sessions.length === 1) {
      setSessions([{ start_date: "", end_date: "", start_time: "", end_time: "" }]);
    } else {
      setSessions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSave = async () => {
    if (hasAnyError) return showAlert("입력값을 확인하세요.");
    try {
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `admin/schedules/${id}` : "admin/schedules";
      const payload = {
        ...form,
        sessions: sessions.map((s) => ({
          start_date: s.start_date,
          end_date: s.end_date,
          start_time: "00:00",
          end_time: "00:00",
          total_spots: Number.isFinite(Number(s.total_spots))
            ? Number(s.total_spots)
            : (Number.isFinite(Number(form.total_spots)) ? Number(form.total_spots) : 0),
        })),
      };
      const res = await api[method](url, payload);

      if (res.data.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/schedules");
      }
    } catch {
      showAlert("저장 중 오류 발생");
    }
  };

  if (!router.isReady) return null;

  return (
    <AdminLayout pageTitle={isEdit ? "일정수정" : "일정등록"}>
      <div className="container">
        {loading ? (
          <p>⏳ 불러오는 중...</p>
        ) : (
          <>
            <div className="topGrid">
              {/* 1단: 좌(상품정보) | 우(썸네일) */}
              <FormSection title="상품 정보">
                <FormField label="상품 유형">
                  <select
                    name="product_type"
                    value={selectedType}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">유형 선택</option>
                    {educationTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="상품명">
                  <select
                    name="product_id"
                    value={form.product_id || ""}
                    onChange={handleChange}
                    disabled={!selectedType}
                    className="input"
                  >
                    {!selectedType ? (
                      <option value="">유형을 먼저 선택</option>
                    ) : (
                      <>
                        <option value="">상품 선택</option>
                        {products
                          .filter((p) => p.category === "교육" && p.type === selectedType)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                </FormField>

                <FormField
                  label="간단 설명"
                  helper={`${String(form.description || "").length}/120`}
                  helperAlign="right"
                >
                  <input
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    className="input"
                    placeholder="목록/요약에 노출될 짧은 설명 (최대 120자 권장)"
                    maxLength={120}
                  />
                </FormField>
              </FormSection>

              <div className="thumbCol">
                <FormSection title="썸네일">
                  <div className="thumbBox">
                    <ImageUploader
                      value={form.image_url}
                      aspectRatio="1/1"
                      onChange={(dataUrl) => setForm((p) => ({ ...p, image_url: dataUrl }))}
                      onReset={() => setForm((p) => ({ ...p, image_url: "" }))}
                      maxSizeMB={5}
                    />
                  </div>
                </FormSection>
              </div>

              {/* 2단: 좌(일정정보) | 우(스케줄) */}
              <FormSection title="일정 정보">
                <div className="fieldGrid2">
                  <FormField label="일정명">
                    <input
                      name="title"
                      value={form.title || ""}
                      onChange={handleChange}
                      className="input"
                    />
                  </FormField>
                  <FormField label="장소">
                    <input
                      name="location"
                      value={form.location || ""}
                      onChange={handleChange}
                      className="input"
                    />
                  </FormField>
                  <FormField label="강사">
                    <input
                      name="instructor"
                      value={form.instructor || ""}
                      onChange={handleChange}
                      className="input"
                    />
                  </FormField>
                  <FormField label="모집인원">
                    <input
                      type="number"
                      min="0"
                      name="total_spots"
                      value={form.total_spots || ""}
                      onChange={handleChange}
                      className="input"
                    />
                  </FormField>
                  <FormField label="가격">
                    <input
                      name="price"
                      value={priceInput}
                      onChange={handleChange}
                      className="input alignRight"
                      placeholder="숫자만 입력(쉼표 자동)"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="스케줄">
                {/* 태블릿 이하: 모달, 데스크톱: 인라인 */}
                {isTabletOrBelow ? (
                  <>
                    <button
                      className="addSessionBtn"
                      onClick={() => setShowScheduleModal(true)}
                    >
                      스케줄 편집
                    </button>

                    {showScheduleModal && (
                      <div
                        className="modalBackdrop"
                        onClick={() => setShowScheduleModal(false)}
                      >
                        <div
                          className="modalPanel"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4 className="modalTitle">스케줄 편집</h4>

                          <div className="scheduleGrid">
                            <div className="hdr">시작일</div><div className="tilde">~</div>
                            <div className="hdr">종료일</div>
                            <div className="hdr">모집인원</div>
                            <div></div>

                            {sessions.map((s, idx) => (
                              <SessionRow
                                key={idx}
                                value={s}
                                index={idx}
                                error={rowErrors[idx]}
                                onChange={(i, next) =>
                                  setSessions((prev) =>
                                    prev.map((x, ii) => (ii === i ? next : x))
                                  )
                                }
                                onRemove={resetSession}
                                placeholderTotalSpots={form.total_spots || ""}
                              />
                            ))}
                          </div>

                          <button
                            className="addSessionBtn"
                            onClick={() =>
                              setSessions((p) => [
                                ...p,
                                {
                                  start_date: "",
                                  end_date: "",
                                  total_spots: form.total_spots || "",
                                },
                              ])
                            }
                          >
                            + 회차 추가
                          </button>

                          <div className="modalActions">
                            <button
                              className="btnPrimary"
                              onClick={() => setShowScheduleModal(false)}
                            >
                              완료
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="scheduleGrid">
                      <div className="hdr">시작일</div><div className="tilde">~</div>
                      <div className="hdr">종료일</div>
                      <div className="hdr">모집인원</div>
                      <div></div>

                      {sessions.map((s, idx) => (
                        <SessionRow
                          key={idx}
                          value={s}
                          index={idx}
                          error={rowErrors[idx]}
                          onChange={(i, next) =>
                            setSessions((prev) =>
                              prev.map((x, ii) => (ii === i ? next : x))
                            )
                          }
                          onRemove={resetSession}
                          placeholderTotalSpots={form.total_spots || ""}
                        />
                      ))}
                    </div>

                    <button
                      className="addSessionBtn"
                      onClick={() =>
                        setSessions((p) => [
                          ...p,
                          {
                            start_date: "",
                            end_date: "",
                            total_spots: form.total_spots || "",
                          },
                        ])
                      }
                    >
                      + 회차 추가
                    </button>
                  </>
                )}
              </FormSection>
            </div>

            <FormSection title="상세 설명">
              <TiptapEditor
                value={form.detail}
                onChange={(html) => setForm((p) => ({ ...p, detail: html }))}
                height={280}
              />
            </FormSection>

            <FormFooterBar
              onList={() => router.push("/admin/schedules")}
              onDelete={async () => {
                if (!isEdit) return;
                const ok = await showConfirm("정말 삭제하시겠습니까?");
                if (!ok) return;
                try {
                  const res = await api.delete("admin/schedules", {
                    data: { ids: [Number(id)] },
                  });
                  if (res.data.success) {
                    showAlert("삭제완료");
                    router.push("/admin/schedules");
                  }
                } catch {
                  showAlert("삭제 실패");
                }
              }}
              onSave={handleSave}
              isEdit={isEdit}
              saveDisabled={hasAnyError}
            />
          </>
        )}
      </div>

      <style jsx>{`
        .container { max-width:1240px; margin:auto; padding:32px; background:#fff; border-radius:12px; }

        /* 1단: 상품정보 | 썸네일, 2단: 일정정보 | 스케줄 */
        .topGrid{
          display:grid;
          /* 고정폭 대신 유연폭으로 변경: 우측 컬럼이 줄어들며 줄바꿈 방지 */
          grid-template-columns:minmax(0,1fr) minmax(360px, 520px);
          gap:24px;
          align-items:stretch;
        }
        /* 980px 이하(태블릿 세로 등)에서는 단일 컬럼 전환 */
        @media (max-width:980px){
          .topGrid{ grid-template-columns:1fr; gap:12px; }
          .thumbCol{ order:2; } /* 썸네일을 아래로 */
        }

        .thumbCol{ width:100%; }

        /* 썸네일 FormSection 카드 */
        .thumbCol :global(.sectionCard){
          height:auto;
          display:flex;
          flex-direction:column;
          align-items:flex-start;
        }
        .thumbCol :global(.sectionTitle){
          text-align:left;
          width:100%;
        }
        /* 썸네일 폭: clamp로 반응형 */
        .thumbBox{
          width:clamp(160px, 26vw, 260px);
          max-width:100%;
        }

        .addSessionBtn {
          margin-top:14px;
          background:#0070f3;
          color:#fff;
          border:none;
          border-radius:8px;
          padding:10px 16px;
          font-weight:500;
          cursor:pointer;
          transition:background 0.2s ease;
        }
        .addSessionBtn:hover { background:#0059c1; }

        .sectionCard{ border:1px solid #eee; border-radius:12px; padding:16px; margin-bottom:0; background:#fff; }
        .sectionTitle{ margin:0 0 12px 0; font-size:16px; font-weight:700; }
        .helperText{ color:#666; font-size:12px; margin-top:4px; display:block; }

        .field{ margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
        .fieldGrid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .fieldGrid2{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:16px; }
        @media (max-width:980px){
          .fieldGrid2{ grid-template-columns:1fr; gap:12px; }
        }

        /* 라벨 타이포(스케줄 헤더와 동일) */
        .scheduleGrid .hdr{ color:#555; font-size:13px; line-height:1; }

        /* 공통 인풋 */
        .input{
          width:100%;
          box-sizing:border-box;
          height:44px;
          line-height:1.2;
          padding:12px 14px;
          border:1px solid #d0d5dd;
          border-radius:10px;
          font-size:14px;
          background:#fff;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .input:focus{ outline:none; border-color:#0070f3; box-shadow:0 0 0 3px rgba(0,112,243,.15); }
        .alignRight{ text-align:right; }
        .inputUnchanged{ color:#999; }

        /* 스케줄: 헤더/행 그리드(데스크톱 기본) */
        .scheduleGrid{
          display:grid;
          grid-template-columns:
            minmax(0,1fr) 20px minmax(0,1fr) minmax(110px,140px) 32px; /* 시작 | ~ | 종료 | 모집인원 | 삭제 */
          column-gap:8px;
          row-gap:14px;
          align-items:center;
          margin-bottom:8px;
        }
        /* 1100px 이하: 모집인원 칸 폭 축소 */
        @media (max-width:1100px){
          .scheduleGrid{
            grid-template-columns:
              minmax(0,1fr) 16px minmax(0,1fr) minmax(96px,120px) 32px;
          }
        }
        /* 980px 이하(태블릿 세로 등): 틸드(~) 제거, 4열로 재배치 → 넘침 방지 */
        @media (max-width:980px){
          .scheduleGrid{
            grid-template-columns: minmax(0,1fr) minmax(0,1fr) minmax(96px,120px) 32px; /* 시작 | 종료 | 인원 | 삭제 */
            column-gap:8px;
            row-gap:12px;
          }
          .tilde{ display:none; }
        }

        .sessionRow{ display:contents; }
        .sessionRow .cell{ display:flex; flex-direction:column; gap:6px; }
        .sessionRow .fieldError{ color:#e74c3c; font-size:12px; line-height:1.2; }
        .tilde{ color:#9aa0a6; user-select:none; padding:0 2px; align-self:center; }

        /* date 인풋 */
        .scheduleGrid :global(input[type="date"].input){
          min-width:0;
          height:44px;
          padding:10px 12px;
          font-size:13px;
          border:1px solid #d0d5dd;
          border-radius:10px;
          box-sizing:border-box;
          background:#fff;
        }
        .scheduleGrid :global(input[type="date"].input:focus){
          outline:0; border-color:#0070f3; box-shadow:0 0 0 3px rgba(0,112,243,.15);
        }
        :global(input[type="date"].input::-webkit-datetime-edit-fields-wrapper){ padding:0; }
        :global(input[type="date"].input::-webkit-datetime-edit){ padding:0 2px; }
        :global(input[type="date"].input::-webkit-calendar-picker-indicator){ opacity:.8; cursor:pointer; filter:grayscale(1); }
        :global(input[type="date"].input::-webkit-clear-button),
        :global(input[type="date"].input::-webkit-inner-spin-button){ display:none; }

        .btnGhost{ padding:10px 14px; background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; }
        .btnPrimary{ padding:12px 18px; background:#0070f3; color:#fff; border:none; border-radius:8px; cursor:pointer; }
        .btnPrimary:disabled{ opacity:.5; cursor:not-allowed; }
        .btnDanger{ padding:12px 18px; background:#e74c3c; color:#fff; border:none; border-radius:8px; cursor:pointer; margin-left:8px; }
        .btnIcon{ background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer; height:44px; width:28px; display:inline-flex; align-items:center; justify-content:center; }

        .footerBar{ margin-top:28px; display:flex; justify-content:space-between; gap:12px; }

        /* 데스크톱 상향 */
        @media (min-width:1280px){
          .topGrid{ grid-template-columns:minmax(0,0.75fr) minmax(420px, 560px); }
        }

        /* 모바일 최적화: 카드형태 제거 + 좌우 여백 제거 + 스케줄 모달 */
        @media (max-width:640px){
          .container{ padding:0; border-radius:0; }
          .topGrid{ gap:8px; }
          .sectionCard{
            border:none;
            border-radius:0;
            padding:12px;
            margin:0;
            box-shadow:none;
          }
          .addSessionBtn{ width:100%; }

          /* 모달 */
          .modalBackdrop{
            position:fixed; inset:0; background:rgba(0,0,0,.4);
            display:flex; align-items:center; justify-content:center; z-index:1000;
          }
          .modalPanel{
            width: min(92vw, 560px);
            max-height: 86vh;
            background:#fff; border-radius:12px; padding:16px;
            overflow:auto;
          }
          .modalTitle{ margin:0 0 12px; font-size:16px; font-weight:700; }
          .modalActions{ display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }

          /* 스케줄 그리드가 너무 빽빽하면 두 줄 배치 */
          .scheduleGrid{
            grid-template-columns:minmax(0,1fr) auto;
            row-gap:10px;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
