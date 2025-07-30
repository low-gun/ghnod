import React, { useEffect, useState } from "react";

export default function InfiniteCardList({ data, pageSize = 10, renderCard }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    // 콘솔로 데이터 길이, currentPage 로그 찍기
    console.log("[InfiniteCardList] data.length:", data.length);
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 이벤트가 호출되는지 로그
      console.log(
        "[InfiniteCardList] scroll fired | scrollY:",
        window.scrollY,
        "| body.offsetHeight:",
        document.body.offsetHeight,
        "| innerHeight:",
        window.innerHeight
      );
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        setCurrentPage((prev) => {
          if (prev * pageSize < data.length) {
            console.log(
              "[InfiniteCardList] currentPage UP | prev:",
              prev,
              "| next:",
              prev + 1
            );
            return prev + 1;
          }
          return prev;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data.length, pageSize]); // 절대로 currentPage는 의존성에 넣지 마세요!

  const cardsToShow = data.slice(0, currentPage * pageSize);

  useEffect(() => {
    // 카드 개수 로그로 확인
    console.log(
      "[InfiniteCardList] RENDER | currentPage:",
      currentPage,
      "| cardsToShow:",
      cardsToShow.length,
      "| total:",
      data.length
    );
  }, [currentPage, cardsToShow.length, data.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      {cardsToShow.map(renderCard)}
    </div>
  );
}
