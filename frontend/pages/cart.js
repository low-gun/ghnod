import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import CartSummary from "@/components/cart/CartSummary";
import { useCartContext } from "@/context/CartContext";
import CartItemCard from "@/components/cart/CartItemCard";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartReady, refreshCart } = useCartContext();

  // 필요한 state 선언 바로 추가!
  const [selectedItems, setSelectedItems] = useState([]);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pointUsed, setPointUsed] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availablePoint, setAvailablePoint] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // 여기 추가!
  
  useEffect(() => {
    if (!cartReady || cartItems.length === 0) return;
    setSelectedItems(cartItems.map((it) => it.id));
  }, [cartReady, cartItems]);

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

  const isAllChecked =
    cartItems.length > 0 &&
    cartItems.every((it) => selectedItems.includes(it.id));

  const handleCheckAll = (checked) =>
    setSelectedItems(checked ? cartItems.map((it) => it.id) : []);

  const handleItemCheck = (id, checked) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleQuantityChange = async (item, diff) => {
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
      alert("수량 변경 실패");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return alert("삭제할 항목이 없습니다.");
    if (!confirm(`선택된 ${selectedItems.length}개를 삭제하시겠습니까?`))
      return;

    try {
      await Promise.all(
        selectedItems.map((id) => api.delete(`/cart/items/${id}`))
      );
      refreshCart();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/cart/items/${id}`);
      refreshCart();
    } catch (err) {
      alert("삭제 실패");
    }
  };

    return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>장바구니</h2>
          {!cartReady ? null : cartItems.length === 0 ? (
        <p style={{ textAlign: "center", width: "100%", marginTop: 40 }}>
          장바구니가 비어있습니다.
        </p>
      ) : (
        <div style={layoutMain}>
        {/* 좌측: 전체선택/선택삭제 + 카드리스트 */}
        <div
    style={{
      flex: 1,
      minWidth: 0,
      background: "#fff",
      border: "1px solid #e5e5e5",
      borderRadius: "12px",
      padding: "24px 20px 20px 20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      marginRight: "24px", // 우측 주문정보와 공간 분리
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 16,
        justifyContent: "space-between",
        minHeight: "32px",
      }}
    >
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          checked={isAllChecked}
          onChange={(e) => handleCheckAll(e.target.checked)}
        />
        <span style={{ fontSize: "14px" }}>전체선택</span>
            </label>
            {selectedItems.length > 0 && (
              <button
              onClick={handleDeleteSelected}
              style={{
                backgroundColor: "#fff",
                color: "#222",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "normal",
                cursor: "pointer",
                marginLeft: "8px",
                boxShadow: "none",
                transition: "all 0.15s",
              }}
            >
              선택 삭제
            </button>
            )}
          </div>
          <div style={gridCards}>
            {cartItems.map((it) => (
              <CartItemCard
                key={it.id}
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
        <div style={layoutSummary}>
          <CartSummary
            items={cartItems.filter((it) => selectedItems.includes(it.id))}
            couponDiscount={couponDiscount}
            pointUsed={pointUsed}
            onCouponChange={(coupon) => {
              setCouponDiscount(coupon.amount || 0);
              setSelectedCoupon(coupon);
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
      </div>
      
          )}
    </div>
  );
}


const layoutFilterBar = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  gap: "10px",
  rowGap: "12px",
};

const layoutMain = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: "24px",
  marginTop: "20px",
};

const gridCards = {
  flex: "1 1 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const layoutSummary = {
  flex: "0 0 320px",
  maxWidth: "100%",
  width: "320px",
  alignSelf: "flex-start",
  position: "sticky",
  top: 100,
};
