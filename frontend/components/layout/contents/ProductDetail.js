// components/ProductDetail.js

export default function ProductDetail({ product }) {
  /*
      product = {
        id: 1,
        title: "예시 상품",
        price: 39000,
        description: "이 상품은 무엇무엇을 위한 제품입니다...",
        image: "/products/example.jpg",
      }
    */

  const handleBuyNow = () => {
    const payload = {
      schedule_id: product.schedule_id,
      quantity: 1,
      unit_price: product.price,
      discount_price: 0,
    };

    const encoded = encodeURIComponent(JSON.stringify(payload));
    router.push(`/checkout?buyNow=${encoded}`);
    // 실제로는 장바구니 추가나 결제 페이지 이동 로직
  };

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 40px)",
        display: "flex",
        gap: "40px",
        fontSize: "clamp(14px, 2vw, 18px)",
      }}
    >
      {/* 상품 이미지 */}
      <div
        style={{
          flex: "0 0 400px",
          textAlign: "center",
        }}
      >
        <img
          src={product.image}
          alt={product.title}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* 상품 정보 */}
      <div style={{ flex: 1 }}>
        <h1
          style={{
            marginBottom: "10px",
            fontWeight: "bold",
            fontSize: "clamp(20px, 4vw, 28px)",
          }}
        >
          {product.title}
        </h1>
        <p
          style={{
            fontSize: "clamp(18px, 3vw, 24px)",
            color: "#e60023", // 예: 빨간색
            marginBottom: "20px",
          }}
        >
          {product.price.toLocaleString()}원
        </p>

        <p style={{ lineHeight: 1.6, marginBottom: "20px" }}>
          {product.description}
        </p>

        <button
          onClick={handleBuyNow}
          style={{
            padding: "12px 24px",
            fontSize: "clamp(14px, 2vw, 16px)",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#333",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          바로 구매
        </button>
      </div>
    </section>
  );
}
