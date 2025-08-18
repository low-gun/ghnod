// frontend/pages/checkout.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import CartItemCard from "@/components/cart/CartItemCard";
import CartSummary from "@/components/cart/CartSummary";
import { useGlobalAlert } from "@/stores/globalAlert";

export default function CheckoutPage() {
  const buyNowTriggeredRef = useRef(false);
  const router = useRouter();
  const { ids, itemIds, point, couponId, mode, buyNow } = router.query; // ids, mode 추가
  const selectedIds = (ids || itemIds || "").toString().trim(); // 통합 사용
  const { showAlert } = useGlobalAlert();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cartItems, setCartItems] = useState([]);

  const [availableCoupons, setAvailableCoupons] = useState(null);
  const [availablePoint, setAvailablePoint] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pointUsed, setPointUsed] = useState(Number(point) || 0);
  const [userInfo, setUserInfo] = useState(null);

  /** /user 데이터 로딩 (게스트 차단) */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await api.get("/user");
        const user = res.data.user || {};
        if (!user?.id) {
          const qs = new URLSearchParams(router.query).toString();
          router.replace(
            `/login?redirect=${encodeURIComponent(`/checkout${qs ? "?" + qs : ""}`)}`
          );
          return;
        }
        setUserInfo(user);
        setAvailablePoint(Number(user.point_balance ?? 0));
        setAvailableCoupons(Array.isArray(user.coupons) ? user.coupons : []);
      } catch {
        const qs = new URLSearchParams(router.query).toString();
        router.replace(
          `/login?redirect=${encodeURIComponent(`/checkout${qs ? "?" + qs : ""}`)}`
        );
      }
    };
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 금액 계산 */
  function calcFinalAmount(items, couponAmount, pointUsedValue) {
    const total = items.reduce(
      (sum, it) => sum + it.unit_price * it.quantity,
      0
    );
    const discount = Number(couponAmount || 0);
    const points = Number(pointUsedValue || 0);
    return Math.max(0, total - discount - points);
  }

  /** cartItems 로딩 (로그인 이후) */
  useEffect(() => {
    if (!router.isReady || !userInfo?.id) return;

    const fetchCartItems = async () => {
      try {
        // 1) 신규: buyNow 모드 - 해당 ids만 로딩 (장바구니의 다른 품목은 영향 없음)
        if (mode === "buyNow") {
          let idsToUse = selectedIds;

          // ids가 비어있으면 sessionStorage 백업 활용
          if (!idsToUse && typeof window !== "undefined") {
            try {
              const raw = sessionStorage.getItem("BUY_NOW_IDS");
              const arr = raw ? JSON.parse(raw) : null;
              if (Array.isArray(arr) && arr.length) {
                idsToUse = arr.join(",");
                // URL 정리 (shallow)
                router.replace(
                  {
                    pathname: router.pathname,
                    query: { ...router.query, ids: idsToUse },
                  },
                  undefined,
                  { shallow: true }
                );
              }
            } catch {}
          }

          if (!idsToUse) {
            setMessage("선택된 상품이 없습니다.");
            return;
          }

          const idArr = idsToUse
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
          if (!idArr.length) {
            setMessage("선택된 상품이 없습니다.");
            return;
          }

          // buyNow 아이템을 가져와야 하므로 excludeBuyNow 파라미터는 넣지 않음
          const res = await api.get("/cart/items", { params: { ids: idArr } });
          setCartItems(res.data.items || []);
          return;
        }

        // 2) (레거시) JSON buyNow 파라미터 지원 - 필요 시 유지
        if (buyNow && !buyNowTriggeredRef.current) {
          buyNowTriggeredRef.current = true;
          const decoded = decodeURIComponent(buyNow);
          const parsedItem = JSON.parse(decoded);

          const res = await api.post("/cart/items?buyNow=1", {
            schedule_id: parsedItem.schedule_id,
            quantity: parsedItem.quantity || 1,
            unit_price: parsedItem.unit_price,
            discount_price: parsedItem.discount_price || 0,
            type: "buyNow",
          });

          const cart_item_id = res.data?.item?.id;
          if (!cart_item_id) throw new Error("cart_item_id 없음");

          setCartItems([{ ...parsedItem, id: cart_item_id }]);

          router.replace({
            pathname: router.pathname,
            query: { ids: String(cart_item_id), mode: "buyNow" }, // 통일
          });
          return;
        }

        // 3) 일반 선택 ids 흐름 (장바구니에서 선택해서 온 경우)
        if (selectedIds) {
          const idArr = selectedIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
          if (!idArr.length) {
            setMessage("선택된 상품이 없습니다.");
            return;
          }

          const res = await api.get("/cart/items", {
            params: { ids: idArr, excludeBuyNow: "true" }, // 일반 흐름에서는 buyNow 제외
          });
          setCartItems(res.data.items || []);
          return;
        }

        setMessage("선택된 상품이 없습니다.");
      } catch (err) {
        console.error("❌ fetchCartItems 오류:", err);
        setMessage("상품 불러오기 실패");
      }
    };

    fetchCartItems();
  }, [router.isReady, userInfo?.id, mode, selectedIds, buyNow, router]);

  /** 쿠폰 할인 금액 계산 */
  useEffect(() => {
    if (!userInfo?.coupons || cartItems.length === 0) return;

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const couponsWithAmount = userInfo.coupons.map((c) => ({
      ...c,
      amount:
        c.discount_type === "fixed"
          ? Number(c.discount_amount || 0)
          : c.discount_type === "percent"
            ? Math.floor((totalPrice * Number(c.discount_value || 0)) / 100)
            : 0,
    }));

    setAvailableCoupons(couponsWithAmount);
  }, [userInfo, cartItems]);

  /** 쿼리 기반 쿠폰 자동 적용 */
  useEffect(() => {
    if (!couponId || !Array.isArray(availableCoupons) || cartItems.length === 0)
      return;

    const found = availableCoupons.find(
      (c) => String(c.id) === String(couponId)
    );
    if (!found || typeof found.amount !== "number") return;

    setSelectedCoupon({ ...found, _ts: Date.now() });
  }, [couponId, availableCoupons, cartItems]);

  /** 주문 처리 */
  const handleOrder = async () => {
    if (!userInfo?.id) {
      showAlert("로그인이 필요합니다.");
      return;
    }
    if (!selectedIds) return;

    setIsLoading(true);
    setMessage("");

    try {
      const couponAmount =
        selectedCoupon && typeof selectedCoupon.amount === "number"
          ? selectedCoupon.amount
          : 0;
      const amount = calcFinalAmount(cartItems, couponAmount, pointUsed);

      // 무료결제
      if (amount <= 0) {
        try {
          const res = await api.post("/payments/free-checkout", {
            cart_item_ids: selectedIds.split(",").map(Number),
            coupon_id: selectedCoupon?.id || null,
            used_point: pointUsed || 0,
          });
          const { orderId } = res.data;
          router.replace(`/orders/${orderId}/complete`);
        } catch (e) {
          setMessage(e?.response?.data?.error || "무료 결제 처리 실패");
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 토스 결제 준비
      const prepareRes = await api.post("/payments/toss/prepare", {
        cart_item_ids: selectedIds.split(",").map((id) => Number(id)),
        coupon_id: selectedCoupon?.id || null,
        used_point: pointUsed || 0,
      });

      const {
        orderId: preparedOrderId,
        orderName,
        customerName,
        customerEmail,
        amount: serverAmount,
        clientKey,
        successUrl,
        failUrl,
      } = prepareRes.data;

      const safeOrderId = String(preparedOrderId || "")
        .replace(/[^A-Za-z0-9_-]/g, "")
        .slice(0, 64);

      if (safeOrderId.length < 6) {
        setIsLoading(false);
        setMessage("주문번호 형식 오류: 관리자에게 문의하세요.");
        return;
      }

      if (Number(serverAmount) !== Number(amount)) {
        setMessage("금액 검증 실패. 페이지를 새로고침 후 다시 시도하세요.");
        setIsLoading(false);
        return;
      }

      if (!clientKey) {
        setIsLoading(false);
        setMessage("결제키 로딩 실패: clientKey가 없습니다.");
        return;
      }

      const toss = await loadTossPayments(clientKey);
      if (!toss || typeof toss.requestPayment !== "function") {
        setIsLoading(false);
        setMessage("결제 모듈 초기화 실패");
        return;
      }

      try {
        await toss.requestPayment("카드", {
          amount,
          orderId: safeOrderId,
          orderName,
          successUrl,
          failUrl,
          customerName: customerName || userInfo?.username || "",
          customerEmail: customerEmail || userInfo?.email || "",
        });
      } catch (e) {
        const msg = String(e?.message || "");
        const code = String(e?.code || "");
        const isUserCancel =
          code === "USER_CANCEL" ||
          code === "PAY_PROCESS_CANCELED" ||
          /취소/.test(msg);
        if (isUserCancel) {
          setIsLoading(false);
          return;
        }
        throw e;
      }
    } catch (err) {
      console.error("❌ 결제 시작 실패:", err);
      setMessage(err?.response?.data?.error || "결제 시작에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const validCouponDiscount =
    selectedCoupon &&
    typeof selectedCoupon.amount === "number" &&
    !isNaN(selectedCoupon.amount) &&
    selectedCoupon.amount > 0
      ? selectedCoupon.amount
      : 0;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: "19.2px", marginBottom: 16 }}>주문 확인</h2>

      {cartItems.length === 0 ? (
        <p style={{ textAlign: "center", width: "100%", marginTop: 40 }}>
          선택한 상품을 불러오는 중입니다...
        </p>
      ) : (
        <div className="checkout-main">
          {/* 좌측: 주문 목록 + 안내/결제수단 */}
          <div className="checkout-left">
            {cartItems
              .filter((it) => it && typeof it === "object" && it.schedule_id)
              .map((it) => (
                <CartItemCard key={it.id} item={it} variant="checkout" />
              ))}

            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
                영업일 제외 2일 내에 주문자의 계정으로 안내메일이 발송될
                예정입니다.
              </p>
              <div
                style={{
                  border: ".0625rem solid #ddd",
                  borderRadius: 6,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <strong style={{ display: "block", marginBottom: 8 }}>
                  결제수단
                </strong>

                {/* 라디오 버튼 그룹 (향후 확장 대비) */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      defaultChecked
                    />
                    간편 / 카드결제
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 주문자 정보 + 결제 요약 */}
          <aside className="checkout-right">
            {userInfo && (
              <section
                aria-labelledby="orderer-heading"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  boxShadow: "inset 4px 0 0 #3b82f6",
                }}
              >
                <div
                  id="orderer-heading"
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 6,
                    color: "#0f172a",
                  }}
                >
                  주문자 정보
                </div>
                <div
                  style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}
                >
                  안내 메일은 아래 주소로 발송됩니다.
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {/* 이름 */}
                  <div
                    style={{
                      flex: "1 1 160px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 160,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                        fill="#334155"
                      />
                    </svg>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        주문자
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {userInfo.username || userInfo.email}
                      </div>
                    </div>
                  </div>

                  {/* 이메일 (하이퍼링크 제거) */}
                  <div
                    style={{
                      flex: "1 1 220px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 220,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8 10-5.8V6a2 2 0 0 0-2-2Zm0 5.4-8 4.6-8-4.6V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z"
                        fill="#334155"
                      />
                    </svg>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        이메일
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {userInfo.email}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <CartSummary
              variant="checkout"
              items={cartItems}
              couponDiscount={validCouponDiscount}
              pointUsed={pointUsed}
              onCouponChange={(coupon) => {
                if (!coupon) {
                  setSelectedCoupon(null);
                  return;
                }
                if (cartItems.length === 0) {
                  showAlert(
                    "상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
                  );
                  return;
                }
                const totalPrice = cartItems.reduce(
                  (sum, item) => sum + item.unit_price * item.quantity,
                  0
                );
                const amount =
                  typeof coupon.amount === "number"
                    ? coupon.amount
                    : coupon.discount_type === "fixed"
                      ? Number(coupon.discount_amount || 0)
                      : coupon.discount_type === "percent"
                        ? Math.floor(
                            (totalPrice * Number(coupon.discount_value || 0)) /
                              100
                          )
                        : 0;
                setSelectedCoupon({ ...coupon, amount, _ts: Date.now() });
              }}
              onPointChange={setPointUsed}
              couponList={availableCoupons}
              maxPoint={Number(availablePoint ?? 0)}
              onCheckout={handleOrder}
              isLoading={isLoading}
            />

            {message && (
              <p style={{ marginTop: 16, color: "red", fontWeight: "bold" }}>
                {message}
              </p>
            )}
          </aside>

          {/* 반응형 스타일 */}
          <style jsx>{`
            .checkout-main {
              display: flex;
              flex-wrap: wrap;
              align-items: flex-start;
              gap: 24px;
              margin-top: 20px;
            }
            .checkout-left {
              flex: 1 1 auto;
              min-width: 0;
              display: grid;
              gap: 16px;
            }
            .checkout-right {
              flex: 0 0 320px;
              width: 320px;
              max-width: 100%;
              align-self: flex-start;
              position: sticky;
              top: 100px;
            }
            @media (max-width: 1024px) {
              .checkout-main {
                flex-direction: column;
              }
              .checkout-left {
                width: 100%;
              }
              .checkout-right {
                position: static;
                width: 100%;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
