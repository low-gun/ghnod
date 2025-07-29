import React, { useEffect, useRef, useState } from "react";

export default function InfiniteCardList({ data, pageSize = 10, renderCard }) {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef();

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        containerRef.current &&
        containerRef.current.scrollTop + containerRef.current.clientHeight >=
          containerRef.current.scrollHeight - 100
      ) {
        setCurrentPage((prev) =>
          prev * pageSize < data.length ? prev + 1 : prev
        );
      }
    };
    const refCurrent = containerRef.current;
    if (refCurrent) refCurrent.addEventListener("scroll", handleScroll);
    return () => {
      if (refCurrent) refCurrent.removeEventListener("scroll", handleScroll);
    };
  }, [data.length, pageSize]);

  const cardsToShow = data.slice(0, currentPage * pageSize);

  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      }}
    >
      {cardsToShow.map(renderCard)}
    </div>
  );
}
