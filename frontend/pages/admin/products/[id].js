import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import { useGlobalAlert } from "@/stores/globalAlert";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false, loading: () => <p>에디터 로딩중…</p> }
);

const CATEGORY_MAP = {
  교육: ["followup", "certification", "opencourse", "facilitation"],
  컨설팅: ["워크숍", "숙의토론", "조직개발"],
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
            image_url: p.image_url ?? "",
            description: p.description ?? "",
            price: typeof p.price === "number" ? p.price : (p.price ?? ""),
            is_active: typeof p.is_active === "number" ? p.is_active : 1,
            created_at: p.created_at ?? "",
            updated_at: p.updated_at ?? "",
          });
          setDetail(p.detail ?? "");
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

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showAlert("이미지 용량이 5MB를 초과합니다.");
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image_url: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }, [showAlert]);

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
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `/admin/products/${pid}` : "/admin/products";
      const payload = {
        ...form,
        detail,
        type: String(form.type).trim(),
        price: form.price === "" ? "" : Number(form.price), // ✅ 숫자 보장
      };
      const res = await api[method](url, payload);
      if (res?.data?.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/products");
      } else {
        showAlert("저장 실패: " + (res?.data?.message || "서버 오류"));
      }
    } catch {
      showAlert("저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [detail, form, isEdit, pid, router, showAlert, validate]);

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

  if (!router.isReady) return null;

  return (
    <AdminLayout pageTitle={isEdit ? "상품수정" : "상품등록"}>
      <div style={mainWrapStyle}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* 썸네일 업로드 */}
          <label htmlFor="image-upload" style={imageBoxStyle}>
            {form.image_url ? (
              <img src={form.image_url} alt="상품 이미지" style={imgStyle} />
            ) : (
              <span style={{ color: "#777", fontSize: 14 }}>[이미지 업로드]</span>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={saving}
            />
          </label>

          {/* 입력 폼 */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {loading ? (
              <p>⏳ 불러오는 중...</p>
            ) : (
              <>
                <div style={fieldStyle}>
                  <label>상품명</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    type="text"
                    style={inputStyle}
                    disabled={saving}
                  />
                </div>

                <div style={fieldStyle}>
                  <label>상품군</label>
                  <select
  name="category"
  value={form.category}
  onChange={(e) => {
    const next = e.target.value;
    setForm((prev) => ({ ...prev, category: next, type: "" })); // ✅ 한 번에 반영
  }}
  style={inputStyle}
  disabled={saving}
>

                    <option value="">선택하세요</option>
                    {Object.keys(CATEGORY_MAP).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {form.category && (
                  <div style={fieldStyle}>
                    <label>세부유형</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      style={inputStyle}
                      disabled={saving}
                    >
                      <option value="">선택하세요</option>
                      {subtypeOptions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={fieldStyle}>
                  <label>가격</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    min={0}
                    style={inputStyle}
                    disabled={saving}
                  />
                </div>

                <div style={fieldStyle}>
                  <label>간단 설명</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    type="text"
                    style={inputStyle}
                    disabled={saving}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 상세 설명(에디터) */}
        <div style={{ marginTop: 40 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            상세설명
          </label>
          {!loading && (
            <TiptapEditor
              key={pid || "new"}
              value={detail}
              onChange={setDetail}
              height={280}
              uploadEndpoint="/upload/images" // 서버 업로드 경로에 맞게 조정 가능
            />
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={buttonBarStyle}>
          <button onClick={() => router.push("/admin/products")} style={grayButtonStyle} disabled={saving}>
            목록으로
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} style={grayButtonStyle} disabled={saving}>초기화</button>
            {isEdit && (
              <button onClick={handleDelete} style={redButtonStyle} disabled={saving}>삭제</button>
            )}
            <button onClick={handleSave} style={blueButtonStyle} disabled={saving}>
              {isEdit ? "수정" : "등록"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ===== 스타일 ===== */
const mainWrapStyle = {
  maxWidth: 960,
  margin: "0 auto",
  padding: 32,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 0 12px rgba(0,0,0,0.05)",
};

const imageBoxStyle = {
  width: 300,
  height: 300,
  border: "2px solid #999",
  borderRadius: 8,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  cursor: "pointer",
};

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const fieldStyle = { marginBottom: 16 };

const inputStyle = {
  width: "100%",
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
};

const buttonBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 32,
  flexWrap: "wrap",
};

const grayButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#eee",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: 6,
};

const blueButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const redButtonStyle = {
  padding: "10px 16px",
  backgroundColor: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};
