// ProductDetailPage.js (비일정 상품용)
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useCartContext } from "@/context/CartContext";
import { useUserContext } from "@/context/UserContext";
import ProductTabs from "@/components/product/ProductTabs";
import InquiryModal from "@/components/inquiry/InquiryModal";
import dynamic from "next/dynamic";
import { useIsMobile, useIsTabletOrBelow980 } from "@/lib/hooks/useIsDeviceSize";
import { useGlobalAlert } from "@/stores/globalAlert";
import { ShoppingCart, MapPin, User, Share2 } from "lucide-react";
import Breadcrumb from "@/components/common/Breadcrumb";

const NextImage = dynamic(() => import("next/image").then(m => m.default), { ssr: false });
const TabProductDetail = dynamic(() => import("@/components/product/TabProductDetail"), { ssr: false });
const TabProductReviews = dynamic(() => import("@/components/product/TabProductReviews"), { ssr: false });
const TabProductInquiry = dynamic(() => import("@/components/product/TabProductInquiry"), { ssr: false });
const TabRefundPolicy = dynamic(() => import("@/components/product/TabRefundPolicy"), { ssr: false });

export default function ProductDetailPage() {
  const router = useRouter();
  const { refreshCart } = useCartContext();
  const { user } = useUserContext();
  const { id, type, category } = router.query;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const isMobile = useIsMobile();
  const isTabOrBelow980 = useIsTabletOrBelow980();
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
  
    const fetchData = async () => {
      try {
        if (category === "education") {
          const res = await api.get(`/education/schedules/${id}`);
          if (res.data.success) setProduct(res.data.schedule);
        } else if (category !== "opencourse") {  // ✅ opencourse는 제외
          const res = await api.get(`/products/${id}`);
          if (res.data.success) setProduct(res.data.product);
        }
      } catch {
        showAlert("정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [id, type, category, showAlert]);
  
  const unitPrice = useMemo(() => Number(product?.price ?? 0), [product]);

  // 장바구니 / 구매
  const handleBuyNow = useCallback(async () => {
    if (!user) {
      const redirect = router.asPath || "/";
      showAlert("로그인 후 결제하실 수 있습니다.");
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    try {
      const addRes = await api.post("/cart/items", {
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        type: "buyNow",
      });
      const cartItemId = addRes?.data?.item?.id || addRes?.data?.id;
      if (!cartItemId) {
        showAlert("바로구매 준비에 실패했습니다.");
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("BUY_NOW_IDS", JSON.stringify([Number(cartItemId)]));
      }
      router.push(`/checkout?mode=buyNow&ids=${Number(cartItemId)}`);
    } catch {
      showAlert("바로구매 중 오류가 발생했습니다.");
    }
  }, [user, product, quantity, unitPrice, router, showAlert]);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      const redirect = router.asPath || "/";
      showAlert("로그인 후 장바구니를 이용하실 수 있습니다.");
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    try {
      const res = await api.post("/cart/items", {
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        type: "cart",
      });
      if (res.data.success) {
        showAlert("장바구니에 담았습니다!");
        await refreshCart();
      } else {
        showAlert("장바구니 담기에 실패했습니다.");
      }
    } catch {
      showAlert("장바구니 오류가 발생했습니다.");
    }
  }, [user, product, quantity, unitPrice, refreshCart, router, showAlert]);

  // 공유
  const handleCopyLink = useCallback(async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      showAlert("링크를 복사했습니다.");
    } catch {
      showAlert("복사에 실패했습니다.");
    }
  }, [showAlert]);

  
// 카카오 공유
const handleShareKakao = useCallback(() => {
  try {
    if (typeof window === "undefined" || !window.Kakao) {
      showAlert("카카오 SDK를 불러오지 못했습니다.");
      return;
    }
    const Kakao = window.Kakao;
    if (!Kakao.isInitialized()) {
      Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
    }

    const url = window.location.href;
    const rawTitle = product?.title || "상품";
    const rawDesc = product?.description || "상세 페이지에서 확인해 주세요.";
    const title = rawTitle.slice(0, 80);
    const desc = rawDesc.slice(0, 110);

    let pick = product?.image_url || "/images/no-image.png";
    if (pick.startsWith("data:image")) pick = "/images/no-image.png";
    const imageUrl = pick.startsWith("http")
      ? pick
      : `${window.location.origin}${pick.startsWith("/") ? "" : "/"}${pick}`;

    const payload = {
      objectType: "feed",
      content: {
        title,
        description: desc,
        imageUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } },
      ],
    };

    if (Kakao.Share?.sendDefault) Kakao.Share.sendDefault(payload);
    else if (Kakao.Link?.sendDefault) Kakao.Link.sendDefault(payload);
    else showAlert("카카오톡 공유를 사용할 수 없습니다.");
  } catch {
    showAlert("카카오톡 공유 중 오류가 발생했습니다.");
  }
}, [product, showAlert]);
if (loading) return null;
  if (!product) return <p style={{ padding: 40 }}>상품 정보를 찾을 수 없습니다.</p>;
  const actionBtnStyle = (main) => ({
    flex: 1,
    minWidth: isMobile ? undefined : "40%",
    padding: isMobile ? "14px 0" : "12px 16px",
    border: main ? "none" : "1px solid #0070f3",
    backgroundColor: main ? "#0070f3" : "#fff",
    color: main ? "#fff" : "#0070f3",
    borderRadius: 6,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15,
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
<Breadcrumb category={product?.category} type={type} />
      <div className="hero">
        {/* 이미지 */}
        <div className="left">
          <div className="thumbWrap">
          {product?.image_url ? (
  <NextImage
    src={product.image_url}
    alt={product.title}
    fill
    sizes="(max-width: 1024px) 100vw, 50vw"   // ✅ 추가
    className="thumbImg"
    priority
  />
) : (
  <div className="noImage">이미지 없음</div>
)}

          </div>
        </div>
        {/* 정보 */}
        <div className="right">
  {/* ✅ badgeRow + titleRow → Education 구조 동일 */}
  <div className="badgeRow">
    <span className="typeBadge">{type}</span>
    <span
      className="statusBadge"
      style={{
        color: product?.is_active ? "#047857" : "#9CA3AF",
        background: product?.is_active ? "#ECFDF5" : "#F3F4F6",
        border: `1px solid ${product?.is_active ? "#A7F3D0" : "#E5E7EB"}`,
      }}
    >
      {product?.is_active ? "판매중" : "마감"}
    </span>
  </div>

  <div className="titleRow">
    <h1 className="title">{product.title}</h1>
    <div className="titleActions">
      <button onClick={handleCopyLink} aria-label="링크 복사" title="링크 복사" className="iconBtn">
        <Share2 size={16} color="#555" />
      </button>
      <button
        onClick={handleShareKakao}
        aria-label="카카오톡 공유"
        title="카카오톡 공유"
        className="kakaoBtn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C7.03 3 3 6.2 3 10c0 2.47 1.76 4.63 4.4 5.78l-.47 3.22 3.05-2.02c.63.09 1.28.13 1.94.13 4.97 0 9-3.2 9-7s-4.03-7-9-7z" fill="#3C1E1E" />
        </svg>
      </button>
    </div>
  </div>

{/* 문의형/구매형 분기 */}
{product.purchase_type === "inquiry" ? (
  <>
    {/* ✅ 문의형 → description 박스로 변경 */}
    {console.log("[DEBUG right_description]", product?.right_description)}
    {product?.right_description && (
      <div
        className="descBox"
        dangerouslySetInnerHTML={{ __html: product.right_description }}
      />
    )}
{/* ✅ 공통 태그 표시 (조건문 밖으로 이동) */}
{Array.isArray(product.tags) && product.tags.length > 0 && (
  <div className="tagsSection">
    <strong className="infoLabel">태그</strong>
    <div className="tagRow">
      {product.tags.map((tag) => (
        <span key={tag} className="tagBadge">{tag}</span>
      ))}
    </div>
  </div>
)}
    <div className="inquiryFixed">
      <button className="inquiryBtn" onClick={() => setShowInquiryModal(true)}>
        문의하기
      </button>
    </div>
  </>
) : (
  <>
    {/* ✅ 구매형 → description 박스로 변경 */}
    <p className="price">{Number(unitPrice * quantity).toLocaleString()}원</p>
    {product?.description && (
      <div className="descBox">
        <p className="desc">{product.description}</p>
      </div>
    )}

    <div className="infoCard">
      <div className="infoRow">
        <MapPin size={16} />
        <strong className="infoLabel">카테고리</strong>
        <span className="infoValue">{product.category}</span>
      </div>
      <div className="infoRow">
        <User size={16} />
        <strong className="infoLabel">유형</strong>
        <span className="infoValue">{product.type}</span>
      </div>
    </div>

    <div className="qtyRow">
      <span className="qtyLabel">수량</span>
      <div className="qtyBox">
        <button onClick={() => setQuantity((p) => Math.max(1, p - 1))}>–</button>
        <div>{quantity}</div>
        <button onClick={() => setQuantity((p) => p + 1)}>+</button>
      </div>
    </div>
{/* ✅ 공통 태그 표시 (조건문 밖으로 이동) */}
{Array.isArray(product.tags) && product.tags.length > 0 && (
  <div className="tagsSection">
    <strong className="infoLabel">태그</strong>
    <div className="tagRow">
      {product.tags.map((tag) => (
        <span key={tag} className="tagBadge">{tag}</span>
      ))}
    </div>
  </div>
)}
    <div className="ctaRow">
      <button style={actionBtnStyle(false)} onClick={handleAddToCart}>장바구니</button>
      <button style={actionBtnStyle(true)} onClick={handleBuyNow}>바로 구매</button>
    </div>
  </>
)}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ position: "sticky", top: isTabOrBelow980 ? 48 : 80, background: "#fff", zIndex: 100 }}>
      <ProductTabs
  tabs={[
    { id: "detail", label: "상품상세" },
    { id: "review", label: "상품후기" },
    { id: "inquiry", label: "상품문의" },
    ...(product.purchase_type === "buy"
      ? [{ id: "refund", label: "환불안내" }]
      : []),
  ]}
/>
      </div>

      <div id="detail" style={{ minHeight: 400}}>
  {category === "education" ? (
    <TabProductDetail scheduleId={product.id} />
  ) : (
    <TabProductDetail productId={product.id} />
  )}
</div>
<div id="review" style={{ minHeight: 400, paddingTop: 40 }}>
  <TabProductReviews productId={product.id} />
</div>
<div id="inquiry" style={{ minHeight: 400, paddingTop: 40 }}>
  <TabProductInquiry productId={product.id} />
</div>

{/* ✅ 환불안내는 구매형일 때만 */}
{product.purchase_type === "buy" && (
  <div id="refund" style={{ minHeight: 400, paddingTop: 40 }}>
    <TabRefundPolicy />
  </div>
)}

      {showInquiryModal && (
        <InquiryModal
          mode="product"
          productId={product.id}
          onClose={() => setShowInquiryModal(false)}
          onSubmitSuccess={() => {
            setShowInquiryModal(false);
            showAlert("문의가 등록되었습니다.");
          }}
        />
      )}
    <style jsx>{`
    .hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: stretch;
}
.tagsSection {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tagRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tagBadge {
  font-size: 12px;
  padding: 4px 8px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
}
.badgeRow {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.typeBadge {
  display: inline-block;
  padding: 4px 8px;
  background: #eef5ff;
  color: #0070f3;
  font-size: 12px;
  border-radius: 4px;
}
.statusBadge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 12px;  /* ✅ 여유 간격 */
}
.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  flex: 1;
}
.titleActions {
  display: flex;
  gap: 8px;
}
.iconBtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
}
.kakaoBtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 999px;
  background: #FEE500; border: 1px solid #F0D000; cursor: pointer;
}

.thumbWrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.thumbImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}
.noImage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  background: #f7f7f7;
}

.right {
  display: flex;
  flex-direction: column;
  height: 100%;         /* ✅ 부모(.hero)의 높이에 맞춤 */
  overflow-y: auto;     /* ✅ 내용 넘치면 스크롤 */
}


/* ✅ description을 박스로 감싸기 */
/* ✅ description을 박스로 감싸기 */
.descBox {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  margin-top: 8px;
  overflow-wrap: break-word;  /* 긴 텍스트 줄바꿈 */
}

.descBox img {
  max-width: 100%;   /* 박스 밖으로 안 나가게 */
  height: auto;
  display: block;    /* 한 줄 전체 차지 */
  margin: 8px auto;  /* 텍스트와 간격 */
}

.desc {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.inquiryFixed {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.inquiryBtn {
  width: 100%;
  padding: 14px 0;
  background: #0070f3;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .title { font-size: 22px; }
}
@media (max-width: 768px) {
  .title { font-size: 20px; }
}
    `}</style>
  </div>
);
}
