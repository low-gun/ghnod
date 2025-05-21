import { useRouter } from "next/router";
import axios from "axios";
import api from "@/lib/api";

function formatKoreanAMPM(date) {
  if (!(date instanceof Date)) return "";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours < 12 ? "오전" : "오후";
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  const mm = String(minutes).padStart(2, "0");
  return `${ampm} ${hour12}:${mm}`;
}

function formatDetailDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일 ${formatKoreanAMPM(d)}`;
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.params;
    const cookie = context.req.headers.cookie || "";

    if (!id) return { notFound: true };

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/schedules?id=${id}`,
      {
        headers: { Cookie: cookie },
      }
    );

    const data = res.data;

    let schedule = null;
    if (data?.schedules?.length) {
      schedule = data.schedules[0];
    }

    return {
      props: { schedule },
    };
  } catch (error) {
    console.error("[SSR] /education/calendar/[id] error:", error);
    return {
      props: { schedule: null },
    };
  }
}

export default function CalendarDetail({ schedule }) {
  const router = useRouter();

  if (!schedule) {
    return (
      <div style={{ padding: "20px" }}>일정 정보를 불러오지 못했습니다.</div>
    );
  }

  const startDate = formatDetailDate(schedule.start_date);
  const endDate = formatDetailDate(schedule.end_date);

  const handleAddToCart = async () => {
    try {
      const createCartRes = await api.post("/orders");
      const createCartData = createCartRes.data;
      if (!createCartData.success) {
        alert("장바구니 생성/확인 중 오류가 발생했습니다.");
        return;
      }
      const orderId = createCartData.order_id;

      const addItemRes = await api.post(`/orders/${orderId}/items`, {
        schedule_id: schedule.id,
        quantity: 1,
      });
      const addItemData = addItemRes.data;
      if (!addItemData.success) {
        alert("장바구니에 담는 중 오류\n" + addItemData.message);
        return;
      }

      alert("장바구니에 담았습니다!");
    } catch (error) {
      console.error(error);
      alert("장바구니 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>일정 상세</h1>
      <div style={{ display: "flex", gap: "20px" }}>
        <div
          style={{
            width: "400px",
            height: "300px",
            backgroundColor: "#e9e9e9",
            border: "1px solid #ccc",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>이미지 미리보기 (추후 업로드)</span>
        </div>

        <div style={{ flex: 1 }}>
          <p>
            <strong>기간:</strong>
            <br />
            {startDate} ~ {endDate}
          </p>
          <p>
            <strong>제목:</strong>
            <br />
            {schedule.title}
          </p>
          <p>
            <strong>장소:</strong>
            <br />
            {schedule.location}
          </p>
          <p>
            <strong>강사:</strong>
            <br />
            {schedule.instructor}
          </p>
          <p style={{ whiteSpace: "pre-line" }}>
            <strong>내용:</strong>
            <br />
            {schedule.description}
          </p>
          <p>
            <strong>정원:</strong>
            <br />
            {schedule.total_spots ?? "-"}
          </p>

          <button
            style={{
              marginTop: "10px",
              marginRight: "8px",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: "#3174ad",
              color: "#fff",
              border: "none",
            }}
            onClick={handleAddToCart}
          >
            장바구니 담기
          </button>
          <button
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => alert("구매하기 클릭")}
          >
            구매하기
          </button>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2>상세설명</h2>
        <div
          style={{
            minHeight: "200px",
            border: "1px solid #ccc",
            padding: "16px",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
          }}
        ></div>
      </div>
    </div>
  );
}
