// pages/admin/schedules/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import TiptapEditor from "@/components/editor/TiptapEditor";
export default function ScheduleFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = id !== "new";

  const formatDateTimeLocal = (str) => {
    if (!str) return "";
    return str.replace(" ", "T").slice(0, 16);
  };

  const [form, setForm] = useState({
    product_id: "",
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    instructor: "",
    description: "",
    total_spots: 0,
    price: 0,
    detail: "", // ✅ 추가
    image_url: "", // ✅ 여기에 꼭 추가되어야 저장됨
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(""); // 일정 썸네일 초기값 기억용

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
        if (res.data.success) {
          const data = res.data.schedule;
          setForm({
            ...data,
            start_date: formatDateTimeLocal(data.start_date),
            end_date: formatDateTimeLocal(data.end_date),
            total_spots: Number(data.total_spots) || 0,
            price: Number(data.price) || 0,
            image_url: data.image_url || "", // ✅ 이거 꼭 추가되어야 저장 가능
          });
        } else {
          alert("일정 정보를 불러오지 못했습니다.");
        }
      })
      .catch(() => alert("일정 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsed =
      type === "number" ? (value === "" ? "" : Number(value)) : value;

    if (name === "product_id") {
      const selected = products.find((p) => p.id === Number(value));
      setForm((prev) => ({
        ...prev,
        [name]: parsed,
        title: selected?.title || "",
        price: selected?.price ?? 0,
        description: selected?.description || "",
        detail: selected?.detail || "",
        image_url: selected?.image_url || "",
      }));
      setOriginalImageUrl(selected?.image_url || "");
    } else {
      // ✅ 일반 필드 처리 추가
      setForm((prev) => ({
        ...prev,
        [name]: parsed,
      }));
    }
  };

  const validate = () => {
    if (!form.title) return "일정명을 입력하세요.";
    if (!form.product_id) return "상품을 선택하세요.";
    if (!form.start_date || !form.end_date)
      return "시작일과 종료일을 입력하세요.";
    if (new Date(form.start_date) > new Date(form.end_date))
      return "종료일은 시작일보다 늦어야 합니다.";
    if (form.price === "" || form.price === null || form.price === undefined)
      return "가격을 입력하세요.";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) return alert(error);
    console.log("저장 전 form 확인:", form); // ✅ 여기!
    console.log("📦 저장 요청 payload:", form); // ✅ 여기 추가!!
    try {
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `admin/schedules/${id}` : "admin/schedules";

      const res = await api[method](url, form);
      console.log("📥 서버 응답:", res.data); // ✅ 2. 응답 바로 여기서 확인!!
      if (res.data.success) {
        alert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/schedules");
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
    if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return;
    try {
      const res = await api.delete(`admin/schedules/${id}`);
      if (res.data.success) {
        alert("삭제 완료");
        router.push("admin/schedules");
      } else {
        alert("삭제 실패: " + res.data.message);
      }
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류 발생");
    }
  };

  if (!router.isReady) return null;

  const fieldLabels = {
    title: "일정명",
    start_date: "시작일",
    end_date: "종료일",
    location: "장소",
    instructor: "강사",
    description: "설명",
    total_spots: "정원",
    price: "가격",
  };
  
  
  return (
    <AdminLayout pageTitle={isEdit ? "일정수정" : "일정등록"}>
      <div
        style={{
          width: 960,
          marginLeft: 0,
          marginRight: "auto",
          padding: 32,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 0 12px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <p>⏳ 불러오는 중...</p>
        ) : (
          <>
            {/* 🔁 새 구성: 상품 + 썸네일 + 입력폼 2단 UI */}
            <div style={{ display: "flex", gap: 32 }}>
              {/* ✅ 좌측: 썸네일 영역 전체 */}
              <div
                style={{
                  width: 300,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <label
                  htmlFor="image-upload"
                  style={{
                    width: "100%",
                    height: 300,
                    border: "2px solid #999",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="썸네일"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
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
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setForm((prev) => ({
                          ...prev,
                          image_url: reader.result,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {/* ✅ 썸네일 하단: 변경됨 뱃지 + 초기화 버튼 */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {form.image_url && form.image_url !== originalImageUrl && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#e67e22",
                        fontWeight: "bold",
                        background: "#fdf2e9",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      변경됨
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        image_url: originalImageUrl,
                      }))
                    }
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* ✅ 우측: 입력 폼 */}
              <div style={{ flex: 1 }}>
                {/* 상품 선택 */}
                <div style={{ marginBottom: 16 }}>
                  <label>상품</label>
                  <select
                    name="product_id"
                    value={form.product_id || ""}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="">교육 상품 선택</option>
                    {products
                      .filter((p) => p.category === "교육")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* 일정명 */}
                <div style={{ marginBottom: 16 }}>
                  <label>일정명</label>
                  <input
                    name="title"
                    value={form.title || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    type="text"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      color:
                        products.find((p) => p.id === Number(form.product_id))
                          ?.title === form.title
                          ? "#aaa"
                          : "#000",
                    }}
                  />
                </div>

                {/* 장소 */}
                <div style={{ marginBottom: 16 }}>
                  <label>장소</label>
                  <input
                    name="location"
                    value={form.location || ""}
                    onChange={handleChange}
                    type="text"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* 강사 + 정원 */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label>강사</label>
                    <input
                      name="instructor"
                      value={form.instructor || ""}
                      onChange={handleChange}
                      type="text"
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>정원</label>
                    <input
                      name="total_spots"
                      value={form.total_spots}
                      onChange={handleChange}
                      type="number"
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                {/* 교육기간 */}
                <div style={{ marginBottom: 16 }}>
                  <label>교육기간</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                      type="datetime-local"
                      style={{
                        flex: 1,
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontFamily: "inherit",
                      }}
                    />
                    <span style={{ alignSelf: "center" }}>~</span>
                    <input
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      type="datetime-local"
                      style={{
                        flex: 1,
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

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
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 🔽 여기에 추가 */}
            <div style={{ marginTop: 40 }}>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
              >
                상세설명
              </label>
              <TiptapEditor
                value={form.detail}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, detail: html }))
                }
                height={280}
              />
            </div>

            <hr
              style={{
                margin: "40px 0",
                border: "none",
                borderTop: "1px solid #eee",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 32,
              }}
            >
              <button
                onClick={() => router.push("admin/schedules")}
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
                {isEdit && (
                  <>
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
          </>
        )}
              </div>
    </AdminLayout>
  );
}
