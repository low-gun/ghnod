import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";

export default function TossSuccessPage() {
  const router = useRouter();
  const firedRef = useRef(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("결제 승인 중입니다...");

  useEffect(() => {
    if (!router.isReady) return;
    if (firedRef.current) return; // 중복호출 방지 (StrictMode 대비)
    firedRef.current = true;

    // ✅ URLSearchParams로 1차 추출, router.query는 2차 보완
    const search = typeof window !== "undefined" ? window.location.search : "";
    const usp = new URLSearchParams(search);

    const paymentKeyQ = usp.get("paymentKey") || router.query.paymentKey;
    const orderIdQ = usp.get("orderId") || router.query.orderId;
    const amountQ = usp.get("amount") || router.query.amount;

    console.log("[SUCCESS params] fromURL:", {
      paymentKey: usp.get("paymentKey"),
      orderId: usp.get("orderId"),
      amount: usp.get("amount"),
    });
    console.log("[SUCCESS params] fromRouter:", router.query);
    console.log("[SUCCESS params] final:", {
      paymentKey: paymentKeyQ,
      orderId: orderIdQ,
      amount: amountQ,
    });

    // 필수 파라미터 체크
    if (!paymentKeyQ || !orderIdQ || !amountQ) {
      setError("필수 결제 정보가 누락되었습니다.");
      setStatus("");
      return;
    }

    const confirm = async () => {
      try {
        setStatus("결제 승인 중입니다...");
        console.log("[confirm→POST] payload:", {
          paymentKey: paymentKeyQ,
          orderId: orderIdQ,
          amount: Number(amountQ),
        });

        const res = await api.post("/payments/toss/confirm", {
          paymentKey: String(paymentKeyQ),
          orderId: String(orderIdQ),
          amount: Number(amountQ),
        });

        console.log("[confirm←RES] status:", res.status, "data:", res.data);

        if (res.data?.success) {
          setStatus("결제가 승인되었습니다. 주문 페이지로 이동합니다...");
          // ✅ buyNow로 담아둔 아이템 id 캐시 정리
          try { sessionStorage.removeItem("BUY_NOW_IDS"); } catch {}
          router.replace(`/orders/${Number(orderIdQ)}/complete`);
        }
         else {
          console.error("[confirm error(body)]", res.data);
          setError(res.data?.error || "결제 승인에 실패했습니다.");
          setStatus("");
        }
      } catch (err) {
        // ✅ 서버 응답이 있는 400/500 케이스를 자세히 출력
        console.error("[confirm error] status:", err?.response?.status);
        console.error("[confirm error] data:", err?.response?.data);
        console.error("[confirm error] message:", err?.message);

        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "결제 승인 중 오류가 발생했습니다.";
        setError(msg);
        setStatus("");
      }
    };

    confirm();
  }, [router.isReady, router.query, router]);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>결제 완료 처리</h2>
        {status && <p style={{ color: "#3577f1" }}>{status}</p>}
        {error && (
          <>
            <p style={{ color: "#e53935", marginTop: 8 }}>{error}</p>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button
                style={styles.btn}
                onClick={() => router.replace("/cart")}
              >
                장바구니로
              </button>
              <button
                style={{ ...styles.btn, background: "#3577f1", color: "#fff" }}
                onClick={() => router.replace("/mypage")}
              >
                마이페이지
              </button>
            </div>
          </>
        )}
      </div>
    </div>
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
    background: "#f6f8fc",
    cursor: "pointer",
  },
};
