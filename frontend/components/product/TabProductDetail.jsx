import { useRef, useState, useEffect } from "react";

export default function TabProductDetail({ html }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
const [limitHeight, setLimitHeight] = useState(1200);
const [canExpand, setCanExpand] = useState(false);

const isEmptyDetail = !html || /상세\s*설명이\s*없습니다\.?/i.test(
  String(html).replace(/<[^>]*>/g, "").trim()
);

  // img 태그에 lazy 속성 자동 추가
  const processedHtml = (html || "<p>상세 설명이 없습니다.</p>")
  .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ')
  .replace(/<a\b(?![^>]*\btarget=)/gi, '<a target="_blank" rel="noopener noreferrer" ')
  // 빈 단락(<p></p>, <p><br></p>, &nbsp;만 있는 단락) 제거
  .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");


  useEffect(() => {
    const h = window.innerHeight ? window.innerHeight * 2.5 : 1200;
    setLimitHeight(h);
  
    const id = requestAnimationFrame(() => {
      const el = contentRef.current;
      const overflow = el ? el.scrollHeight > h + 1 : false;
      setCanExpand(!isEmptyDetail && overflow);
    });
    return () => cancelAnimationFrame(id);
  }, [html, isEmptyDetail]);
  
  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <>
      <section
        id="detail"
        style={{
          padding: "40px 0",
          borderBottom: "1px solid #eee",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
          상품상세
        </h2>

       {/* 오버레이용 래퍼 추가 */}
<div className="detail-wrap">
  <div
    ref={contentRef}
    className="detail-box"
    style={{
      maxHeight: expanded ? "none" : limitHeight,
      overflow: expanded ? "visible" : "hidden",
      transition: "max-height 0.3s ease",
    }}
    dangerouslySetInnerHTML={{ __html: processedHtml }}
  />

  {/* 접기 상태일 때만 버튼을 콘텐츠 위에 오버레이 */}
  {!expanded && canExpand && (
  <div className="fade-overlay">
    <button className="detail-toggle" onClick={handleToggle}>
      상품상세 더보기 ▼
    </button>
  </div>
)}
 </div>
{/* 펼친 상태에서는 기존처럼 아래에 접기 버튼만 표시 */}
{expanded && canExpand && (
  <div style={{ textAlign: "center", marginTop: 36 }}>
    <button
      onClick={handleToggle}
      style={{
        padding: "8px 18px",
        fontSize: 14,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: 20,
        cursor: "pointer",
        marginTop: 12,
        fontWeight: 500,
      }}
    >
      상품상세 접기 ▲
    </button>
  </div>
)}

      </section>

      <style jsx global>{`
  .detail-wrap{
    position: relative;
  }
  .fade-overlay{
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 24px 0 12px;
    background: linear-gradient(to bottom, rgba(255,255,255,0), #fff 60%);
    display: flex; justify-content: center;
  }
  .detail-toggle{
    padding: 8px 18px;
    font-size: 14px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 500;
  }

  /* ▼ 이미지와 래퍼 여백 완전 제거 */
  .detail-box img{
    max-width:100%;
    height:auto;
    display:block;
    margin:0 !important;
    padding:0 !important;
    border:0;
  }
  .detail-box p,
  .detail-box figure{
    margin:0 !important;
    padding:0 !important;
  }
  /* 이미지만 들어있는 래퍼의 여백도 제거 */
  .detail-box :where(p,figure,div):has(> img:only-child){
    margin:0 !important;
    padding:0 !important;
  }
  /* 연속 이미지/래퍼 사이 간격 제거 */
  .detail-box img + img{ margin-top:0 !important; }
  .detail-box :where(p,figure,div):has(> img:only-child)
    + :where(p,figure,div):has(> img:only-child){
    margin-top:0 !important;
  }

  /* 표/iframe 기본 */
  .detail-box table{
    width:100%;
    border-collapse:collapse;
    display:block;
    overflow-x:auto;
  }
  .detail-box iframe{
    width:100%;
    height:auto;
    aspect-ratio:16/9;
  }
`}</style>


    </>
  );
}
