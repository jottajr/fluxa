import { formatCurrency, MONTH_ABBR } from "@/lib/format";
import type { PatrimonioPoint } from "@/lib/investment-projection";
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

export function InvestmentTimelineChart({
  points,
  currency,
}: {
  points: PatrimonioPoint[];
  currency: Currency;
}) {
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

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${PAD_TOP + plotHeight} L ${xFor(0)} ${PAD_TOP + plotHeight} Z`;

  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-[180px] w-full"
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
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || i % labelStep === 0 ? (
            <circle key={p.month} cx={xFor(i)} cy={yFor(p.value)} r="2.5" fill="var(--accent)" />
          ) : null,
        )}
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || i % labelStep === 0 ? (
            <text
              key={`label-${p.month}`}
              x={xFor(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-slate-400 text-[10px] dark:fill-slate-500"
            >
              {formatMonthLabel(p.month)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{formatCurrency(first.value, currency)}</span>
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {formatCurrency(last.value, currency)}
        </span>
      </div>
    </div>
  );
}
