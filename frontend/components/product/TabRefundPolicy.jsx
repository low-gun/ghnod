export default function TabRefundPolicy() {
  return (
    <section
      id="refund"
      style={{
        padding: "40px 0",
        borderBottom: "1px solid #eee",
        marginBottom: 300,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        환불안내
      </h2>

      <div
        style={{
          backgroundColor: "#fafafa",
          color: "#444",
          fontSize: 14,
          borderRadius: 8,
          padding: "30px 20px",
          lineHeight: 1.6,
        }}
      >
        <p>
          (주)오알피컨설팅의 모든 교육 서비스는 「전자상거래법」 등 대한민국
          법령을 준수하며, 아래 환불 규정을 적용합니다.
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 16 }}>
          <li>서비스 시작일 7일 전까지 취소 요청 시 전액 환불됩니다.</li>
          <li>
            서비스 시작일 3일 전까지 취소 요청 시 결제 금액의 50%를 환불합니다.
          </li>
          <li>
            서비스 시작일 이후 또는 서비스 제공이 완료된 경우 환불이 불가합니다.
          </li>
          <li>맞춤형 컨설팅, 1회성 이벤트성 교육은 환불이 불가합니다.</li>
          <li>
            쿠폰·포인트를 사용한 결제의 경우, 사용한 금액은 환불 대상에서
            제외됩니다.
          </li>
        </ul>
        <p style={{ marginTop: 16 }}>
          환불 요청은 고객센터(☎ 02-6952-2843, ✉ hyunjune.park@orp.co.kr)로
          가능하며, 환불은 요청일로부터 7영업일 이내에 처리됩니다.<br></br>카드
          결제 취소는 카드사 정책에 따르며, 계좌 환불 시 송금 수수료가 발생할 수
          있습니다.
        </p>
      </div>
    </section>
  );
}
