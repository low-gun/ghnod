// frontend/pages/admin/products/[id].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";

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
  교육: ["followup", "certification", "opencourse", "facilitation"],
  컨설팅: ["워크숍", "공론화", "조직개발"],
  진단: ["Hogan", "TAI리더십", "조직건강도", "RNP", "팀효과성"],
};

const INITIAL_FORM = {
  title: "",
  category: "",
  type: "",
  image_url: "",
  description: "",
  price: "",
  is_active: 1,
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
            price: typeof p.price === "number" ? p.price : (p.price ?? ""),
            is_active: typeof p.is_active === "number" ? p.is_active : 1,
            created_at: p.created_at ?? "",
            updated_at: p.updated_at ?? "",
          });
          
          setDetail(p.detail ?? "");
          
          // ✅ 원본 상태도 동일하게 보관(이후 diff 기반 전송에 사용)
          setOrigForm({
            title: p.title ?? "",
            category: p.category ?? "",
            type: p.type ?? "",
            image_url: isDataUrl(p.image_url) ? "" : (p.image_url ?? ""),
            description: p.description ?? "",
            price: typeof p.price === "number" ? p.price : (p.price ?? ""),
            is_active: typeof p.is_active === "number" ? p.is_active : 1,
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

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  }, []);

  const validate = useCallback(() => {
    if (!form.title?.trim()) return "상품명을 입력하세요.";
    if (!form.category) return "상품군을 선택하세요.";
    if (!form.type) return "세부유형을 선택하세요.";
    return null;
  }, [form.title, form.category, form.type]);

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
      const keysToCheck = ["title","category","type","description","price","is_active","image_url"];
      keysToCheck.forEach((k) => {
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
                  <FormField label="상품명">
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="input"
                      disabled={saving}
                    />
                  </FormField>

                  <FormField label="상품군">
                    <select
                      name="category"
                      value={form.category}
                      onChange={(e) => {
                        const next = e.target.value;
                        setForm((prev) => ({ ...prev, category: next, type: "" }));
                      }}
                      className="input"
                      disabled={saving}
                    >
                      <option value="">선택하세요</option>
                      {Object.keys(CATEGORY_MAP).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {form.category && (
                    <FormField label="세부유형">
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="input"
                        disabled={saving}
                      >
                        <option value="">선택하세요</option>
                        {subtypeOptions.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}

                  <FormField label="가격">
                    <input
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      type="number"
                      min={0}
                      className="input alignRight"
                      disabled={saving}
                    />
                  </FormField>

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
                  uploadEndpoint="/upload/images"
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
