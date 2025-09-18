// frontend/pages/admin/schedules/[id].js
// 1) 모든 import를 최상단에 모읍니다.
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import dynamic from "next/dynamic";
import FormSection from "@/components/common/FormSection";
import FormField from "@/components/common/FormField";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
// 2) 그 다음에 dynamic 변수들을 선언합니다.
const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false, loading: () => null }
);
const ImageUploader = dynamic(
  () => import("@/components/common/ImageUploader"),
  { ssr: false, loading: () => null }
);
const SessionRow = dynamic(
  () => import("@/components/admin/SessionRow"),
  { ssr: false, loading: () => null }
);
const FormFooterBar = dynamic(
  () => import("@/components/common/FormFooterBar"),
  { ssr: false, loading: () => null }
);


const fmtKRW = (n) => {
  if (n === "" || n === null || n === undefined) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("ko-KR");
};
export default function ScheduleFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = id !== "new";
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();
  const [editorMounted, setEditorMounted] = useState(false);
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
  });
  
  const [originalForm, setOriginalForm] = useState({});
const [originalSessions, setOriginalSessions] = useState([]); // ✅ 원본 세션 보관
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
        });     
        setOriginalForm(data);
        setPriceInput(fmtKRW(data.price ?? ""));
        setSelectedType(data.product_type || "");   // 초기 세팅

        if (Array.isArray(data.sessions) && data.sessions.length) {
          const norm = data.sessions.map((s) => ({
            id: s.id, // ✅ 유지
            start_date: (s.start_date || s.session_date || "").slice(0, 10),
            end_date:   (s.end_date   || s.session_date || "").slice(0, 10),
            total_spots:
              s.total_spots === null || s.total_spots === undefined
                ? ""
                : String(s.total_spots),
            order_count: s.order_count || 0, // ✅ 안내/비활성화용
          }));
          setSessions(norm);
          setOriginalSessions(norm);
        }
        
        
        
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, showAlert]);
// ✅ products 로드 이후 product_id 기준으로 selectedType 보정
useEffect(() => {
  if (products.length && form.product_id) {
    const selected = products.find(p => p.id === Number(form.product_id));
    if (selected) {
      setSelectedType(selected.type || "");
    }
  }
}, [products, form.product_id]);
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
        product_id: Number(value),
        title: selected?.title || "",
        price: selected?.price ?? "",
        description: selected?.description || "",
        image_url: selected?.image_url || prev.image_url || "", // ✅ 상품 이미지도 세팅
        // detail 은 기존 값 유지
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
      // ✅ 수정 시에는 PATCH 사용, 신규 등록 시에는 POST 사용
      const method = isEdit ? "patch" : "post";
      const url = isEdit ? `admin/schedules/${id}` : "admin/schedules";
  
      // 1) 변경된 필드만 추출
      const changed = {};
      const keysToCheck = [
        "product_id","title","location","instructor",
        "description","total_spots","price","detail",
        "image_url","status"
      ];
      keysToCheck.forEach((k) => {
        const prev = originalForm?.[k];
        const next = form?.[k];
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          changed[k] = next;
        }
      });
  
      // 2) price 숫자 보정
      if ("price" in changed) {
        changed.price =
          typeof changed.price === "string"
            ? Number(changed.price.replace(/,/g, ""))
            : Number(changed.price);
        if (!Number.isFinite(changed.price)) changed.price = 0;
      }
  
      // 3) image_url이 실제 변경되었고 dataURL이면 업로드
      if (
        "image_url" in changed &&
        typeof changed.image_url === "string" &&
        changed.image_url.startsWith("data:image/")
      ) {
        const dataURLtoBlob = (dataURL) => {
          const [meta, b64] = dataURL.split(",");
          const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/png";
          const bin = atob(b64);
          const len = bin.length;
          const u8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
          return new Blob([u8], { type: mime });
        };
        const fd = new FormData();
        fd.append("files", dataURLtoBlob(changed.image_url), "schedule.png");
  
        const uploadRes = await api.post("upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        const uploaded = uploadRes?.data?.urls?.[0]?.original || null;
        if (!uploaded) return showAlert("이미지 업로드에 실패했습니다.");
        changed.image_url = uploaded;
      }
  
      // 4) 세션 변경 여부 판단(정규화 동일 포맷으로 비교)
      const toIntOrNull = (v) => {
        if (v === undefined || v === null) return null;
        if (typeof v === "string" && v.trim() === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const normSessions = sessions.map((s) => ({
        id: s.id || null, // ✅ UPDATE 판단을 위해 포함
        start_date: s.start_date,
        end_date: s.end_date,
        total_spots:
          toIntOrNull(s.total_spots) ??
          toIntOrNull(form.total_spots) ??
          null,
      }));
      
      const normOriginal = originalSessions.map((s) => ({
        id: s.id || null,
        start_date: s.start_date,
        end_date: s.end_date,
        total_spots:
          toIntOrNull(s.total_spots) ??
          toIntOrNull(form.total_spots) ??
          null,
      }));
      
      const sessionsChanged =
        JSON.stringify(normSessions) !== JSON.stringify(normOriginal);
      
      if (sessionsChanged) {
        changed.sessions = normSessions.map((s) => ({
          id: s.id || undefined,      // ✅ 있으면 UPDATE, 없으면 INSERT
          start_date: s.start_date,
          end_date: s.end_date,
          start_time: "00:00",
          end_time: "00:00",
          total_spots: s.total_spots,
        }));
      }
      
  
      // 5) 변경이 하나도 없으면 종료
      if (Object.keys(changed).length === 0) {
        return showAlert("변경된 내용이 없습니다.");
      }
  
      console.log("[SCHEDULE CHANGED PAYLOAD]", changed);
  
      // 6) 변경된 필드만 전송
      const res = await api[method](url, changed);
      if (res?.data?.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/schedules");
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("[save error]", status, data);
      const msg = data?.message || "저장 중 오류 발생";
      const details = Array.isArray(data?.details) ? ` (${data.details.join(", ")})` : "";
      showAlert(`${msg}${details}`);
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
              <FormSection title={
  <>
    일정 정보
    {Array.isArray(sessions) && sessions.some(s => s.order_count > 0) && (
      <span style={{ color: "red", marginLeft: "8px", fontSize: "13px" }}>
        결제된 건이 {sessions.filter(s => s.order_count > 0).length}건 있습니다.
      </span>
    )}
  </>
}>                 <div className="fieldGrid2">
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
  className={`input alignRight ${Array.isArray(sessions) && sessions.some(s => s.order_count > 0) ? "disabledInput" : ""}`}
  placeholder="숫자만 입력(쉼표 자동)"
  disabled={Array.isArray(sessions) && sessions.some(s => s.order_count > 0)}
/>

</FormField>

                </div>
              </FormSection>

              <FormSection title={
  <>
    스케줄
    {Array.isArray(sessions) && sessions.some(s => s.order_count > 0) && (
      <span style={{ color: "red", marginLeft: "8px", fontSize: "13px" }}>
        결제된 건이 {sessions.filter(s => s.order_count > 0).length}건 있습니다.
      </span>
    )}
  </>
}>
  <div className="scheduleWrap"> {/* ✅ 가로 스크롤 래퍼 추가 */}
    <div className="scheduleGrid">
      <div className="hdr">시작일</div><div className="spacer" aria-hidden="true"></div>
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
          setSessions((prev) => prev.map((x, ii) => (ii === i ? next : x)))
        }
        onRemove={resetSession}
        placeholderTotalSpots={form.total_spots || ""}
        disabledDates={s.order_count > 0}   // ✅ 결제건이 있으면 날짜 인풋 비활성화
      />
      
      ))}
    </div>
  </div>

  <button
    className="addSessionBtn"
    onClick={() =>
      setSessions((p) => [
        ...p,
        { start_date: "", end_date: "", total_spots: form.total_spots || "" },
      ])
    }
  >
    + 회차 추가
  </button>
</FormSection>

            </div>

            <FormSection title="상세 설명">
  {!editorMounted ? (
    <button className="btnPrimary" onClick={() => setEditorMounted(true)}>
      에디터 열기
    </button>
  ) : (
    <TiptapEditor
      value={form.detail}
      onChange={(html) => setForm((p) => ({ ...p, detail: html }))}
      height={280}
    />
  )}
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
  grid-template-columns:repeat(2, minmax(0,1fr)); /* ✅ 2등분 */
  gap:24px;
  align-items:stretch;
}
  @media (max-width:980px){
    .topGrid{ grid-template-columns:1fr; gap:12px; }
    .thumbCol{ order:2; }
  }

  .thumbCol{ width:100%; }
  .thumbCol :global(.sectionCard){
    height:auto; display:flex; flex-direction:column; align-items:flex-start;
  }
  .thumbCol :global(.sectionTitle){ text-align:left; width:100%; }
  .thumbBox{ width:clamp(160px, 26vw, 260px); max-width:100%; }

  .addSessionBtn {
    margin-top:14px;
    background:#0070f3; color:#fff;
    border:none; border-radius:8px;
    padding:10px 16px;
    font-weight:500; cursor:pointer;
    transition:background 0.2s ease;
  }
  .addSessionBtn:hover { background:#0059c1; }

  .sectionCard{ border:1px solid #eee; border-radius:12px; padding:16px; margin-bottom:0; background:#fff; }
  .sectionTitle{ margin:0 0 12px 0; font-size:16px; font-weight:700; }
  .helperText{ color:#666; font-size:12px; margin-top:4px; display:block; }

  .field{ margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
  .fieldGrid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .fieldGrid2{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:16px; }
  @media (max-width:980px){ .fieldGrid2{ grid-template-columns:1fr; gap:12px; } }

  .scheduleGrid .hdr{ color:#555; font-size:13px; line-height:1; }

  .input{
    width:100%; box-sizing:border-box;
    height:44px; line-height:1.2;
    padding:12px 14px;
    border:1px solid #d0d5dd; border-radius:10px;
    font-size:14px; background:#fff;
    transition:border-color .15s ease, box-shadow .15s ease;
  }
  .input:focus{ outline:none; border-color:#0070f3; box-shadow:0 0 0 3px rgba(0,112,243,.15); }
  .alignRight{ text-align:right; }
  .inputUnchanged{ color:#999; }

  /* 스케줄: 헤더/행 그리드 (데스크톱 기본) */
  .scheduleGrid{
    display:grid;
    grid-template-columns:
      minmax(140px,1fr) 20px minmax(140px,1fr) minmax(100px,140px) 32px;
    column-gap:12px; row-gap:24px;
    align-items:start; margin-bottom:8px;
  }
  .spacer{ width:20px; }

  @media (max-width:1100px){
    .scheduleGrid{
      grid-template-columns:
        minmax(120px,1fr) 16px minmax(120px,1fr) minmax(80px,120px) 32px;
    }
    .spacer{ width:16px; }
  }

  @media (max-width:980px){
    .scheduleGrid{
      grid-template-columns:minmax(120px,1fr) minmax(120px,1fr) minmax(80px,120px) 32px;
      column-gap:8px; row-gap:12px;
    }
    .tilde{ display:none; }
    .spacer{ display:none; }
  }

  .sessionRow{ display:contents; }
  .sessionRow .cell{ display:flex; flex-direction:column; gap:6px; }
  .sessionRow .fieldError{
    color:#e74c3c; font-size:12px; line-height:1.2;
    min-height:18px; display:block;
  }
  /* 입력 높이(44px)만큼의 상자 안에서 정확히 중앙 정렬 */
.tilde{
  color:#9aa0a6;
  user-select:none;
  align-self:start;         /* 셀 맨 위에 배치 */
  height:44px;              /* 입력과 동일 높이 */
  display:flex;             /* 박스 중앙정렬 */
  align-items:center;
  justify-content:center;
  padding:0 4px;
  line-height:1;
}
  .scheduleGrid :global(input[type="date"].input){
    min-width:0; height:44px;
    padding:10px 12px; font-size:13px;
    border:1px solid #d0d5dd; border-radius:10px;
    box-sizing:border-box; background:#fff;
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
/* 입력과 같은 높이의 박스를 셀 맨 위에 붙이고 그 안에서 중앙정렬 */
.btnIcon{
  background:#fff; border:1px solid #ccc; border-radius:8px; cursor:pointer;
  height:44px; width:28px;
  display:flex; align-items:center; justify-content:center;
  align-self:start;         /* 셀 맨 위에 붙임(입력과 수평선 일치) */
}


  .footerBar{ margin-top:28px; display:flex; justify-content:space-between; gap:12px; }
.topGrid > :global(.sectionCard) { width:100%; }
  
  @media (max-width:640px){
  .container{ padding:0; border-radius:0; }
  .topGrid{ gap:8px; }
  .sectionCard{ border:none; border-radius:0; padding:12px; margin:0; box-shadow:none; }
  .addSessionBtn{ width:100%; }

  /* 스케줄: 데스크탑과 동일한 열 구성 유지 (spacer 포함) */
  .scheduleWrap{ overflow-x:visible; } /* 필요 시 auto 로 변경 가능 */
  .scheduleGrid{
    grid-template-columns:
      minmax(120px,1fr) 12px minmax(120px,1fr) minmax(80px,120px) 28px;
    column-gap:8px; row-gap:10px;
  }
  .spacer{ display:block; width:12px; } /* 980px 규칙에서 숨긴 것을 모바일에선 복원 */
}

.disabledInput{ background:#f5f5f5; color:#999; cursor:not-allowed; }

`}</style>

    </AdminLayout>
  );
}
