import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import CartItemCard from "@/components/cart/CartItemCard";
import CartSummary from "@/components/cart/CartSummary";
import { useRef } from "react"; // 이미 있으면 생략
import { useGlobalAlert } from "@/stores/globalAlert"; // ✅ 추가

export default function CheckoutPage() {
  const buyNowTriggeredRef = useRef(false); // ✅ 추가
  const router = useRouter();
  const { itemIds, point, couponId } = router.query;
  const { showAlert } = useGlobalAlert(); // ✅ 추가

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [isBuyNow, setIsBuyNow] = useState(false); // ✅ 추가

  console.log("🧪 초기 isBuyNow 상태:", isBuyNow); // ✅ 위치 A
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availablePoint, setAvailablePoint] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pointUsed, setPointUsed] = useState(Number(point) || 0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [userInfo, setUserInfo] = useState(null);
  const [buyNowHandled, setBuyNowHandled] = useState(false); // 🔧 이 줄 추가
  useEffect(() => {
    console.log("🔍 [checkout.js] useEffect 진입"); // ✅ 여기에 추가

    const fetchInitial = async () => {
      try {
        console.log("🚀 fetchInitial 실행됨"); // ✅ 여기에 추가
        const res = await api.get("/user");

        console.log("📥 [checkout.js] /user 응답:", res.data);
        console.log(
          "🪙 point_balance 타입 확인:",
          typeof res.data.point_balance,
          res.data.point_balance
        );
        setUserInfo(res.data);
        setAvailablePoint(res.data.point_balance || 0);
      } catch (err) {
        console.error("❌ 유저 정보 조회 실패", err);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const fetchCartItems = async () => {
      try {
        // ✅ buyNow 흐름만 ref, handled 체크
        if (router.query.buyNow && !buyNowTriggeredRef.current) {
          buyNowTriggeredRef.current = true;

          const decoded = decodeURIComponent(router.query.buyNow);
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

          setIsBuyNow(true);
          setCartItems([{ ...parsedItem, id: cart_item_id }]);
          setBuyNowHandled(true);

          router.replace({
            pathname: router.pathname,
            query: { itemIds: String(cart_item_id) },
          });

          return;
        }

        // ✅ 일반 itemIds 흐름은 별도 처리
        if (router.query.itemIds) {
          setIsBuyNow(false);

          const res = await api.get("/cart/items", {
            params: {
              ids: router.query.itemIds.split(","),
              excludeBuyNow: "true",
            },
          });

          setCartItems(res.data.items || []);
          setBuyNowHandled(true);
          return;
        }

        setMessage("선택된 상품이 없습니다.");
      } catch (err) {
        console.error("❌ fetchCartItems 오류:", err);
        setMessage("상품 불러오기 실패");
      }
    };

    fetchCartItems();
  }, [router.isReady, router.query]);

  // ✅ cartItems 로딩 후 쿠폰 할인 금액 계산
  // ✅ 1) 쿠폰 목록 계산
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

    console.log("✅ [checkout.js] 계산된 쿠폰 리스트:", couponsWithAmount);
    setAvailableCoupons(couponsWithAmount);
  }, [userInfo, cartItems]);

  useEffect(() => {
    if (!couponId || availableCoupons.length === 0 || cartItems.length === 0)
      return;

    console.log("🧩 쿠폰 자동 적용 시점 진입");
    console.log("🧾 couponId:", couponId);
    console.log("💡 availableCoupons:", availableCoupons);
    console.log("🧮 cartItems:", cartItems);

    const found = availableCoupons.find(
      (c) => String(c.id) === String(couponId)
    );
    if (!found || typeof found.amount !== "number") {
      console.log("❌ 해당 쿠폰을 찾을 수 없거나 amount 없음:", found);
      return;
    }

    console.log("✅ 쿼리 기반 쿠폰 자동 적용:", found, "amount:", found.amount);
    setSelectedCoupon({ ...found, _ts: Date.now() });
  }, [couponId, availableCoupons, cartItems]);

  useEffect(() => {
    console.log("🧾 useEffect - selectedCoupon 변경 감지됨:", selectedCoupon);
  }, [selectedCoupon]);

  const handleOrder = async () => {
    console.log("🧪 [handleOrder] 현재 isBuyNow:", isBuyNow); // ✅ 위치 C
    if (!itemIds) return;
    setIsLoading(true);
    setMessage("");

    console.log("🧪 [handleOrder] buyNow 쿼리값:", router.query.buyNow); // ✅ 위치 1

    const payload = {
      cart_item_ids: itemIds.split(",").map((id) => Number(id)),
      coupon_id: selectedCoupon?.id || null,
      used_point: pointUsed || 0,
      payment_method: paymentMethod,
    };

    try {
      console.log("🚨 주문 payload:", payload);
      const res = await api.post("/orders", payload);
      const { order_id } = res.data;

      let paymentSuccess = false;

      try {
        await api.put(`/orders/${order_id}`);
        paymentSuccess = true;
      } catch (err) {
        console.error("❌ 주문 상태 업데이트 실패:", err.response?.data);
        setMessage("⚠️ 결제는 완료되었으나 주문 상태 업데이트에 실패했습니다.");
      }
      if (paymentSuccess) {
        router.push(`/orders/${order_id}/complete`);
      }
    } catch (err) {
      console.error("❌ 주문 생성 오류:", err);
      setMessage("❌ 주문 생성에 실패했습니다.");
    } finally {
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

  console.log("🧾 렌더 직전 selectedCoupon 상태:", selectedCoupon);
  console.log("🧾 계산된 couponDiscount 값:", validCouponDiscount);
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>주문 확인</h2>

      {cartItems.length === 0 ? (
        <p style={{ textAlign: "center", width: "100%", marginTop: 40 }}>
          선택한 상품을 불러오는 중입니다...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 24,
            marginTop: 20,
          }}
        >
          {/* 카드 리스트 */}
          <div
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              display: "grid",
              gridTemplateColumns:
                cartItems.length === 1
                  ? "1fr"
                  : "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {cartItems
              .filter((it) => it && typeof it === "object" && it.schedule_id)
              .map((it) => (
                <CartItemCard key={it.id} item={it} disableActions />
              ))}
            <div style={{ gridColumn: "1 / -1", marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
                결제 완료 후 수강 안내 메일이 발송됩니다.
              </p>

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <strong style={{ display: "block", marginBottom: 8 }}>
                  결제수단
                </strong>
                <label
                  style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                >
                  <input
                    type="radio"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: 6 }}
                  />
                  카드 결제
                </label>
                <label style={{ fontSize: 14, display: "block" }}>
                  <input
                    type="radio"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: 6 }}
                  />
                  무통장 입금
                </label>
              </div>
            </div>
          </div>

          {/* 요약 */}
          <div
            style={{
              flex: "0 0 320px",
              maxWidth: "100%",
              width: 320,
              alignSelf: "flex-start",
              position: "sticky",
              top: 100,
            }}
          >
            {userInfo && (
              <div
                style={{
                  background: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                <strong>주문자:</strong> {userInfo.username || userInfo.email}
                <br />
                <strong>이메일:</strong> {userInfo.email}
              </div>
            )}

            <CartSummary
              items={cartItems}
              couponDiscount={validCouponDiscount}
              pointUsed={pointUsed}
              onCouponChange={(coupon) => {
                console.log("💡 쿠폰 선택됨:", coupon);
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

                // ✅ amount가 이미 있는 경우 그대로 쓰고, 없으면 계산해서 세팅
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

                console.log("✅ 최종 쿠폰 할인 금액:", amount);
                setSelectedCoupon({ ...coupon, amount, _ts: Date.now() }); // ✅ 리렌더 보장
                console.log("🧾 상태로 저장한 selectedCoupon:", {
                  ...coupon,
                  amount,
                });
              }}
              onPointChange={setPointUsed}
              couponList={availableCoupons.length > 0 ? availableCoupons : null}
              maxPoint={typeof availablePoint === "number" ? availablePoint : 0}
              onCheckout={handleOrder}
              isLoading={isLoading} // ✅ 이 줄 추가
              checkoutMode
            />

            {message && (
              <p style={{ marginTop: 16, color: "red", fontWeight: "bold" }}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
