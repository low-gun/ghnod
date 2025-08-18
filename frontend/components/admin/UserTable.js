// ./frontend/components/admin/UserTable.js
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import "react-datepicker/dist/react-datepicker.css";
import api from "@/lib/api";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import SearchFilter from "@/components/common/SearchFilter";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";
import { useIsTabletOrBelow } from "@/lib/hooks/useIsDeviceSize";
import AdminToolbar from "@/components/common/AdminToolbar";
import TableSkeleton from "@/components/common/skeletons/TableSkeleton";
import CardSkeleton from "@/components/common/skeletons/CardSkeleton";
import ToggleSwitch from "@/components/common/ToggleSwitch";
import { formatLocalReadable } from "@/lib/format";

export default function UserTable({
  onResetPassword,
  onLoaded,
  useExternalToolbar = false,
  externalSearchType,
  externalSearchQuery,
  externalShowDeleted,
  searchSyncKey,
  onExcelData,
  onSelectionChange,
  // ✅ 탭 활성 여부(비활성 시 요청/엑셀 업데이트 중단)
  isActive = true,
}) {
  const router = useRouter();
  const isTabletOrBelow = useIsTabletOrBelow();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isNarrow = mounted && isTabletOrBelow;

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(true);

  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ 최근 요청 취소용 컨트롤러
  const abortRef = useRef(null);

  // ✅ 활성 탭에서만 즉시 fetch (디바운스 제거)
  useEffect(() => {
    if (!isActive) return; // 비활성 탭이면 요청 금지

    // 이전 요청 취소
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    fetchUsers(false, controller.signal);

    // 언마운트/의존 변경 시 현재 요청 취소
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isActive,
    searchQuery,
    searchType,
    showDeleted,
    currentPage,
    pageSize,
    sortConfig,
  ]);
  useEffect(() => {
    if (externalSearchType !== undefined) setSearchType(externalSearchType);
    if (externalSearchQuery !== undefined) setSearchQuery(externalSearchQuery);
    if (externalShowDeleted !== undefined) setShowDeleted(externalShowDeleted);
    setCurrentPage(1);
    // isActive 여부는 별도의 fetch 제어(useEffect)에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSyncKey]);

  const handleResetPassword = useCallback(
    async (user) => {
      const ok = await showConfirm(
        `정말 "${user.username}" 사용자의 비밀번호를 초기화하시겠습니까?`
      );
      if (!ok) return;
      setConfirming(true);
      try {
        await onResetPassword(user);
        showAlert("비밀번호가 초기화되었습니다.");
      } catch {
        showAlert("비밀번호 초기화 실패");
      } finally {
        setConfirming(false);
      }
    },
    [onResetPassword, showAlert, showConfirm]
  );
  const handleSelectAll = useCallback(
    (e) => {
      const next = e.target.checked ? users.map((u) => u.id) : [];
      setSelectedIds(next);
      if (typeof onSelectionChange === "function") onSelectionChange(next);
    },
    [users, onSelectionChange]
  );

  const handleSelectOne = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        if (typeof onSelectionChange === "function") onSelectionChange(next);
        return next;
      });
    },
    [onSelectionChange]
  );
  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      !prev || prev.key !== key
        ? { key, direction: "asc" }
        : { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    );
    setCurrentPage(1);
  }, []);
  const handleOpenDetailClick = useCallback(
    (id) => {
      router.push(`/admin/users/${id}`);
    },
    [router]
  );

  useEffect(() => {
    if (!onExcelData || !isActive) return; // 비활성 탭일 때 엑셀 데이터 갱신 금지
    onExcelData({
      headers: [
        "코드",
        "이름",
        "이메일",
        "전화번호",
        "권한",
        "생성일시",
        "수정일시",
      ],
      data: users.map((u) => ({
        코드: `user-${u.id}`,
        이름: u.username,
        이메일: u.email,
        전화번호: u.phone,
        권한: u.role,
        생성일시: formatLocalReadable(u.created_at),
        수정일시: formatLocalReadable(u.updated_at),
      })),
    });
  }, [users, onExcelData, isActive]);

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize]
  );

  const handleToggleUserStatus = useCallback(
    async (userId, currentDeletedFlag) => {
      setTogglingId(userId);
      try {
        await api.put(`/admin/users/${userId}/status`, {
          is_deleted: currentDeletedFlag === 0 ? 1 : 0,
        });
        showAlert("계정 상태가 변경되었습니다.");
        await fetchUsers(true);
      } catch {
        showAlert("계정 상태 변경 실패");
      } finally {
        setTogglingId(null);
      }
    },
    [showAlert]
  ); // fetchUsers는 동일 스코프 함수이므로 의존 생략(동일 렌더 바인딩 사용)

  const fetchUsers = async (silent = false, signal) => {
    try {
      if (!silent) {
        setLoadError("");
        // 목록이 비어있을 때만 스켈레톤 노출
        if (users.length === 0) setIsInitialLoading(true);
        setIsFetching(true);
      }
      const res = await api.get("admin/users", {
        params: {
          page: currentPage,
          pageSize,
          sort: sortConfig?.key || "created_at",
          order: sortConfig?.direction || "desc",
          type: searchType,
          search: searchQuery,
          showDeleted,
          startDate:
            searchType === "created_at" && startDate
              ? new Date(startDate).toISOString()
              : undefined,
          endDate:
            searchType === "created_at" && endDate
              ? new Date(endDate).toISOString()
              : undefined,
        },
        signal, // AbortController
      });
      if (res.data?.success) {
        setUsers(res.data.users);
        setTotalCount(res.data.totalCount);
        if (typeof onLoaded === "function") {
          onLoaded({ type: "list", totalCount: res.data.totalCount });
        }
      } else {
        setLoadError("목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") {
        // 취소는 무시
      } else {
        setLoadError("사용자 목록 조회 실패");
      }
    } finally {
      if (!silent) {
        setIsFetching(false);
        setIsInitialLoading(false);
      }
    }
  };

  return (
    <div>
      {/* 상단 툴바 (외부 툴바 사용하는 경우 숨김) */}
      {!useExternalToolbar && (
        <AdminToolbar
          left={
            <SearchFilter
              searchType={searchType}
              setSearchType={setSearchType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchOptions={
                [
                  /* ...동일... */
                ]
              }
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              onSearchUpdate={(type, query) => {
                setSearchType(type);
                setSearchQuery(query);
                setCurrentPage(1);
              }}
            />
          }
          right={
            <>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 14 }}>비활성 포함</span>
                <ToggleSwitch
                  size="sm"
                  checked={showDeleted}
                  onChange={(next) => {
                    setShowDeleted(next);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <PageSizeSelector
                value={pageSize}
                onChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />

              <ExcelDownloadButton
                fileName="회원목록"
                sheetName="회원목록"
                headers={[
                  "코드",
                  "이름",
                  "이메일",
                  "전화번호",
                  "권한",
                  "생성일시",
                  "수정일시",
                ]}
                data={users.map((u) => ({
                  코드: `user-${u.id}`,
                  이름: u.username,
                  이메일: u.email,
                  전화번호: u.phone,
                  권한: u.role,
                  생성일시: formatLocalReadable(u.created_at),
                  수정일시: formatLocalReadable(u.updated_at),
                }))}
              />
            </>
          }
        />
      )}
      {isFetching && <div style={fetchBarStyle} />}

      {/* 본문: 로딩/에러/빈/목록 */}
      {isInitialLoading ? (
        isNarrow ? (
          <div style={skeletonGridStyle}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={4} />
            ))}
          </div>
        ) : (
          <TableSkeleton columns={11} rows={6} />
        )
      ) : loadError ? (
        <div style={errorBoxStyle}>
          {loadError}
          <button
            style={{
              ...resetButtonStyle,
              marginLeft: 10,
              background: "#e53e3e",
            }}
            onClick={() => fetchUsers()}
          >
            다시 시도
          </button>
        </div>
      ) : totalCount === 0 ? (
        <div style={emptyBoxStyle}>
          데이터가 없습니다. 필터를 변경하거나 검색어를 조정해 보세요.
        </div>
      ) : !isNarrow ? (
        // 데스크톱: 테이블
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead style={adminTableHeadStyle}>
              <tr>
                <th className="admin-th">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      users.length > 0 &&
                      selectedIds.length === users.length &&
                      users.every((u) => selectedIds.includes(u.id))
                    }
                  />
                </th>
                <th className="admin-th">No</th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("id")}
                >
                  코드
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("username")}
                >
                  이름
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("email")}
                >
                  이메일
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("phone")}
                >
                  전화번호
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("role")}
                >
                  권한
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("created_at")}
                >
                  생성일시
                </th>
                <th
                  className="admin-th"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("updated_at")}
                >
                  수정일시
                </th>

                <th className="admin-th">비밀번호</th>
                <th className="admin-th">상태</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const active = Number(user.is_deleted) !== 1;
                return (
                  <tr
                    key={user.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>user-{user.id}</td>
                    <td
                      className="admin-td-link"
                      onClick={() => handleOpenDetailClick(user.id)}
                    >
                      {user.username}
                    </td>

                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.role}</td>
                    <td>{formatLocalReadable(user.created_at)}</td>
                    <td>{formatLocalReadable(user.updated_at)}</td>
                    <td>
                      <button
                        style={resetButtonStyle}
                        onClick={() => handleResetPassword(user)}
                        disabled={confirming}
                      >
                        {confirming ? "처리 중..." : "초기화"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-td-actions">
                        <ToggleSwitch
                          size="sm"
                          checked={active}
                          disabled={togglingId === user.id}
                          onChange={async (next) => {
                            const willDeactivate = !next;
                            const nextText = willDeactivate
                              ? "비활성화"
                              : "복구";
                            const ok = await showConfirm(
                              `정말 이 계정을 ${nextText}하시겠습니까?`
                            );
                            if (!ok) return;
                            handleToggleUserStatus(
                              user.id,
                              Number(user.is_deleted)
                            );
                          }}
                          onLabel="ON"
                          offLabel="OFF"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // 모바일/태블릿: 카드형
        <div style={{ display: "grid", gap: 12, width: "100%" }}>
          {users.map((user, index) => {
            const active = Number(user.is_deleted) !== 1;
            return (
              <div
                key={user.id}
                style={{ ...cardContainerBaseStyle, opacity: active ? 1 : 0.6 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => handleSelectOne(user.id)}
                  />
                  <div style={{ fontSize: 13, color: "#666" }}>
                    No {(currentPage - 1) * pageSize + index + 1} · 코드 user-
                    {user.id}
                  </div>
                </div>
                <div
                  style={cardLink}
                  onClick={() => handleOpenDetailClick(user.id)}
                >
                  {user.username}
                </div>

                <div style={cardRow}>
                  <span style={cardLabel}>이메일</span>
                  <span style={cardValue}>{user.email}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>전화번호</span>
                  <span style={cardValue}>{user.phone}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>권한</span>
                  <span style={cardValue}>{user.role}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>생성일시</span>
                  <span style={cardValue}>
                    {formatLocalReadable(user.created_at)}
                  </span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>수정일시</span>
                  <span style={cardValue}>
                    {formatLocalReadable(user.updated_at)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  <button
                    style={resetButtonStyle}
                    onClick={() => handleResetPassword(user)}
                    disabled={confirming}
                  >
                    {confirming ? "처리 중..." : "비밀번호\n초기화"}
                  </button>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    <ToggleSwitch
                      size="sm"
                      checked={active}
                      disabled={togglingId === user.id}
                      onChange={async (next) => {
                        const willDeactivate = !next;
                        const nextText = willDeactivate ? "비활성화" : "복구";
                        const ok = await showConfirm(
                          `정말 이 계정을 ${nextText}하시겠습니까?`
                        );
                        if (!ok) return;
                        handleToggleUserStatus(
                          user.id,
                          Number(user.is_deleted)
                        );
                      }}
                      onLabel="ON"
                      offLabel="OFF"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이징 */}
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
const errorBoxStyle = {
  border: "1px solid #ffd5d5",
  background: "#fff5f5",
  color: "#c53030",
  padding: "14px 16px",
  borderRadius: 8,
  marginBottom: 16,
};
const resetButtonStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const cardRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "6px 0",
  borderBottom: "1px dashed #f0f0f0",
};
const cardLabel = { color: "#888", fontSize: 13, minWidth: 80 };
const cardValue = { color: "#222", fontSize: 14, wordBreak: "break-all" };
const cardLink = {
  color: "#0070f3",
  fontWeight: 600,
  marginTop: 8,
  marginBottom: 6,
  cursor: "pointer",
  fontSize: 16,
};
const adminTableHeadStyle = { background: "#f9f9f9" };
const emptyBoxStyle = {
  border: "1px dashed #d0d7de",
  background: "#fafbfc",
  color: "#57606a",
  padding: "18px 16px",
  borderRadius: 8,
  textAlign: "center",
};
const cardContainerBaseStyle = {
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
};
const fetchBarStyle = {
  height: 2,
  width: "100%",
  background:
    "linear-gradient(90deg, rgba(0,112,243,0) 0%, rgba(0,112,243,.6) 50%, rgba(0,112,243,0) 100%)",
  animation: "barPulse 1s linear infinite",
  margin: "8px 0",
};

const skeletonGridStyle = { display: "grid", gap: 12 };
