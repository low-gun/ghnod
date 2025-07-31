import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가
import { useGlobalConfirm } from "@/stores/globalConfirm"; // ✅ 추가

export default function ScheduleFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = id !== "new";
  const { showAlert } = useGlobalAlert(); // ✅ 추가
  const { showConfirm } = useGlobalConfirm(); // ✅ 추가
  const [form, setForm] = useState({
    product_id: "",
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    instructor: "",
    description: "",
    total_spots: "",
    price: "",
    detail: "",
    image_url: "",
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState("");

  // 상품 목록 최초 1회만 불러오기
  useEffect(() => {
    api.get("admin/products").then((res) => {
      if (res.data.success) setProducts(res.data.products);
    });
  }, []);

  // 일정 상세 불러오기
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
            start_date: data.start_date?.replace(" ", "T")?.slice(0, 16) || "",
            end_date: data.end_date?.replace(" ", "T")?.slice(0, 16) || "",
            total_spots: data.total_spots ?? "",
            price: data.price ?? "",
            image_url: data.image_url || "",
          });
          setOriginalImageUrl(data.image_url || "");
        } else {
          showAlert("일정 정보를 불러오지 못했습니다.");
        }
      })
      .catch(() => showAlert("일정 정보를 불러오지 못했습니다."))

      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // 폼 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    }
    // 상품 선택 시 관련 필드 자동 채움
    if (name === "product_id") {
      const selected = products.find((p) => p.id === Number(value));
      setForm((prev) => ({
        ...prev,
        [name]: newValue,
        title: selected?.title || "",
        price: selected?.price ?? "",
        description: selected?.description || "",
        detail: selected?.detail || "",
        image_url: selected?.image_url || "",
      }));
      setOriginalImageUrl(selected?.image_url || "");
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  // 유효성 체크
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

  // 저장 처리
  const handleSave = async () => {
    const error = validate();
    if (error) return showAlert(error);
    try {
      const method = isEdit ? "put" : "post";
      const url = isEdit ? `admin/schedules/${id}` : "admin/schedules";
      const payload = { ...form };
      const res = await api[method](url, payload);
      if (res.data.success) {
        showAlert(isEdit ? "수정 완료!" : "등록 완료!");
        router.push("/admin/schedules");
      } else {
        showAlert("저장 실패: " + res.data.message);
      }
    } catch (err) {
      showAlert("저장 중 오류 발생");
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!isEdit || !id) return;
    const ok = await showConfirm("정말로 이 일정을 삭제하시겠습니까?");
    if (!ok) return;
    try {
      const res = await api.delete(`admin/schedules/${id}`);
      if (res.data.success) {
        showAlert("삭제완료");
        router.push("/admin/schedules");
      } else {
        showAlert("삭제실패: " + res.data.message);
      }
    } catch (err) {
      showAlert("삭제 중 오류 발생");
    }
  };
  if (!router.isReady) return null;

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
            {/* 1. 썸네일/업로드 */}
            <div style={{ display: "flex", gap: 32 }}>
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
              {/* 2. 우측 폼 */}
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
                    onChange={handleChange}
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
                    }}
                  />
                </div>
                {/* 강사/정원 */}
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
                      min={0}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "1px solid #ccc",
                        borderRadius: 6,
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
                    min={0}
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ccc",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            </div>
            {/* 상세설명 */}
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
            {/* 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 32,
              }}
            >
              <button
                onClick={() => router.push("/admin/schedules")}
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
