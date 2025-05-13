import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import SchedulesTable from "@/components/admin/SchedulesTable";
import ScheduleModal from "@/components/schedules/ScheduleModal";
import Calendar from "@/components/schedules/Calendar";
import api from "@/lib/api";

const formats = {
  monthHeaderFormat: (date) =>
    `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
};

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [calendarSchedules, setCalendarSchedules] = useState([]);

  useEffect(() => {
    if (tab !== "calendar") return;
    api
      .get("/admin/schedules", {
        params: {
          page: 1,
          pageSize: 1000, // 전체 조회
          sort: "start_date",
          order: "asc",
        },
      })
      .then((res) => {
        if (res.data.success) {
          const formatted = res.data.schedules.map((s) => ({
            ...s,
            start: new Date(s.start_date),
            end: new Date(s.end_date),
          }));
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
        {/* ✅ 탭 + 등록 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
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
              }}
            >
              달력 보기
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
            }}
          >
            +등록
          </button>
        </div>

        {/* ✅ 본문 */}
        {tab === "list" && <SchedulesTable />}

        {tab === "calendar" && (
          <Calendar
            schedules={calendarSchedules}
            onClickCreate={() => setModalOpen(true)}
            onSelectEvent={(evt) => {
              setSelectedId(evt.id);
              setModalOpen(true);
            }}
            formats={formats}
          />
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
