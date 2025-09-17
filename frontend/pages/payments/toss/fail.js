import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function TossFailPage() {
  const router = useRouter();

  // URLSearchParams 우선 확보 (router.isReady 전에도 접근 가능)
  const search = typeof window !== "undefined" ? window.location.search : "";
  const usp = useMemo(() => new URLSearchParams(search), [search]);

  // URL과 router.query 양쪽에서 보완적으로 추출
  const codeQ = usp.get("code") || router.query.code;
  const messageQ = usp.get("message") || router.query.message;
  const orderIdQ = usp.get("orderId") || router.query.orderId;

  // 메시지 가독화
  const humanize = (code, msg) => {
    const s = String(msg || "");
    const c = String(code || "");
    if (c === "USER_CANCEL" || /사용자.*취소|결제를\s*취소/.test(s)) {
      return "사용자가 결제를 취소했습니다.";
    }
    if (/유효.*시간|만료/.test(s)) {
      return "결제 유효 시간이 만료되었습니다. 다시 시도해주세요.";
    }
    if (/한도|승인.*거절|결제.*실패/.test(s)) {
      return "결제가 거절되었습니다. 다른 카드 또는 결제수단으로 다시 시도하세요.";
    }
    return s || "결제가 완료되지 않았습니다.";
  };

  useEffect(() => {
    // 승인 호출 없음. 단순 안내 전용.
  }, [router.isReady]);

  const displayMessage = humanize(codeQ, messageQ);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.title}>결제 실패</h2>
          <p style={{ margin: "8px 0", color: "#e53935" }}>
            {displayMessage}
          </p>

          {codeQ ? (
            <p style={{ marginTop: 4, color: "#555" }}>
              오류 코드: <strong>{String(codeQ)}</strong>
            </p>
          ) : null}

          {orderIdQ ? (
            <p style={{ marginTop: 4, color: "#555" }}>
              주문 번호: <strong>{String(orderIdQ)}</strong>
            </p>
          ) : null}

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button style={styles.btnGhost} onClick={() => router.replace("/cart")}>
              장바구니로
            </button>
            <button
              style={styles.btnPrimary}
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
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d6dbe6",
    background: "#f6f8fc",
    color: "#111827",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #3577f1",
    background: "#3577f1",
    color: "#fff",
    cursor: "pointer",
  },
};
