import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head"; // 👈 추가

export default function TossFailPage() {
  const router = useRouter();
  const { code, message, orderId } = router.query;

  useEffect(() => {
    // 여긴 승인 호출 안 함. 사용자가 다시 시도할 수 있게만 안내.
  }, [router.isReady]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>결제 실패</h2>
        <p style={{ margin: "8px 0", color: "#e53935" }}>
          {message || "결제가 완료되지 않았습니다."}
        </p>
        {code && (
  <p style={{ marginTop: 4, color: "#555" }}>
    오류 코드: <strong>{code}</strong>
  </p>
)}
{orderId && (

          <p style={{ marginTop: 4, color: "#555" }}>
            주문 번호: <strong>{orderId}</strong>
          </p>
        )}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button style={styles.btn} onClick={() => router.replace("/cart")}>
            장바구니로
          </button>
          <button
            style={{ ...styles.btn, background: "#3577f1", color: "#fff" }}
            onClick={() => router.replace("/checkout")}
          >
            결제 다시 시도
          </button>
        </div>
      </div>
      </div>
    </>
  );
}


const styles = {
  wrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    border: "1px solid #e8ecf4",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  },
  title: { marginTop: 0, marginBottom: 12, fontSize: 20 },
  btn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d6dbe6",
    background: "#3577f1",
    color: "#fff",
    cursor: "pointer",
  },
};
