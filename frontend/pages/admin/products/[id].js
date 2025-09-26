// frontend/pages/admin/products/[id].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";
import CreatableSelect from "react-select/creatable";   // ✅ 수정
import Select from "react-select";   // ✅ 상단 추가
// 디자인 공용 컴포넌트 (schedules/[id].js와 동일 UI)
import ImageUploader from "@/components/common/ImageUploader";
import FormSection from "@/components/common/FormSection";
import FormField from "@/components/common/FormField";
import FormFooterBar from "@/components/common/FormFooterBar";
const isDataUrl = (u) => typeof u === "string" && u.startsWith("data:image/");

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false, loading: () => <p>에디터 로딩중…</p> }
);

const CATEGORY_MAP = {
  진단: ["org", "team", "leadership", "individual"],
  조직개발: ["org", "team", "individual"],
  리더십개발: ["assessment", "dcbl", "consulting", "content", "new"],
  공개과정: ["hogan", "assessment", "development", "facilitation", "certification", "ft"],
};

const INITIAL_FORM = {
  title: "",
  category: "",
  type: "",
  image_url: "",
  description: "",
  right_description: "",   // ✅ 추가
  price: "",
  is_active: 1,
  purchase_type: "",   // ✅ 기본값을 비워서 선택 강제
  created_at: "",
  updated_at: "",
};

export default function ProductFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const pid = Array.isArray(id) ? id[0] : id;
  const isEdit = !!pid && pid !== "new";
  const { showAlert } = useGlobalAlert();

  const [form, setForm] = useState(INITIAL_FORM);
const [detail, setDetail] = useState("");
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);

// ✅ 변경 감지를 위한 원본 상태 보관
const [origForm, setOrigForm] = useState(INITIAL_FORM);
const [origDetail, setOrigDetail] = useState("");

// ✅ 가격 포맷 함수 & 상태
const fmtKRW = (n) => {
  if (n === "" || n === null || n === undefined) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("ko-KR");
};
const [priceInput, setPriceInput] = useState("");

// ✅ form.price → priceInput 동기화
useEffect(() => {
  setPriceInput(fmtKRW(form.price));
}, [form.price]);

// ✅ handleChange 수정 (기존 handleChange 교체)
const handleChange = useCallback((e) => {
  const { name, value, type } = e.target;
  if (name === "price") {
    const digits = value.replace(/[^0-9]/g, "");
    setPriceInput(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    setForm((prev) => ({
      ...prev,
      price: digits === "" ? "" : Number(digits),
    }));
    return;
  }
  setForm((prev) => ({
    ...prev,
    [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
  }));
}, []);

  const subtypeOptions = useMemo(
    () => (form.category ? CATEGORY_MAP[form.category] ?? [] : []),
    [form.category]
  );

  // 로드
  useEffect(() => {
    if (!router.isReady || !isEdit || !pid) return;
    const ctrl = new AbortController();
    let active = true;
    setLoading(true);
    api
      .get(`/admin/products/${pid}`, { signal: ctrl.signal })
      .then((res) => {
        if (!active) return;
        if (res?.data?.success && res?.data?.product) {
          const p = res.data.product;
          setForm({
            title: p.title ?? "",
            category: p.category ?? "",
            type: p.type ?? "",
            image_url: isDataUrl(p.image_url) ? "" : (p.image_url ?? ""),
            description: p.description ?? "",
            right_description: p.right_description ?? "",
            price: typeof p.price === "number" ? p.price : (p.price ?? ""),
            is_active: typeof p.is_active === "number" ? p.is_active : 1,
            purchase_type: p.purchase_type ?? "",
            created_at: p.created_at ?? "",
            updated_at: p.updated_at ?? "",
            tags: Array.isArray(p.tags) ? p.tags : [],   // ✅ 추가
          });
          
          setDetail(p.detail ?? "");
          
          // ✅ 원본 상태도 동일하게 보관(이후 diff 기반 전송에 사용)
          setOrigForm({
            title: p.title ?? "",
            category: p.category ?? "",
            type: p.type ?? "",
            image_url: isDataUrl(p.image_url) ? "" : (p.image_url ?? ""),
            description: p.description ?? "",
            right_description: p.right_description ?? "",   // ✅ 추가
            price: typeof p.price === "number" ? p.price : (p.price ?? ""),
            is_active: typeof p.is_active === "number" ? p.is_active : 1,
            purchase_type: p.purchase_type ?? "",   // ✅ 추가
            created_at: p.created_at ?? "",
            updated_at: p.updated_at ?? "",
          });
          
          setOrigDetail(p.detail ?? "");
          
        } else {
          showAlert("상품 정보를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        showAlert("상품 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, pid, isEdit]);

  const validate = useCallback(() => {
    if (!form.title?.trim()) return "상품명을 입력하세요.";
    if (!form.category) return "상품군을 선택하세요.";
    if (!form.type) return "세부유형을 선택하세요.";
    if (!form.purchase_type) return "구매형태를 선택하세요.";  // ✅ 추가
    return null;
  }, [form.title, form.category, form.type, form.purchase_type]); 

  const handleSave = useCallback(async () => {
    const msg = validate();
    if (msg) return showAlert(msg);
    setSaving(true);
    try {
      // ✅ 수정 시 PATCH, 신규 등록 시 POST
      const method = isEdit ? "patch" : "post";
      const url = isEdit ? `/admin/products/${pid}` : "/admin/products";
  
      // ✅ 변경된 필드만 추출
      const changed = {};
      const keysToCheck = [
        "title","category","type","description","right_description",
        "price","is_active","image_url","purchase_type","tags"
      ];      keysToCheck.forEach((k) => {
        const prev = origForm[k];
        const next = form[k];
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          changed[k] = next;
        }
      });
      if (origDetail !== detail) {
        changed.detail = detail;
      }
  
      // 변경 없으면 종료
      if (Object.keys(changed).length === 0) {
        setSaving(false);
        return showAlert("변경된 내용이 없습니다.");
      }
  
      // 숫자 필드 보정
      if ("price" in changed) {
        changed.price = changed.price === "" ? "" : Number(changed.price);
      }
      if ("type" in changed) {
        changed.type = String(changed.type || "").trim();
      }
  
      // ✅ 이미지가 dataURL로 변경된 경우에만 업로드
      if ("image_url" in changed && typeof changed.image_url === "string" && changed.image_url.startsWith("data:image/")) {
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
        fd.append("files", dataURLtoBlob(changed.image_url), "product.png");
        const uploadRes = await api.post("upload/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        const uploaded = uploadRes?.data?.urls?.[0]?.original || null;
        if (!uploaded) {
          setSaving(false);
          return showAlert("이미지 업로드에 실패했습니다.");
        }
        changed.image_url = uploaded;
      }
  
      console.log("[PRODUCT CHANGED PAYLOAD]", changed);
  
      // ✅ 변경된 필드만 전송
      const res = await api[method](url, changed);
      if (res?.data?.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        // 성공 시 원본 상태 동기화
        setOrigForm((prev) => ({ ...prev, ...changed }));
        if ("detail" in changed) setOrigDetail(changed.detail);
        router.push("/admin/products");
      } else {
        showAlert("저장 실패: " + (res?.data?.message || "서버 오류"));
      }
    } catch {
      showAlert("저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [detail, form, isEdit, origDetail, origForm, pid, router, showAlert, validate]);  

  const handleDelete = useCallback(async () => {
    if (!isEdit || !pid) return;
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      const res = await api.delete(`/admin/products/${pid}`);
      if (res?.data?.success) {
        showAlert("삭제완료");
        router.push("/admin/products");
      } else {
        showAlert("삭제실패: " + (res?.data?.message || "서버 오류"));
      }
    } catch {
      showAlert("삭제 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [isEdit, pid, router, showAlert]);

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setDetail("");
  }, []);

  const isInvalid = !form.title?.trim() || !form.category || !form.type;

  if (!router.isReady) return null;

  return (
    <AdminLayout pageTitle={isEdit ? "상품수정" : "상품등록"}>
      <div className="container">
        {loading ? (
          <p>⏳ 불러오는 중...</p>
        ) : (
          <>
            {/* 1단: 좌(상품 정보) | 우(썸네일) */}
            <div className="topGrid">
              <FormSection title="상품 정보" className="twoColSection">
                <div className="stack">
                <FormField label={<span>상품명 <span style={{ color: "#e74c3c" }}>*</span></span>}>
  <input
    name="title"
    value={form.title}
    onChange={handleChange}
    className="input"
    disabled={saving}
  />
</FormField>
<FormField label={<span>상품유형 <span style={{ color: "#e74c3c" }}>*</span></span>}>
  <Select
    value={form.category ? { value: form.category, label: form.category } : null}
    onChange={(opt) => {
      const next = opt?.value || "";
      setForm((prev) => ({ ...prev, category: next, type: "", purchase_type: "" }));
    }}
    options={Object.keys(CATEGORY_MAP).map((cat) => ({ value: cat, label: cat }))}
    placeholder="선택하세요"
    classNamePrefix="react-select"
    isDisabled={saving}
    isClearable
  />
</FormField>

{form.category && (
  <FormField label={<span>세부유형 <span style={{ color: "#e74c3c" }}>*</span></span>}>
  <Select
    value={form.type ? { value: form.type, label: form.type } : null}
      onChange={(opt) => {
        const next = opt?.value || "";
        setForm((prev) => ({ ...prev, type: next, purchase_type: "" }));
      }}
      options={subtypeOptions.map((sub) => ({ value: sub, label: sub }))}
      placeholder="선택하세요"
      classNamePrefix="react-select"
      isDisabled={saving}
      isClearable
    />
  </FormField>
)}

{form.type && (
  <FormField label={<span>구매형태 <span style={{ color: "#e74c3c" }}>*</span></span>}>
  <Select
      value={
        form.purchase_type
          ? { value: form.purchase_type, label: form.purchase_type === "buy" ? "구매형" : "문의형" }
          : null
      }
      onChange={(opt) => setForm((prev) => ({ ...prev, purchase_type: opt?.value || "" }))}
      options={[
        { value: "buy", label: "구매형" },
        { value: "inquiry", label: "문의형" },
      ]}
      placeholder="선택하세요"
      classNamePrefix="react-select"
      isDisabled={saving}
      isClearable
    />
  </FormField>
)}
{/* ✅ 구매형태가 'buy'일 때만 가격 입력 노출 */}
{form.purchase_type === "buy" && (
  <FormField label={<span>가격 <span style={{ color: "#e74c3c" }}>*</span></span>}>
  <input
    name="price"
    value={priceInput}
    onChange={handleChange}
    className="input alignRight"
    placeholder="숫자만 입력(쉼표 자동)"
    disabled={saving}
  />
</FormField>
)}
    <FormField label="태그">
  <CreatableSelect
    isMulti
    value={(form.tags || []).map((t) => ({ value: t, label: t }))}
    onChange={(selected) =>
      setForm((prev) => ({
        ...prev,
        tags: (selected || []).map((opt) => opt.value),
      }))
    }
    options={[
      { value: "컨설팅", label: "컨설팅" },
      { value: "워크숍", label: "워크숍" },
      { value: "교육", label: "교육" },
      { value: "코칭", label: "코칭" },
      { value: "진단기반", label: "진단기반" },
      { value: "프로그램", label: "프로그램" },
    ]}
    placeholder="태그를 입력하거나 선택하세요"
    className="react-select-container"
    classNamePrefix="react-select"
    isDisabled={saving}
    isClearable={false}
  />
</FormField>
                  {/* ✅ 구매형: 간단 설명 */}
{form.purchase_type === "buy" && (
  <FormField
    label="간단 설명"
    helper={`${String(form.description || "").length}/120`}
    helperAlign="right"
  >
    <input
      name="description"
      value={form.description}
      onChange={handleChange}
      className="input"
      disabled={saving}
      maxLength={120}
      placeholder="목록/요약에 노출될 짧은 설명 (최대 120자)"
    />
  </FormField>
)}

{/* ✅ 문의형: 우측 설명 */}
{form.purchase_type === "inquiry" && (
  <FormField label="우측 설명">
    <TiptapEditor
      value={form.right_description || ""}
      onChange={(html) => setForm((prev) => ({ ...prev, right_description: html }))}
      height={200}
      uploadEndpoint="/upload/image"
    />
  </FormField>
)}              
                </div>
              </FormSection>

              <div className="thumbCol">
                <FormSection title="썸네일">
                  <ImageUploader
                    value={form.image_url}
                    aspectRatio="1/1"
                    onChange={(dataUrl) =>
                      setForm((prev) => ({ ...prev, image_url: String(dataUrl || "") }))
                    }
                    onReset={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                    maxSizeMB={5}
                    disabled={saving}
                  />
                </FormSection>
              </div>
            </div>

            {/* 2단: 상세 설명 */}
            <FormSection title="상세 설명">
              {!loading && (
                <TiptapEditor
                  key={pid || "new"}
                  value={detail}
                  onChange={setDetail}
                  height={280}
                  uploadEndpoint="/upload/image"
                />
              )}
            </FormSection>

            {/* 하단 버튼 공용 바 (디자인 통일) */}
            <FormFooterBar
              onList={() => router.push("/admin/products")}
              onDelete={handleDelete}
              onSave={handleSave}
              isEdit={isEdit}
              saveDisabled={saving || isInvalid}
            />
          </>
        )}
      </div>

      {/* ✅ schedules/[id].js와 동일 톤의 스타일 */}
      <style jsx>{`
        .container { max-width:1080px; margin:auto; padding:32px; background:#fff; border-radius:12px; }
:global(.react-select__control) {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid #d0d5dd;
  font-size: 13px;   /* ✅ 인풋과 동일하게 줄임 */
  background: #fff;
  box-shadow: none;
}
:global(.react-select__single-value) {
  font-size: 13px;   /* ✅ 선택된 값도 동일하게 */
}
:global(.react-select__menu) {
  font-size: 13px;   /* ✅ 드롭다운 항목도 동일하게 */
  z-index: 9999 !important;
}
:global(.react-select__multi-value) {
  background: #eef5ff;
}
:global(.react-select__multi-value__label) {
  color: #0070f3;
  font-size: 12px;
}
:global(.react-select__placeholder) {
  color: #999;
  font-size: 13px;
}
/* ✅ 드롭다운이 에디터보다 위로 나오도록 */
:global(.react-select__menu) {
  z-index: 9999 !important;
}
        /* 1단: 상품정보 | 썸네일 */
        .topGrid{
          display:grid;
          grid-template-columns:1fr 360px; /* 우측 고정폭 */
          gap:24px;
          align-items:start;
        }
        .thumbCol{ width:100%; }

        .sectionCard{ border:1px solid #eee; border-radius:12px; padding:16px; margin-bottom:0; background:#fff; }
        .sectionTitle{ margin:0 0 12px 0; font-size:16px; font-weight:700; }
        .helperText{ color:#666; font-size:12px; margin-top:4px; display:block; }

        .field{ margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
        .fieldGrid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .fieldGrid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }

        /* 라벨 타이포 통일 */
        :global(.field > label){ color:#555; font-size:13px; line-height:1; }

        /* 인풋 룩 통일 */
        .input{
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

        /* 상품정보/간격 통일: schedules와 동일 */
        .twoColSection { --gapY:12px; }
        .twoColSection .stack { display:grid; row-gap:var(--gapY); }
        .twoColSection .stack :global(.field) { margin:0; gap:6px; }
        .twoColSection :global(.helperText) { margin-top:0; }

        /* 반응형 */
        @media (min-width:1280px){
          .topGrid{ grid-template-columns:1fr 380px; }
        }
        @media (max-width:900px){
          .topGrid{ grid-template-columns:1fr; }
          .fieldGrid2{ grid-template-columns:1fr; }
        }
      `}</style>
    </AdminLayout>
  );
}
