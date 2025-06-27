import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import SchedulesTable from "@/components/admin/SchedulesTable";
import ScheduleModal from "@/components/schedules/ScheduleModal";
import moment from "moment";
// 🔁 기존 Calendar 삭제
// import Calendar from "@/components/schedules/Calendar";
import CustomCalendar from "@/components/schedules/CustomCalendar";
import api from "@/lib/api";

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [calendarSchedules, setCalendarSchedules] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment()); // 👈 현재 달 상태 추가

  useEffect(() => {
    if (tab !== "calendar") return;
    const startOfMonth = currentMonth
      .clone()
      .startOf("month")
      .format("YYYY-MM-DD");
    const endOfMonth = currentMonth.clone().endOf("month").format("YYYY-MM-DD");

    api
      .get("admin/schedules", {
        params: {
          page: 1,
          pageSize: 1000,
          sort: "start_date",
          order: "asc",
          start_date: startOfMonth, // 👈 백엔드에서 이거 기준으로 필터
          end_date: endOfMonth,
        },
      })

      .then((res) => {
        console.log("🔥 [API 응답 결과]", res.data); // ✅ 추가
        if (res.data.success) {
          const formatted = res.data.schedules.map((s) => ({
            ...s,
            start: moment(s.start_date), // ✅ moment 객체로
            end: moment(s.end_date),
            type: s.category, // ✅ 여기 추가!
          }));
          console.log("🔥 [변환 후 일정]", formatted); // ✅ 추가
          console.log(
            "✅ start type:",
            typeof formatted[0]?.start,
            formatted[0]?.start
          );
          setCalendarSchedules(formatted);
        }
      })
      .catch(() => {
        alert("일정 불러오기 실패");
      });
  }, [tab]);

  return (
    <AdminLayout pageTitle="📅 교육일정">
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            position: "relative", // 핵심
            marginBottom: "32px", // 여유 공간
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setTab("list")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: tab === "list" ? "#0070f3" : "#fff",
                  color: tab === "list" ? "#fff" : "#000",
                  fontWeight: "normal",
                  cursor: "pointer",
                }}
              >
                일정 리스트
              </button>
              <button
                onClick={() => setTab("calendar")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: tab === "calendar" ? "#0070f3" : "#fff",
                  color: tab === "calendar" ? "#fff" : "#000",
                  fontWeight: "normal",
                  cursor: "pointer",
                }}
              >
                캘린더
              </button>
            </div>

            <button
              onClick={() => router.push("/admin/schedules/new")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#0070f3",
                color: "#fff",
                borderRadius: "6px",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              +등록
            </button>
          </div>

          {/* ✅ 중앙 오버레이 날짜 */}
          {tab === "calendar" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "18px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                pointerEvents: "none", // 클릭 방해 안됨
              }}
            >
              <span
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onClick={() =>
                  setCurrentMonth((prev) => prev.clone().subtract(1, "month"))
                }
              >
                ◀
              </span>
              <span>{currentMonth.format("YYYY년 M월")}</span>
              <span
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onClick={() =>
                  setCurrentMonth((prev) => prev.clone().add(1, "month"))
                }
              >
                ▶
              </span>
            </div>
          )}
        </div>

        {tab === "list" && <SchedulesTable />}

        {tab === "calendar" && (
          <>
            {calendarSchedules.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                ⏳ 일정 데이터를 불러오는 중입니다...
              </div>
            ) : (
              <>
                {console.log(
                  "📦 CustomCalendar에 전달되는 일정",
                  calendarSchedules
                )}
                <CustomCalendar
                  schedules={calendarSchedules}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  mode="admin" // ✅ 추가
                />
              </>
            )}
          </>
        )}

        {modalOpen && (
          <ScheduleModal
            scheduleId={selectedId}
            onClose={() => {
              setModalOpen(false);
              setSelectedId(null);
            }}
            onRefresh={() => router.replace(router.asPath)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
