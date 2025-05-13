export default function TabProductInquiry() {
  return (
    <section
      id="inquiry"
      style={{
        padding: "40px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        상품문의
      </h2>

      {/* 문의 없음 안내 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300, // 원하는 높이 조정 가능
          backgroundColor: "#fafafa",
          color: "#888",
          fontSize: 14,
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: 8 }}>상품 문의 기능은 준비 중입니다.</p>
        <p>빠른 시일 내에 오픈될 예정입니다.</p>
      </div>
    </section>
  );
}
