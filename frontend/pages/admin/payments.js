import { useEffect, useState, useContext, useMemo } from "react";
import { useRouter } from "next/router";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminTopPanels from "@/components/common/AdminTopPanels";
import { formatPrice } from "@/lib/format";
import { UserContext } from "@/context/UserContext";
import dynamic from "next/dynamic";

const AdminSearchFilter = dynamic(
  () => import("@/components/common/AdminSearchFilter"),
  { ssr: false, loading: () => null }
);

const PaymentsTable = dynamic(
  () => import("@/components/admin/PaymentsTable"),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 40, textAlign: "center" }}>테이블 불러오는 중…</div>
    ),
  }
);

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);

  // ---------- 권한 ----------
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/");
  }, [user, router]);
  const isBlocked = !user || (user && user.role !== "admin");

  // ---------- 상단 현황(테이블 로드 시 상향 보고) ----------
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // ---------- 상단 검색 ----------
  const [searchType, setSearchType] = useState("payment_id");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSyncKey, setSearchSyncKey] = useState(0);
  const [startDate, setStartDate] = useState(null); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(null);

  // 엑셀 데이터(테이블에서 상향 보고)
  const [excelData, setExcelData] = useState({ headers: [], data: [] });

  const stats = useMemo(
    () => [
      {
        title: "총 결제 현황",
        value: [`건수: ${totalCount}건`, `금액: ${formatPrice(totalAmount)}원`],
      },
    ],
    [totalCount, totalAmount]
  );

  // ✅ 모든 훅 선언이 끝난 뒤에만 가드
  if (isBlocked) return null;

  return (
    <AdminLayout pageTitle="💳 결제내역">
      <AdminTopPanels
        stats={stats}
        searchComponent={
          <AdminSearchFilter
            searchType={searchType}
            setSearchType={setSearchType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOptions={[
              { value: "payment_id", label: "주문번호", type: "text" },
              { value: "username", label: "사용자", type: "text" },
              { value: "total_quantity", label: "수량", type: "number" },
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
              if (typeof nextQuery === "string") setSearchQuery(nextQuery);
              setSearchSyncKey((k) => k + 1);
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
        useExternalToolbar={true}
        externalSearchType={searchType}
        externalSearchQuery={searchQuery}
        externalStartDate={startDate}
        externalEndDate={endDate}
        searchSyncKey={searchSyncKey}
        onLoaded={({ totalCount, totalAmount }) => {
          setTotalCount(totalCount ?? 0);
          setTotalAmount(totalAmount ?? 0);
        }}
        onExcelData={setExcelData}
      />
    </AdminLayout>
  );
}
