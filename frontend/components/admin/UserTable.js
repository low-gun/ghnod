import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // ✅ 추가
import "react-datepicker/dist/react-datepicker.css";
import api from "@/lib/api";
import ExcelDownloadButton from "@/components/common/ExcelDownloadButton";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchFilter from "@/components/common/SearchFilter";
import { useMemo } from "react";
import PaginationControls from "@/components/common/PaginationControls";
import PageSizeSelector from "@/components/common/PageSizeSelector"; // 상단에 추가
export default function UserTable({ onResetPassword }) {
  const router = useRouter(); // ✅ 추가
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [resetTargetId, setResetTargetId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null); // 비활성화 처리 중인 유저 ID
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  useEffect(() => {
    if (router.query.tab && router.query.tab !== "list") return;
    // ✅ query.tab이 'list'가 아닌 경우 fetchUsers 금지

    const delayDebounceFn = setTimeout(() => {
      fetchUsers(); // ✅ 300ms 뒤에 fetchUsers 호출
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType, showDeleted, router.query.tab]);

  // URL 쿼리 갱신 함수
  const handleResetPassword = async (userId) => {
    setConfirming(true);
    try {
      await onResetPassword(userId);
      toast.success("비밀번호가 초기화되었습니다.");
    } catch (err) {
      toast.error("비밀번호 초기화 실패");
    } finally {
      setConfirming(false);
      setResetTargetId(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = users.map((user) => user.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const handleSort = (key) => {
    const newSort =
      !sortConfig || sortConfig.key !== key
        ? { key, direction: "asc" }
        : {
            key,
            direction: sortConfig.direction === "asc" ? "desc" : "asc",
          };
    setSortConfig(newSort);
    setCurrentPage(1);
  };

  const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const renderArrow = (key) => {
    const baseStyle = { marginLeft: "6px", fontSize: "12px" };
    if (!sortConfig || key !== sortConfig.key)
      return <span style={{ ...baseStyle, color: "#ccc" }}>↕</span>;
    return (
      <span style={{ ...baseStyle, color: "#000" }}>
        {sortConfig.direction === "ascending" ? "▲" : "▼"}
      </span>
    );
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      if (searchType === "username")
        return u.username?.toLowerCase().includes(q);
      if (searchType === "email") return u.email?.toLowerCase().includes(q);
      if (searchType === "phone") return u.phone?.toLowerCase().includes(q);
      if (searchType === "role") return u.role?.toLowerCase().includes(q);
      if (searchType === "created_at") {
        const createdAt = new Date(u.created_at);
        if (startDate && createdAt < startDate) return false;
        if (endDate && createdAt > endDate) return false;
        return true;
      }

      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, searchType, startDate, endDate]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig) return filteredUsers;
    const { key, direction } = sortConfig;
    return [...filteredUsers].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedUsers.length / pageSize);
  }, [sortedUsers, pageSize]);
  const handleToggleUserStatus = async (userId, currentStatus) => {
    setTogglingId(userId);
    try {
      await api.put(`/admin/users/${userId}/status`, {
        is_deleted: currentStatus === 0 ? 1 : 0,
      });

      toast.success("계정 상태가 변경되었습니다.");

      // 👉 api 호출 후 다시 리스트 불러오기
      const res = await api.get("/admin/users", { params: { showDeleted } });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error("계정 상태 변경 실패");
    } finally {
      setTogglingId(null);
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", {
        params: {
          searchType,
          searchQuery,
          showDeleted,
        },
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("❌ 사용자 목록 조회 실패:", err);
      toast.error("사용자 목록 조회 실패");
    }
  };
  const pagedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage, pageSize]);
  return (
    <div>
      {/* 🔍 검색 필터: 좌측 / 엑셀 + 페이지당 수: 우측 */}
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
        {/* 왼쪽: 필터 */}
        <SearchFilter
          searchType={searchType}
          setSearchType={setSearchType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchOptions={[
            { value: "username", label: "이름", type: "text" },
            { value: "email", label: "이메일", type: "text" },
            { value: "phone", label: "전화번호", type: "text" },
            {
              value: "role",
              label: "권한",
              type: "select",
              options: [
                { value: "user", label: "user" },
                { value: "admin", label: "admin" },
              ],
            },
            { value: "created_at", label: "가입일", type: "date" },
          ]}
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

        {/* 오른쪽: 페이지 개수 + 다운로드 */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label
            style={{
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1);
              }}
            />
            비활성 포함
          </label>
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
            data={sortedUsers.map((u) => ({
              코드: `user-${u.id}`,
              이름: u.username,
              이메일: u.email,
              전화번호: u.phone,
              권한: u.role,
              생성일시: formatDate(u.created_at),
              수정일시: formatDate(u.updated_at),
            }))}
          />
        </div>

        {/* 📋 테이블 */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                <th style={thCenter}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === pagedUsers.length &&
                      pagedUsers.every((u) => selectedIds.includes(u.id))
                    }
                  />
                </th>
                <th style={thCenter}>No</th>
                <th style={thCenter} onClick={() => handleSort("id")}>
                  코드 {renderArrow("id")}
                </th>
                <th style={thCenter} onClick={() => handleSort("username")}>
                  이름 {renderArrow("username")}
                </th>
                <th style={thCenter} onClick={() => handleSort("email")}>
                  이메일 {renderArrow("email")}
                </th>
                <th style={thCenter} onClick={() => handleSort("phone")}>
                  전화번호 {renderArrow("phone")}
                </th>
                <th style={thCenter} onClick={() => handleSort("role")}>
                  권한 {renderArrow("role")}
                </th>
                <th style={thCenter} onClick={() => handleSort("created_at")}>
                  생성일시 {renderArrow("created_at")}
                </th>
                <th style={thCenter} onClick={() => handleSort("updated_at")}>
                  수정일시 {renderArrow("updated_at")}
                </th>
                <th style={thCenter}>비밀번호</th>
                <th style={thCenter}>상태</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={tdCenter}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                    />
                  </td>
                  <td style={tdCenter}>
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td style={tdCenter}>user-{user.id}</td>
                  <td
                    style={{ ...tdLink, cursor: "pointer" }}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    {user.username}
                  </td>
                  <td style={tdCenter}>{user.email}</td>
                  <td style={tdCenter}>{user.phone}</td>
                  <td style={tdCenter}>{user.role}</td>
                  <td style={tdCenter}>{formatDate(user.created_at)}</td>
                  <td style={tdCenter}>{formatDate(user.updated_at)}</td>
                  <td style={tdCenter}>
                    <button
                      style={resetButtonStyle}
                      onClick={() => setResetTargetId(user)}
                      disabled={confirming && resetTargetId === user.id}
                    >
                      {confirming && resetTargetId === user.id
                        ? "처리 중..."
                        : "초기화"}
                    </button>
                  </td>
                  <td style={tdCenter}>
                    <button
                      style={{
                        ...resetButtonStyle,
                        marginLeft: "8px",
                        backgroundColor:
                          Number(user.is_deleted) === 1 ? "#6c757d" : "#e74c3c",
                      }}
                      onClick={() =>
                        handleToggleUserStatus(user.id, Number(user.is_deleted))
                      }
                      disabled={togglingId === user.id}
                    >
                      {togglingId === user.id
                        ? "처리 중..."
                        : Number(user.is_deleted) === 1
                          ? "복구"
                          : "비활성화"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📄 페이징 */}
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* ✅ 확인 모달 */}
        {resetTargetId && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <p>정말 이 사용자의 비밀번호를 초기화하시겠습니까?</p>
              <div style={{ marginTop: "16px", textAlign: "right" }}>
                <button
                  onClick={() => setResetTargetId(null)}
                  style={{
                    ...resetButtonStyle,
                    backgroundColor: "#ccc",
                    color: "#000",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => handleResetPassword(resetTargetId)}
                  style={{ ...resetButtonStyle, marginLeft: "8px" }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div> // ✅ 이 div가 return 내부 JSX 닫는 태그
  );
}

const tdCenter = {
  padding: "12px",
  textAlign: "center",
  borderBottom: "1px solid #eee", // ✅ 여기서 라인 처리
};
const thCenter = { ...tdCenter, fontWeight: "bold", cursor: "pointer" };
const tdLink = { ...tdCenter, color: "#0070f3" };
const resetButtonStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  background: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modalStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  width: "360px",
};
