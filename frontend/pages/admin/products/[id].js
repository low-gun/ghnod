import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor"),
  { ssr: false, loading: () => <p>에디터 로딩중…</p> }
);
import { useGlobalAlert } from "@/stores/globalAlert";

export default function ProductFormPage() {
  const router = useRouter();
  const { id } = router.query;
const pid = Array.isArray(id) ? id[0] : id; // ✅ id가 배열/undefined인 경우 대비
const isEdit = !!pid && pid !== "new";      // ✅ 준비 완료 + new가 아닐 때만 편집모드

  const categoryMap = {
    교육: ["followup", "certification", "opencourse", "facilitation"],
    컨설팅: ["워크숍", "숙의토론", "조직개발"],
    진단: ["Hogan", "TAI리더십", "조직건강도", "RNP", "팀효과성"],
  };
  const { showAlert } = useGlobalAlert();

  const initialForm = {
    title: "",
    category: "",
    type: "",
    image_url: "",
    description: "",
    detail: "",
    price: "",
    is_active: 1,
    created_at: "",
    updated_at: "",
  };
  const [form, setForm] = useState(initialForm);
const [detail, setDetail] = useState(""); // ✅ 추가
const [loading, setLoading] = useState(false);


  // 상품 데이터 불러오기(수정일 때만)
  useEffect(() => {
    if (!isEdit || !pid) return;
  
    const ctrl = new AbortController(); // ✅ 요청 취소용
    let active = true;                  // ✅ 언마운트 가드
  
    setLoading(true);
    api
      .get(`/admin/products/${pid}`, { signal: ctrl.signal }) // ✅ signal 전달
      .then((res) => {
        if (!active) return;
        if (res.data.success) {
          setForm(res.data.product);
          setDetail(res.data.product?.detail || "");
        } else {
          showAlert("상품 정보를 불러오지 못했습니다.");
        }
      })
      .catch((err) => {
        // ✅ 경로 변경/언마운트로 취소된 경우는 무시
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        showAlert("상품 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
  
    return () => {
      active = false;
      ctrl.abort(); // ✅ 언마운트 시 요청 중단
    };
  }, [pid, isEdit, showAlert]);
  

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // 이미지 업로드 핸들러(썸네일)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 유효성 검사
  const validate = () => {
    if (!form.title) return "상품명을 입력하세요.";
    if (!form.category) return "상품군을 선택하세요.";
    if (!form.type) return "세부유형을 입력하세요.";
    return null;
  };

  // 저장
  const handleSave = async () => {
    const error = validate();
    if (error) return showAlert(error);
    try {
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `/admin/products/${pid}` : "/admin/products";
      const cleanForm = { ...form, detail, type: String(form.type).trim() }; // ✅ detail 반영
      const res = await api[method](url, cleanForm);
      if (res.data.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/products");
      } else {
        showAlert("저장 실패: " + res.data.message);
      }
    } catch (err) {
      showAlert("저장 중 오류 발생");
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!isEdit || !pid) return;
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;
    try {
      const res = await api.delete(`/admin/products/${pid}`);
      if (res.data.success) {
        showAlert("삭제완료");
        router.push("/admin/products");
      } else {
        showAlert("삭제실패: " + res.data.message);
      }
    } catch (err) {
      showAlert("삭제 중 오류 발생");
    }
  };

  // 입력값 초기화
  const handleReset = () => {
    setForm(initialForm);
    setDetail(""); // ✅ 추가
  };
  if (!router.isReady) return null;

  return (
    <AdminLayout pageTitle={isEdit ? "상품수정" : "상품등록"}>
      <div style={mainWrapStyle}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* 이미지 업로드 */}
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
            />
          </label>

          {/* 입력 폼 */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {loading ? (
              <p>⏳ 불러오는 중...</p>
            ) : (
              <>
                {/* 상품명 */}
                <div style={fieldStyle}>
                  <label>상품명</label>
                  <input
                    name="title"
                    value={form.title || ""}
                    onChange={handleChange}
                    type="text"
                    style={inputStyle}
                  />
                </div>
                {/* 상품군 */}
                <div style={fieldStyle}>
                  <label>상품군</label>
                  <select
                    name="category"
                    value={form.category || ""}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">선택하세요</option>
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {/* 세부유형 */}
                {form.category && (
                  <div style={fieldStyle}>
                    <label>세부유형</label>
                    <select
                      name="type"
                      value={form.type || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="">선택하세요</option>
                      {categoryMap[form.category]?.map((subtype) => (
                        <option key={subtype} value={subtype}>
                          {subtype}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* 가격 */}
                <div style={fieldStyle}>
                  <label>가격</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    min={0}
                    style={inputStyle}
                  />
                </div>
                {/* 간단 설명 */}
                <div style={fieldStyle}>
                  <label>간단 설명</label>
                  <input
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    type="text"
                    style={inputStyle}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 상세 설명 */}
        <div style={{ marginTop: 40 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            상세설명
          </label>
          {!loading && (
            <TiptapEditor
  key={pid || "new"} // 라우트 전환 시 에디터 강제 리마운트
    value={detail}
    onChange={(html) => setDetail(html)}
    height={280}
  />
)}


        </div>

        {/* 하단 버튼 */}
        <div style={buttonBarStyle}>
          <button onClick={() => router.push("/admin/products")} style={grayButtonStyle}>
            목록으로
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} style={grayButtonStyle}>초기화</button>
            {isEdit && (
              <button onClick={handleDelete} style={redButtonStyle}>삭제</button>
            )}
            <button onClick={handleSave} style={blueButtonStyle}>저장</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// 스타일 상수
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
