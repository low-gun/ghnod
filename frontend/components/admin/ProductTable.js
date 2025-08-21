// /frontend/components/admin/ProductTable.js
import { useMemo, useState, useEffect } from "react";
import api from "@/lib/api";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import ProductSchedulesModal from "@/components/admin/ProductSchedulesModal";
import SelectableCard from "@/components/common/SelectableCard"; // ← 추가

/** 로컬시간 포맷 (YYYY-MM-DD HH:mm:ss) */
function formatDateLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/**
 * 공통 톤 ProductTable
 * props:
 *  - products: []
 *  - productTypes: []
 *  - onEdit(product)
 *  - onRefresh(nextProducts?)  // 없으면 무시
 *  - loading? (선택)
 */
export default function ProductTable({
  products = [],
  productTypes = [],
  onEdit,
  onRefresh,
  loading = false,
  onExcelData, // ✅ 추가
}) {
  const isTabletOrBelow = useIsTabletOrBelow();
  const mounted = true; // CSR 환경에서만 사용하면 충분

  // ✅ rows를 먼저 선언(아래에서 참조하므로)
  const rows = useMemo(() => products || [], [products]);
  // ✅ 엑셀 헤더/데이터 구성
  // ✅ excelHeaders는 불변 객체(useMemo로 고정)
  const excelHeaders = useMemo(
    () => [
      "ID",
      "코드",
      "상품명",
      "유형",
      "가격",
      "상태",
      "등록일시",
      "수정일시",
    ],
    []
  );

  const excelRows = useMemo(
    () =>
      rows.map((p) => ({
        ID: p.id,
        코드: p.code ?? `P-${p.id}`,
        상품명: p.title ?? p.name ?? "(제목 없음)",
        유형: p.type ?? "-",
        가격: Number(p.price ?? 0),
        상태: Number(p.is_active) === 1 ? "활성" : "비활성",
        등록일시: formatDateLocal(p.created_at),
        수정일시: formatDateLocal(p.updated_at),
      })),
    [rows]
  );

  // ✅ 이제 headers 배열이 고정이라 무한 루프 안 돈다
  useEffect(() => {
    if (typeof onExcelData === "function") {
      onExcelData({ headers: excelHeaders, data: excelRows });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelRows]); // onExcelData는 부모 setState라 참조가 자주 바뀔 수 있어 제외

  // ✅ 알림/확인
  const { showAlert } = useGlobalAlert?.() ?? { showAlert: () => {} };
  const { showConfirm } = useGlobalConfirm?.() ?? {
    showConfirm: async () => true,
  };

  // ✅ 먼저 selectedIds 상태 선언
  const [selectedIds, setSelectedIds] = useState([]);

  // 전체선택/개별선택
  const isAllChecked =
    rows.length > 0 && rows.every((p) => selectedIds.includes(p.id));
  const toggleAll = (checked) =>
    setSelectedIds(checked ? rows.map((p) => p.id) : []);
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  // ✅ 선택 삭제 핸들러
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const ok = await showConfirm("정말로 선택한 상품을 삭제하시겠습니까?");
    if (!ok) return;

    const ids = Array.from(new Set(selectedIds.map(Number))).filter(
      (n) => n > 0
    );

    try {
      // 1차: DELETE body 방식
      await api.request({
        method: "delete",
        url: "admin/products",
        headers: { "Content-Type": "application/json" },
        data: { ids },
      });

      showAlert("삭제되었습니다.");
      setSelectedIds([]);
      if (typeof onRefresh === "function") onRefresh();
    } catch (e1) {
      // FK 차단(연결 일정/후기) → 409 + details 반환
      if (
        e1?.response?.status === 409 &&
        e1?.response?.data?.code === "HAS_DEPENDENCIES"
      ) {
        const det = e1.response.data.details || {};
        const sc = (det.scheduleBlocks || []).reduce(
          (a, b) => a + (b.schedule_count || 0),
          0
        );
        const rc = (det.reviewBlocks || []).reduce(
          (a, b) => a + (b.review_count || 0),
          0
        );
        // 삭제 불가 응답 수신 시
        const lines = ["삭제 불가: 연결된 데이터가 있습니다."];

        // 0건은 숨기고, 있는 항목만 추가 (• 기호 사용)
        if (Number(sc) > 0) lines.push(`• 일정: ${sc}건`);
        if (Number(rc) > 0) lines.push(`• 후기: ${rc}건`);

        lines.push("관련 데이터를 먼저 정리한 후 삭제하세요.");

        // 줄바꿈(\n)으로 합쳐 알럿 표시
        showAlert(lines.join("\n"));

        return;
      }
      // 2차 폴백: 쿼리스트링 방식 (?ids=1,2,3)
      try {
        await api.delete("admin/products", { params: { ids: ids.join(",") } });
        showAlert("삭제되었습니다.");
        setSelectedIds([]);
        if (typeof onRefresh === "function") onRefresh();
      } catch {
        showAlert("삭제 실패");
      }
    }
  };

  // ✅ 상단 패널의 "- 삭제" 버튼과 연동
  useEffect(() => {
    const handler = () => {
      if (!selectedIds || selectedIds.length === 0) return;
      (async () => {
        await handleDeleteSelected();
      })();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("products:deleteSelected", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("products:deleteSelected", handler);
      }
    };
  }, [selectedIds]);

  // ✅ 상태 토글 (활성/비활성) — 필요 시 엔드포인트 맞춰 조정
  const handleToggleActive = async (product) => {
    const nextActive = Number(product.is_active) === 1 ? 0 : 1;
    const ok = await showConfirm("상태를 변경하시겠습니까?");
    if (!ok) return;
    try {
      await api.put(`admin/products/${product.id}/active`, {
        is_active: nextActive,
      });
      showAlert("상태가 변경되었습니다.");
      // 부모 onRefresh가 배열/함수 모두 수용하도록 이전 구현 유지
      if (typeof onRefresh === "function") onRefresh();
    } catch (e) {
      showAlert("상태 변경 실패");
    }
  };

  const [scheduleProductId, setScheduleProductId] = useState(null);

  // ✅ 열 너비 고정(colgroup)
  const COL_W = {
    sel: 44, // 체크박스
    no: 60, // No
    code: 100,
    thumb: 84,
    title: 240,
    type: 120,
    price: 120,
    created: 160,
    updated: 160,
    schedule: 100,
    status: 96, // 토글
  };
  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: COL_W.sel, minWidth: COL_W.sel }} />
      <col style={{ width: COL_W.no, minWidth: COL_W.no }} />
      <col style={{ width: COL_W.code, minWidth: COL_W.code }} />
      <col style={{ width: COL_W.thumb, minWidth: COL_W.thumb }} />
      <col style={{ width: COL_W.title, minWidth: COL_W.title }} />
      <col style={{ width: COL_W.type, minWidth: COL_W.type }} />
      <col style={{ width: COL_W.price, minWidth: COL_W.price }} />
      <col style={{ width: COL_W.created, minWidth: COL_W.created }} />
      <col style={{ width: COL_W.updated, minWidth: COL_W.updated }} />
      <col style={{ width: COL_W.schedule, minWidth: COL_W.schedule }} />
      <col style={{ width: COL_W.status, minWidth: COL_W.status }} />
    </colgroup>
  );

  // ⬇️ 이하 나머지 코드는 그대로 유지

  if (loading) {
    return mounted && isTabletOrBelow ? (
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} lines={3} />
        ))}
      </div>
    ) : (
      <TableSkeleton columns={11} rows={6} />
    );
  }

  if (!rows.length) {
    return (
      <div
        style={{
          border: "1px dashed #d0d7de",
          background: "#fafbfc",
          color: "#57606a",
          padding: "18px 16px",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        상품이 없습니다. 상단에서 등록하거나 필터를 조정해 보세요.
      </div>
    );
  }

  // 🔹 모바일/태블릿 카드 렌더러
  const renderCards = () =>
    rows.map((p, idx) => {
      const code = p.code || `P-${p.id}`;
      const title = p.title ?? p.name ?? "(제목 없음)";
      const type = p.type ?? "-";
      const price = formatPrice(Number(p.price ?? 0));
      const isActive = Number(p.is_active) === 1;
      const thumb =
      p.image_url ||
      p.thumbnail_url ||
      p.thumb_url ||
      (Array.isArray(p.images) ? p.images[0] : "") ||
      "";
    

      return (
        <SelectableCard
          key={p.id}
          selected={selectedIds.includes(p.id)}
          onToggle={() => toggleOne(p.id, !selectedIds.includes(p.id))}
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            opacity: isActive ? 1 : 0.6,
          }}
        >
          {/* 상단 체크 + 코드 + 토글 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={(e) => toggleOne(p.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()} // 카드 토글 방지
              />
              <div style={{ fontSize: 13, color: "#666" }}>
                #{idx + 1} · {code}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <ToggleSwitch
                size="sm"
                checked={isActive}
                onChange={() => handleToggleActive(p)}
                onLabel="ON"
                offLabel="OFF"
              />
            </div>
          </div>

          {/* 제목(텍스트만 클릭) */}
          <div style={{ marginTop: 6, color: "#222", cursor: "default" }}>
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(p);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.(p);
                }
              }}
              style={{
                color: "#0070f3",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {title}
            </span>
          </div>

          {/* 썸네일 + 라벨/값 */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div
              style={{
                width: 72,
                height: 72,
                position: "relative",
                flex: "0 0 72px",
              }}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt="thumbnail"
                  fill
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    border: "1px dashed #ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                    fontSize: 12,
                  }}
                >
                  no image
                </div>
              )}
            </div>

            <div style={{ flex: 1, fontSize: 14, color: "#374151" }}>
              <Row label="유형" value={type} />
              <Row label="가격" value={`${price}원`} />
              <Row label="등록일시" value={formatDateLocal(p.created_at)} />
              <Row label="수정일시" value={formatDateLocal(p.updated_at)} />
            </div>
          </div>

          {/* 액션 */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              justifyContent: "flex-end", // ✅ 우측 정렬
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setScheduleProductId(p.id)}
                style={ghostBtn}
              >
                일정
              </button>
              <button onClick={() => onEdit?.(p)} style={primaryBtn}>
                수정
              </button>
            </div>
          </div>
        </SelectableCard>
      );
    });

  // 🔹 데스크톱 테이블 렌더러
  const renderTable = () => (
    <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
      <table
        className="admin-table"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        {renderColGroup()}

        <thead style={{ backgroundColor: "#f9f9f9" }}>
          <tr>
            <th className="admin-th">
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={(e) => toggleAll(e.target.checked)}
              />
            </th>
            <th className="admin-th">No</th>
            <th className="admin-th">코드</th>
            <th className="admin-th">썸네일</th>
            <th className="admin-th">상품명</th>
            <th className="admin-th">유형</th>
            <th className="admin-th">가격</th>
            <th className="admin-th">등록일시</th>
            <th className="admin-th">수정일시</th>
            <th className="admin-th">일정</th>
            <th className="admin-th">상태</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((p, idx) => {
            const code = p.code || `P-${p.id}`;
            const title = p.title ?? p.name ?? "(제목 없음)";
            const type = p.type ?? "-";
            const price = formatPrice(Number(p.price ?? 0));
            const isActive = Number(p.is_active) === 1;
            const thumb =
  p.image_url ||
  p.thumbnail_url ||
  p.thumb_url ||
  (Array.isArray(p.images) ? p.images[0] : "") ||
  "";

            return (
              <tr
                key={p.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {/* 체크박스(개별) */}
                <td className="admin-td">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={(e) => toggleOne(p.id, e.target.checked)}
                  />
                </td>

                {/* No */}
                <td className="admin-td">{idx + 1}</td>

                {/* 코드 */}
                <td
                  className="admin-td"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={code}
                >
                  {code}
                </td>

                {/* 썸네일 */}
                <td className="admin-td">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
<img
  src={thumb}
  alt="thumbnail"
  width="48"
  height="48"
  loading="lazy"
  style={{
    objectFit: "cover",
    borderRadius: 6,
    border: "1px solid #eee",
  }}
/>

                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        border: "1px dashed #ddd",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        fontSize: 12,
                      }}
                    >
                      썸네일<br></br>없음
                    </div>
                  )}
                </td>

                <td
                  className="admin-td"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={title}
                >
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={() => onEdit?.(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onEdit?.(p);
                    }}
                    style={{
                      color: "#0070f3",
                      cursor: "pointer",
                      textDecoration: "none",
                    }} // 텍스트만 클릭
                  >
                    {title}
                  </span>
                </td>

                {/* 유형 / 가격 / 등록/수정 / 일정 */}
                <td className="admin-td">{type}</td>
                <td className="admin-td">{price}원</td>
                <td className="admin-td">{formatDateLocal(p.created_at)}</td>
                <td className="admin-td">{formatDateLocal(p.updated_at)}</td>
                <td className="admin-td">
                  <button
                    style={ghostBtn}
                    onClick={() => setScheduleProductId(p.id)}
                  >
                    일정
                  </button>
                </td>

                {/* 상태 토글 */}
                <td className="admin-td">
                  <ToggleSwitch
                    size="sm"
                    checked={isActive}
                    onChange={() => handleToggleActive(p)}
                    onLabel="ON"
                    offLabel="OFF"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {mounted && isTabletOrBelow ? (
        <div style={{ display: "grid", gap: 12 }}>{renderCards()}</div>
      ) : (
        renderTable()
      )}

      {scheduleProductId && (
        <ProductSchedulesModal
          productId={scheduleProductId}
          onClose={() => setScheduleProductId(null)}
        />
      )}
    </>
  );
}

/* 공통 카드 라벨/값 한 줄 */
function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px dashed #f0f0f0",
      }}
    >
      <span style={{ color: "#888", fontSize: 13, minWidth: 72 }}>{label}</span>
      <span style={{ color: "#222", fontSize: 14, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

/* 버튼 스타일 */
const primaryBtn = {
  padding: "6px 10px",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
const ghostBtn = {
  padding: "6px 10px",
  backgroundColor: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
