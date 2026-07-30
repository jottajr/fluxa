"use client";

import { useEffect, useState } from "react";
import { formatCurrency, MONTH_ABBR } from "@/lib/format";
import type { TimelinePoint } from "@/lib/timeline";
import type { Currency } from "@/types";

const WIDTH = 640;
const HEIGHT = 200;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_X = 10;

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]}/${String(year).slice(2)}`;
}

export function TimelineAreaChart({
  points,
  currency,
}: {
  points: TimelinePoint[];
  currency: Currency;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [points]);

  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(index: number): number {
    if (points.length === 1) return PAD_X + plotWidth / 2;
    return PAD_X + (index / (points.length - 1)) * plotWidth;
  }
  function yFor(value: number): number {
    return PAD_TOP + plotHeight - ((value - minValue) / range) * plotHeight;
  }
  function hitBounds(index: number): { start: number; end: number } {
    const x = xFor(index);
    const start = index === 0 ? -1 : (xFor(index - 1) + x) / 2;
    const end = index === points.length - 1 ? WIDTH + 1 : (x + xFor(index + 1)) / 2;
    return { start, end };
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${PAD_TOP + plotHeight} L ${xFor(0)} ${PAD_TOP + plotHeight} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const active = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-[180px] w-full"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <path d={areaPath} fill="var(--accent)" opacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {activeIndex !== null && (
            <line
              x1={xFor(activeIndex)}
              y1={PAD_TOP}
              x2={xFor(activeIndex)}
              y2={PAD_TOP + plotHeight}
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          )}

          {points.map((p, i) => (
            <circle
              key={p.month}
              cx={xFor(i)}
              cy={yFor(p.value)}
              r={activeIndex === i ? 4 : 2.5}
              fill="var(--accent)"
            />
          ))}

          {points.map((p, i) => (
            <text
              key={`label-${p.month}`}
              x={xFor(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className={`text-[10px] ${
                activeIndex === i
                  ? "fill-[var(--accent)] font-semibold"
                  : "fill-[var(--text-tertiary)]"
              }`}
            >
              {formatMonthLabel(p.month)}
            </text>
          ))}

          {points.map((p, i) => {
            const { start, end } = hitBounds(i);
            return (
              <rect
                key={`hit-${p.month}`}
                x={start}
                y={0}
                width={end - start}
                height={HEIGHT}
                fill="transparent"
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => setActiveIndex(i)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>

        {active && activeIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${(xFor(activeIndex) / WIDTH) * 100}%`,
              top: `${(yFor(active.value) / HEIGHT) * 100}%`,
              marginTop: "-8px",
            }}
          >
            <p className="font-medium text-[var(--text-tertiary)]">
              {formatMonthLabel(active.month)}
            </p>
            <p className="font-semibold text-[var(--foreground)]">
              {formatCurrency(active.value, currency)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span>{formatCurrency(first.value, currency)}</span>
        <span className="font-medium text-[var(--text-secondary)]">
          {formatCurrency(last.value, currency)}
        </span>
      </div>
    </div>
  );
}
