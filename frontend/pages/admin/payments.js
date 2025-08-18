import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import AdminSearchFilter from "@/components/common/AdminSearchFilter";
import PaymentsTable from "@/components/admin/PaymentsTable";
import { formatPrice } from "@/lib/format";
import { UserContext } from "@/context/UserContext";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { showAlert } = useGlobalAlert();

  // 상단 현황
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // 검색 상태
  // 검색 상태
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSyncKey, setSearchSyncKey] = useState(0);

  // 날짜 범위 상태(기간 검색용)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 엑셀 데이터
  const [excelData, setExcelData] = useState({ headers: [], data: [] });

  // 권한 체크
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <AdminLayout pageTitle="💳 결제내역">
      <AdminTopPanels
        stats={[
          {
            title: "총 결제 현황",
            value: [
              `건수: ${totalCount}건`,
              `금액: ${formatPrice(totalAmount)}원`,
            ],
          },
        ]}
        searchComponent={
          <AdminSearchFilter
            searchType={searchType}
            setSearchType={setSearchType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOptions={[
              { value: "payment_id", label: "주문번호", type: "text" },
              { value: "username", label: "사용자", type: "text" },
              { value: "total_quantity", label: "수강인원", type: "text" },
              { value: "amount", label: "결제금액", type: "text" },
              { value: "discount_total", label: "할인적용", type: "text" },
              {
                value: "payment_method",
                label: "결제수단",
                type: "select",
                options: [
                  { value: "card", label: "카드" },
                  { value: "transfer", label: "계좌이체" },
                  { value: "vbank", label: "가상계좌" },
                ],
              },
              { value: "created_at", label: "결제일시", type: "date" },
              {
                value: "status",
                label: "상태",
                type: "select",
                options: [
                  { value: "paid", label: "결제완료" },
                  { value: "failed", label: "결제실패" },
                  { value: "refunded", label: "환불완료" },
                  { value: "pending", label: "결제대기" },
                ],
              },
            ]}
            onSearchClick={(nextQuery) => {
              if (typeof nextQuery === "string") {
                setSearchQuery(nextQuery); // ✅ 먼저 최신 검색어를 반영
              }
              setSearchSyncKey((k) => k + 1); // ✅ 그 다음 fetch 트리거
            }}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        }
        excel={{
          visible: true,
          fileName: "결제내역",
          sheetName: "Payments",
          headers: excelData.headers,
          data: excelData.data,
        }}
        actions={[]}
      />

      <PaymentsTable
        onExcelData={setExcelData}
        useExternalToolbar={true}
        externalSearchType={searchType}
        externalSearchQuery={searchQuery}
        searchSyncKey={searchSyncKey}
        onLoaded={({ totalCount, totalAmount }) => {
          setTotalCount(totalCount);
          setTotalAmount(totalAmount);
        }}
      />
    </AdminLayout>
  );
}
