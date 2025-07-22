// pages/admin/products/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import TiptapEditor from "@/components/editor/TiptapEditor";
export default function ProductFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = id !== "new";
  const categoryMap = {
    교육: ["followup", "certification", "opencourse", "facilitation"],
    컨설팅: ["워크숍", "숙의토론", "조직개발"],
    진단: ["Hogan", "TAI리더십", "조직건강도", "RNP", "팀효과성"],
  };
  // ✅ 여기!
  const initialForm = {
    title: "",
    category: "", // ✅ 추가
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get(`/admin/products/${id}`)
      .then((res) => {
        if (res.data.success) {
          setForm(res.data.product);
        } else {
          alert("상품 정보를 불러오지 못했습니다.");
        }
      })
      .catch(() => alert("상품 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsed = type === "number" ? Number(value) : value;
    setForm((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!form.title) return "상품명을 입력하세요.";
    if (!form.category) return "상품군을 선택하세요.";
    if (!form.type) return "세부유형을 입력하세요.";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    console.log("🧨 validate 결과:", error);
    console.log("🧾 form.type =", form.type);
    if (error) return alert(error);

    try {
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `/admin/products/${id}` : "/admin/products";
      const cleanForm = {
        ...form,
        type: String(form.type).trim(), // ✅ type을 무조건 문자열로 변환
      };
      console.log("🟡 cleanForm 전체:", cleanForm);
      console.log("🟡 typeof cleanForm.type:", typeof cleanForm.type);
      console.log("🟡 cleanForm.type 길이:", cleanForm.type.length);
      const res = await api[method](url, cleanForm);
      console.log("🧾 type 값:", cleanForm.type);
      console.log("🧾 type 길이:", cleanForm.type.length);
      if (res.data.success) {
        alert(isEdit ? "수정 완료!" : "등록 완료!");

        // 상품군에 따라 이동 경로 분기
        router.push("/admin/products");
      } else {
        alert("저장 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("저장 오류:", err);
      alert("저장 중 오류 발생");
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;
    try {
      const res = await api.delete(`/admin/products/${id}`);
      if (res.data.success) {
        alert("삭제 완료");
        router.push("/admin/products");
      } else {
        alert("삭제 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류 발생");
    }
  };

  if (!router.isReady) return null;

  return (
    <AdminLayout pageTitle={isEdit ? "상품수정" : "상품등록"}>
      <div style={{ maxWidth: 960, margin: "0", padding: 32 }}>
        <div style={{ display: "flex", gap: 32 }}>
          {/* 이미지 업로드 영역 */}
          <label
            htmlFor="image-upload"
            style={{
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
            }}
          >
            {form.image_url ? (
              <img
                src={form.image_url}
                alt="상품 이미지"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#777", fontSize: 14 }}>
                [이미지 업로드]
              </span>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </label>

          {/* 정보 입력 폼 */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <p>⏳ 불러오는 중...</p>
            ) : (
              <>
                {/* 상품명 */}
                <div style={{ marginBottom: 16 }}>
                  <label>상품명</label>
                  <input
                    name="title"
                    value={form.title || ""}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  />
                </div>

                {/* 상품군 (category) */}
                <div style={{ marginBottom: 16 }}>
                  <label>상품군</label>
                  <select
                    name="category"
                    value={form.category || ""}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  >
                    <option value="">선택하세요</option>
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 세부유형 (type) */}
                {form.category && (
                  <div style={{ marginBottom: 16 }}>
                    <label>세부유형</label>
                    <select
                      name="type"
                      value={form.type || ""}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                      }}
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
                <div style={{ marginBottom: 16 }}>
                  <label>가격</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  />
                </div>

                {/* 간단 설명 */}
                <div style={{ marginBottom: 16 }}>
                  <label>간단 설명</label>
                  <input
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 상세 설명 에디터 */}
        <div style={{ marginTop: 40 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            상세설명
          </label>
          <TiptapEditor
            value={form.detail}
            onChange={(html) => setForm((prev) => ({ ...prev, detail: html }))}
            height={280}
          />
        </div>

        {/* 하단 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 32,
          }}
        >
          <button
            onClick={() => router.push("/admin/products")}
            style={{
              padding: "10px 16px",
              backgroundColor: "#eee",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            목록으로
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {isEdit ? (
              <>
                <button
                  onClick={() => {
                    if (confirm("내용을 초기화하시겠습니까?")) {
                      setForm(initialForm);
                    }
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#f4f4f4",
                    color: "#333",
                    border: "1px solid #ccc",
                    borderRadius: 6,
                  }}
                >
                  초기화
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    backgroundColor: "#e74c3c",
                    color: "#fff",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: 6,
                  }}
                >
                  삭제
                </button>
              </>
            ) : (
              <button
                onClick={() => setForm((prev) => ({ ...prev, detail: "" }))}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#f4f4f4",
                  color: "#333",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                }}
              >
                초기화
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
