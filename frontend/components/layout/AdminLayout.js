import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ pageTitle, children }) {
  return (
    <div
      className="admin-layout"
      style={{
        display: "flex",
        minHeight: "100vh", // ✅ 전체 높이 유지
      }}
    >
      <AdminSidebar />

      <main
        className="admin-main"
        style={{
          flex: 1,
          marginLeft: "150px", // ✅ 사이드바 너비만큼 밀기
          overflowY: "auto", // ✅ 스크롤 가능하게
          backgroundColor: "inherit",
          height: "100vh", // ✅ 메인 영역 높이 고정
        }}
      >
        {/* 공통 영역 (제목 + 페이지 컨텐츠) */}
        <div style={{ padding: "20px" }}>
          {/* pageTitle 있으면 <h1> 표시 */}
          {pageTitle && (
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginTop: "0px",
                marginBottom: "20px",
              }}
            >
              {pageTitle}
            </h1>
          )}
          {/* 페이지별 내용 */}
          {children}
        </div>
      </main>
    </div>
  );
}
