export default function TabRefundPolicy() {
  return (
    <section
      id="refund"
      style={{
        padding: "40px 0",
        borderBottom: "1px solid #eee",
        marginBottom: 300, // ✅ 아래 여백 확보
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        환불안내
      </h2>

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
        <p>결제 후 7일 이내에는 100% 환불이 가능합니다.</p>
        <p>교육 시작 후에는 환불이 불가합니다.</p>
        <p>자세한 사항은 고객센터로 문의 주세요.</p>
      </div>
    </section>
  );
}
