import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import CartSummary from "@/components/cart/CartSummary";
import { useCartContext } from "@/context/CartContext";
import CartItemCard from "@/components/cart/CartItemCard";
import { useGlobalAlert } from "@/stores/globalAlert";
import { useGlobalConfirm } from "@/stores/globalConfirm";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartReady, refreshCart } = useCartContext();
  const { showAlert } = useGlobalAlert();
  const { showConfirm } = useGlobalConfirm();

  const [selectedItems, setSelectedItems] = useState([]);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pointUsed, setPointUsed] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availablePoint, setAvailablePoint] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // 초기 선택: 아이템 모두 선택
  useEffect(() => {
    if (!cartReady || cartItems.length === 0) return;
    setSelectedItems(cartItems.map((it) => it.id));
  }, [cartReady, cartItems]);

  // cartReady가 false면 1회 갱신
  useEffect(() => {
    if (!cartReady) refreshCart();
  }, [cartReady, refreshCart]);

  // 유저 쿠폰/포인트 fetch
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get("/user");
        setAvailablePoint(res.data.point_balance || 0);
        setAvailableCoupons(res.data.coupons || []);
      } catch (err) {
        console.error("유저 정보 불러오기 실패", err);
      }
    };
    fetchUserInfo();
  }, []);
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get("/user");

        const user = res.data.user || {};
        setAvailablePoint(user.point_balance || 0);
        setAvailableCoupons(user.coupons || []);
      } catch (err) {
        console.error("유저 정보 불러오기 실패", err);
      }
    };

    fetchUserInfo();
  }, []);
  // 파생값 메모
  const isAllChecked = useMemo(() => {
    if (cartItems.length === 0) return false;
    const set = new Set(selectedItems);
    return cartItems.every((it) => set.has(it.id));
  }, [cartItems, selectedItems]);

  const selectedCartItems = useMemo(
    () => cartItems.filter((it) => selectedItems.includes(it.id)),
    [cartItems, selectedItems]
  );

  const selectedCount = selectedItems.length;

  const selectedTotal = useMemo(() => {
    return selectedCartItems.reduce((sum, it) => {
      const unit = Number(it.unit_price || 0);
      const disc = Number(it.discount_price || 0);
      return sum + (unit - disc) * Number(it.quantity || 1);
    }, 0);
  }, [selectedCartItems]);

  // 핸들러 메모
  const handleCheckAll = useCallback(
    (checked) => setSelectedItems(checked ? cartItems.map((it) => it.id) : []),
    [cartItems]
  );

  const handleItemCheck = useCallback((id, checked) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const handleQuantityChange = useCallback(
    async (item, diff) => {
      const newQty = item.quantity + diff;
      if (newQty < 1) return;
      try {
        await api.put(`/cart/items/${item.id}`, {
          quantity: newQty,
          unit_price: item.unit_price,
          discount_price: item.discount_price ?? 0,
        });
        refreshCart();
      } catch (err) {
        showAlert("수량 변경 실패");
      }
    },
    [refreshCart, showAlert]
  );

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    const ok = await showConfirm(
      `선택된 ${selectedItems.length}개를 삭제하시겠습니까?`
    );
    if (!ok) return;
    try {
      await Promise.all(
        selectedItems.map((id) => api.delete(`/cart/items/${id}`))
      );
      refreshCart();
      setSelectedItems([]);
    } catch (err) {
      showAlert("삭제 실패");
    }
  }, [selectedItems, refreshCart, showAlert, showConfirm]);

  const handleDeleteSingle = useCallback(
    async (id) => {
      const ok = await showConfirm("이 항목을 삭제하시겠습니까?");
      if (!ok) return;
      try {
        await api.delete(`/cart/items/${id}`);
        refreshCart();
        setSelectedItems((prev) => prev.filter((x) => x !== id));
      } catch (err) {
        showAlert("삭제 실패");
      }
    },
    [refreshCart, showAlert, showConfirm]
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>장바구니</h2>

      {!cartReady ? null : cartItems.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">🛒</div>
          <div className="empty__title">장바구니가 비어 있습니다</div>
          <div className="empty__desc">
            원하는 상품을 장바구니에 담아보세요.
          </div>
          <style jsx>{`
            .empty {
              text-align: center;
              width: 100%;
              padding: 56px 0 80px 0;
              color: #434b5c;
              display: flex;
              flex-direction: column;
              align-items: center;
              border-radius: 16px;
              background: #f8fafc;
              box-shadow: 0 2px 12px rgba(30, 60, 110, 0.03);
            }
            .empty__icon {
              font-size: 64px;
              opacity: 0.18;
              margin-bottom: 24px;
            }
            .empty__title {
              font-size: 21px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -1px;
            }
            .empty__desc {
              color: #7e869a;
              margin-bottom: 30px;
              font-size: 15.5px;
              line-height: 1.6;
              font-weight: 400;
            }
            .empty__cta {
              background: linear-gradient(90deg, #3b82f6 65%, #2563eb 100%);
              color: #fff;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              padding: 13px 36px;
              cursor: pointer;
              box-shadow: 0 2px 12px 0 rgba(70, 110, 255, 0.07);
              transition:
                transform 0.08s ease,
                box-shadow 0.12s ease,
                opacity 0.12s ease;
            }
            .empty__cta:hover {
              box-shadow: 0 6px 18px 0 rgba(70, 110, 255, 0.18);
              transform: translateY(-1px);
            }
            .empty__cta:active {
              transform: translateY(0);
              opacity: 0.9;
            }
          `}</style>
        </div>
      ) : (
        <div className="cart-main">
          {/* 좌측: 전체선택/선택삭제 + 카드리스트 */}
          <div className="cart-left">
            <div className="toolbar">
              <label className="checkall">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => handleCheckAll(e.target.checked)}
                />
                <span>전체선택</span>
              </label>

              <button
                className="btn-del"
                onClick={handleDeleteSelected}
                disabled={selectedItems.length === 0}
                title={
                  selectedItems.length === 0
                    ? "삭제할 항목이 없습니다"
                    : "선택 삭제"
                }
              >
                선택 삭제
              </button>
            </div>

            <div className="grid-cards">
              {cartItems.map((it) => (
                <CartItemCard
                  key={it.id}
                  variant="cart"
                  item={it}
                  selected={selectedItems.includes(it.id)}
                  onCheck={handleItemCheck}
                  onDelete={handleDeleteSingle}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          </div>

          {/* 우측: 주문정보 카드 */}
          <div className="cart-right">
            <CartSummary
              variant="cart"
              items={selectedCartItems}
              couponDiscount={couponDiscount}
              pointUsed={pointUsed}
              onCouponChange={(coupon) => {
                setCouponDiscount(coupon?.amount || 0);
                setSelectedCoupon(coupon || null);
              }}
              onPointChange={setPointUsed}
              couponList={availableCoupons}
              maxPoint={availablePoint}
              onCheckout={() =>
                router.push({
                  pathname: "/checkout",
                  query: {
                    itemIds: selectedItems.join(","),
                    couponId: selectedCoupon?.id,
                    point: pointUsed,
                  },
                })
              }
            />
          </div>

          <style jsx>{`
            .cart-main {
              display: flex;
              flex-wrap: wrap;
              align-items: flex-start;
              gap: 24px;
              margin-top: 20px;
            }
            .cart-left {
              flex: 1 1 auto;
              min-width: 0;
              background: #fff;
              border: 1px solid #e5e5e5;
              border-radius: 12px;
              padding: 24px 20px 20px 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
              margin-right: 24px;
              display: flex;
              flex-direction: column;
            }
            .toolbar {
              display: flex;
              align-items: center;
              gap: 12px;
              justify-content: space-between;
              min-height: 32px;
              margin-bottom: 16px;
              flex-wrap: wrap;
            }
            .checkall {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 10px;
              border-radius: 999px;
              font-size: 13px;
              font-weight: 600;
              color: #0f172a;
              background: #eef2ff;
              border: 1px solid #dbe1ff;
            }
            .badge__dot {
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: #6366f1;
              display: inline-block;
            }
            .btn-del {
              background: #fff;
              color: #222;
              border: 1px solid #ccc;
              border-radius: 6px;
              padding: 6px 12px;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.15s;
              box-shadow: none;
            }
            .btn-del:hover:not(:disabled) {
              border-color: #999;
              background: #f8fafc;
            }
            .btn-del:active:not(:disabled) {
              transform: translateY(1px);
            }
            .btn-del:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .grid-cards {
              display: grid;
              grid-template-columns: 1fr; /* 한 줄에 1개 */
              gap: 16px;
            }

            .cart-right {
              flex: 0 0 320px;
              width: 320px;
              max-width: 100%;
              align-self: flex-start;
              position: sticky;
              top: 100px;
            }
            @media (max-width: 1024px) {
              .cart-main {
                flex-direction: column;
              }
              .cart-left {
                margin-right: 0;
                width: 100%; /* ← 전체 폭 사용 */
                flex: 1 1 100%; /* ← 레이아웃 강제 확장 */
              }
              .cart-right {
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
