// frontend/components/admin/UPlotLineImpl.jsx
import React, { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export default function UPlotLineImpl({
  data = [],
  xKey = "date",          // 날짜 키 (string | Date)
  yKey = "value",         // 값 키 (number)
  color = "#3b82f6",
  height = 240,
  formatValue,            // (v:number) => string (Y축 라벨 포맷)
}) {
  const rootRef = useRef(null);
  const plotRef = useRef(null);
  const roRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // 정렬 + 배열 변환 (uPlot은 x 오름차순 필요)
    const rows = [...data].map(d => ({
      x: Math.floor(new Date(d[xKey]).getTime() / 1000), // 초 단위
      y: Number(d[yKey] ?? 0),
    })).filter(r => Number.isFinite(r.x) && Number.isFinite(r.y))
      .sort((a, b) => a.x - b.x);

    const xs = rows.map(r => r.x);
    const ys = rows.map(r => r.y);
    const series = [xs, ys];

    const width = Math.max(300, Math.floor(el.clientWidth || 600));

    const opts = {
      width,
      height,
      scales: {
        x: { time: true },
        y: { auto: true },
      },
      axes: [
        {
          stroke: "#666",
          grid: { show: true, stroke: "#eee" },
        },
        {
          stroke: "#666",
          grid: { show: true, stroke: "#eee" },
          values: formatValue
            ? (u, vals) => vals.map(v => formatValue(v))
            : undefined,
        },
      ],
      series: [
        {}, // x
        {
          stroke: color,
          width: 2,
          points: { show: false },
        },
      ],
      cursor: {
        y: true,
        points: { show: false },
      },
      legend: { show: false },
    };

    // 기존 인스턴스 정리
    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    plotRef.current = new uPlot(opts, series, el);

    // 리사이즈 대응
    if (!roRef.current && "ResizeObserver" in window) {
      roRef.current = new ResizeObserver(entries => {
        for (const entry of entries) {
          const w = Math.max(300, Math.floor(entry.contentRect.width));
          if (plotRef.current) {
            plotRef.current.setSize({ width: w, height });
          }
        }
      });
      roRef.current.observe(el);
    }

    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
    };
  }, [data, xKey, yKey, color, height, formatValue]);

  return <div ref={rootRef} style={{ width: "100%", height }} />;
}
