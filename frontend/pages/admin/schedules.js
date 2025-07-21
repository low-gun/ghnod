import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import SchedulesTable from "@/components/admin/SchedulesTable";
import ScheduleModal from "@/components/schedules/ScheduleModal";
import moment from "moment";
import CustomCalendar from "@/components/schedules/CustomCalendar";
import api from "@/lib/api";
import { UserContext } from "@/context/UserContext"; // 🔥 추가

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [calendarSchedules, setCalendarSchedules] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const { user } = useContext(UserContext); // 🔥 추가

  // 🔥 권한 체크
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (tab !== "calendar") return;
    if (!user || user.role !== "admin") return; // 🔥 권한 있을 때만 호출

    const startOfMonth = currentMonth.clone().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = currentMonth.clone().endOf("month").format("YYYY-MM-DD");

    api
      .get("admin/schedules", {
        params: {
          page: 1,
          pageSize: 1000,
          sort: "start_date",
          order: "asc",
          start_date: startOfMonth,
          end_date: endOfMonth,
        },
      })
      .then((res) => {
        if (res.data.success) {
          const formatted = res.data.schedules.map((s) => ({
            ...s,
            start: moment(s.start_date),
            end: moment(s.end_date),
            type: s.category,
          }));
          setCalendarSchedules(formatted);
        }
      })
      .catch(() => {
        alert("일정 불러오기 실패");
      });
  }, [tab, user, currentMonth]);

  // 🔥 로딩/권한 체크
  if (user === null) return <div style={{ padding: 100, textAlign: "center" }}>로딩중...</div>;
  if (user && user.role !== "admin") return null;

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
