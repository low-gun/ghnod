import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
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
    product_id: "", title: "", start_date: "", end_date: "",
    location: "", instructor: "", description: "",
    total_spots: "", price: "", detail: "", image_url: "",
  });
  const [sessions, setSessions] = useState([
    { start_date: "", end_date: "", start_time: "", end_time: "" }, // 기간형 회차 1행
  ]);
  
  
  const [products, setProducts] = useState([]);
  const [selectedType, setSelectedType] = useState(""); // ★ 추가
  const [loading, setLoading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const educationTypes = useMemo(() => {
    const types = products
      .filter((p) => p.category === "교육")
      .map((p) => p.type)
      .filter(Boolean);
    return Array.from(new Set(types));
  }, [products]);
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
            start_date: data.start_date?.replace(" ", "T")?.slice(0,16) || "",
            end_date:   data.end_date?.replace(" ", "T")?.slice(0,16) || "",
            total_spots: data.total_spots ?? "",
            price: data.price ?? "",
            image_url: data.image_url || "",
          });
          setOriginalImageUrl(data.image_url || "");
          
          // ✅ 유형 동기화(편집 시 상품 선택 드롭다운 비활성 문제 해결)
          setSelectedType(data.product_type || "");
          
          // 회차 세팅: 기간형 컬럼(start_date/end_date) 우선, 없으면 단일 date 보정
if (Array.isArray(data.sessions) && data.sessions.length) {
  setSessions(
    data.sessions.map((s) => {
      const sd = (s.start_date || s.session_date || "").slice(0, 10);
      const ed = (s.end_date   || s.session_date || "").slice(0, 10);
      return {
        start_date: sd,
        end_date: ed,
        start_time: (s.start_time || "").slice(0, 5),
        end_time: (s.end_time || "").slice(0, 5),
      };
    })
  );
} else if (data.start_date && data.end_date) {
  const sd = (data.start_date || "").slice(0, 10);
  const ed = (data.end_date   || "").slice(0, 10);
  const st = (data.start_date || "").slice(11, 16);
  const et = (data.end_date   || "").slice(11, 16);
  setSessions([{ start_date: sd, end_date: ed, start_time: st, end_time: et }]);
} else {
  setSessions([{ start_date: "", end_date: "", start_time: "", end_time: "" }]);
}

          
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

    if (name === "product_type") {
      // ★ 유형 선택 시: 유형 상태만 설정, 상품 선택 초기화
      setSelectedType(newValue);
      setForm((prev) => ({
        ...prev,
        product_id: "",
      }));
      return;
    }

    if (name === "product_id") {
      const selected = products.find((p) => p.id === Number(value));
      setSelectedType(selected?.type || ""); // ✅ 유형 자동선택 동기화
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
      return;
    }
    

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // 유효성 체크
  const validate = () => {
    if (!form.title) return "일정명을 입력하세요.";
    if (!form.product_id) return "상품을 선택하세요.";
    if (!sessions.length) return "회차를 1개 이상 추가하세요.";
for (const [i, s] of sessions.entries()) {
  if (!s.start_date || !s.end_date || !s.start_time || !s.end_time)
    return `${i + 1}회차의 시작/종료일과 시간(시작·종료)을 모두 입력하세요.`;
  if (s.start_date > s.end_date)
    return `${i + 1}회차의 종료일이 시작일보다 빠릅니다.`;
  // 같은 날짜인 경우에만 시간 비교
  if (s.start_date === s.end_date && s.start_time >= s.end_time)
    return `${i + 1}회차의 종료시간이 시작시간보다 늦어야 합니다.`;
}


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
      // "YYYY-MM-DD HH:mm:ss" 포맷으로 합치기
      const toDT = (d, t) => `${d} ${t}:00`;

      // 시작/종료 자동 집계(가장 이른 시작, 가장 늦은 종료) — 기간형 우선
      const starts = sessions.map((s) => toDT(s.start_date || s.date, s.start_time));
      const ends   = sessions.map((s) => toDT(s.end_date   || s.date, s.end_time));
      const minStart = starts.slice().sort()[0];
      const maxEnd   = ends.slice().sort().slice(-1)[0];
      
      const payload = {
        ...form,
        start_date: minStart,
        end_date: maxEnd,
        sessions, // [{start_date, end_date, start_time, end_time}] 백엔드가 기간형도 수용
      };
      

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
                {/* 상품 선택: 유형 → 상품명 2단계 */}
                <div style={{ marginBottom: 16 }}>
                  <label>유형</label>
                  <select
                    name="product_type"
                    value={selectedType}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      marginBottom: 8,
                    }}
                  >
                    <option value="">유형 선택</option>
                    {educationTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <label>상품명</label>
                  <select
                    name="product_id"
                    value={form.product_id || ""}
                    onChange={handleChange}
                    disabled={!selectedType} // ★ 유형 미선택 시 비활성
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      color: !selectedType ? "#aaa" : "#000",
                      backgroundColor: !selectedType ? "#f7f7f7" : "#fff",
                    }}
                  >
                    {!selectedType ? (
                      <option value="">유형을 먼저 선택해주세요.</option>
                    ) : (
                      <>
                        <option value="">상품 선택</option>
                        {products
                          .filter(
                            (p) =>
                              p.category === "교육" && p.type === selectedType
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                      </>
                    )}
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
                {/* 회차(복수 일정) 편집 */}
<div style={{ marginBottom: 16 }}>
<label>회차(날짜·시간)</label>
{sessions.map((s, idx) => (
  <div
    key={idx}
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr auto", // 시작일, 종료일, 시작시간, 종료시간, 버튼
      gap: 8, marginTop: 8
    }}
  >
    <input
      type="date"
      value={s.start_date}
      onChange={(e) => {
        const v = e.target.value;
        setSessions((prev) => prev.map((x, i) => (i === idx ? { ...x, start_date: v } : x)));
      }}
      style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
    />
    <input
      type="date"
      value={s.end_date}
      onChange={(e) => {
        const v = e.target.value;
        setSessions((prev) => prev.map((x, i) => (i === idx ? { ...x, end_date: v } : x)));
      }}
      style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
    />
    <input
      type="time"
      value={s.start_time}
      onChange={(e) => {
        const v = e.target.value;
        setSessions((prev) => prev.map((x, i) => (i === idx ? { ...x, start_time: v } : x)));
      }}
      style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
    />
    <input
      type="time"
      value={s.end_time}
      onChange={(e) => {
        const v = e.target.value;
        setSessions((prev) => prev.map((x, i) => (i === idx ? { ...x, end_time: v } : x)));
      }}
      style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
    />
    <button
      type="button"
      onClick={() => setSessions((prev) => prev.filter((_, i) => i !== idx))}
      style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}
      disabled={sessions.length === 1}
      title={sessions.length === 1 ? "회차 1개는 최소 유지" : "삭제"}
    >
      삭제
    </button>
  </div>
))}
<div style={{ marginTop: 8 }}>
  <button
    type="button"
    onClick={() =>
      setSessions((prev) => [
        ...prev,
        { start_date: "", end_date: "", start_time: "", end_time: "" },
      ])
    }
    style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}
  >
    + 회차 추가
  </button>
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
