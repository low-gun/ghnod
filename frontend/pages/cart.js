import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import { formatPrice } from "@/lib/format";
import SearchFilter from "@/components/common/SearchFilter";
import { FaTrash, FaShoppingCart } from "react-icons/fa";
import CartSummary from "@/components/cart/CartSummary";
import { useCartContext } from "@/context/CartContext";
import CartItemCard from "@/components/cart/CartItemCard";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, cartReady, refreshCart, setCartItems } = useCartContext();

  const [searchType, setSearchType] = useState("title");
  const [searchValue, setSearchValue] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pointUsed, setPointUsed] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availablePoint, setAvailablePoint] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

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
    if (!router.isReady) return;
    const { searchType = "title", searchValue = "" } = router.query;
    setSearchType(searchType);
    setSearchValue(searchValue);
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;
    refreshCart();
  }, [router.isReady, searchType, searchValue]);

  const handleSearchUpdate = (type, val) => {
    setSearchType(type);
    setSearchValue(val);
    updateQueryParams({ searchType: type, searchValue: val });
  };

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

  const resetFilters = () => {
    setSearchType("title");
    setSearchValue("");
    updateQueryParams({
      searchType: "title",
      searchValue: "",
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>장바구니</h2>

      <div style={layoutFilterBar}>
        <div style={filterLeft}>
          <SearchFilter
            searchType={searchType}
            setSearchType={(val) => handleSearchUpdate(val, searchValue)}
            searchQuery={searchValue}
            setSearchQuery={(val) => handleSearchUpdate(searchType, val)}
            searchOptions={[{ value: "title", label: "교육명", type: "text" }]}
            onSearchUpdate={handleSearchUpdate}
          />
          <button onClick={resetFilters} style={buttonStyle("#ccc", "#333")}>
            초기화
          </button>
        </div>
        <div style={filterRight}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={(e) => handleCheckAll(e.target.checked)}
            />
            전체 선택
          </label>
          {selectedItems.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              style={buttonStyle("#ef4444", "#fff")}
            >
              🗑 삭제하기
            </button>
          )}
        </div>
      </div>

      {!cartReady ? null : cartItems.length === 0 ? (
        <p style={{ textAlign: "center", width: "100%", marginTop: 40 }}>
          장바구니가 비어있습니다.
        </p>
      ) : (
        <div style={layoutMain}>
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

const buttonStyle = (bg, color) => ({
  padding: "8px 14px",
  backgroundColor: bg,
  color: color,
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
});

const layoutFilterBar = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  gap: "10px",
  rowGap: "12px",
};

const filterLeft = {
  display: "flex",
  gap: 10,
  flex: 1,
  minWidth: 0,
  flexWrap: "wrap",
};

const filterRight = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  flexShrink: 0,
  alignItems: "center",
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
