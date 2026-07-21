"use client";

import { useState } from "react";
import { MONTH_ABBR, MONTH_NAMES, formatCurrency } from "@/lib/format";
import { DIVERGING } from "@/lib/chart-colors";

const CHART_HEIGHT = 140;
const CHART_V_PADDING = 14;
const COLUMN_WIDTH = 56;

export interface MonthlyTrendPoint {
  month: string;
  entradas: number;
  saidas: number;
}

export function MonthlyTrendChart({
  data,
  onMonthClick,
}: {
  data: MonthlyTrendPoint[];
  onMonthClick?: (month: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = Math.max(...data.flatMap((d) => [d.entradas, d.saidas]), 1);
  const width = data.length * COLUMN_WIDTH;
  const usableHeight = CHART_HEIGHT - CHART_V_PADDING * 2;
  const clickable = Boolean(onMonthClick);

  function xFor(index: number) {
    return index * COLUMN_WIDTH + COLUMN_WIDTH / 2;
  }

  function yFor(value: number) {
    return CHART_V_PADDING + usableHeight - (value / max) * usableHeight;
  }

  const entradaPoints = data
    .map((d, i) => `${xFor(i)},${yFor(d.entradas)}`)
    .join(" ");
  const saidaPoints = data
    .map((d, i) => `${xFor(i)},${yFor(d.saidas)}`)
    .join(" ");

  const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DIVERGING.positive }}
          />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DIVERGING.negative }}
          />
          Saídas
        </span>
        {onMonthClick && data.length > 1 && (
          <span className="text-slate-400 dark:text-slate-500">
            Clique em um mês para ver o detalhe
          </span>
        )}
      </div>

      <div className="mb-4 flex h-5 items-center gap-3 text-xs">
        {hovered ? (
          <>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {MONTH_NAMES[Number(hovered.month.split("-")[1]) - 1]} de{" "}
              {hovered.month.split("-")[0]}:
            </span>
            <span style={{ color: DIVERGING.positive }}>
              Entradas {formatCurrency(hovered.entradas)}
            </span>
            <span style={{ color: DIVERGING.negative }}>
              Saídas {formatCurrency(hovered.saidas)}
            </span>
          </>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Passe o mouse sobre o gráfico para ver os valores do mês
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width }}>
          <svg
            viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
            width={width}
            height={CHART_HEIGHT}
            className="block overflow-visible"
          >
            <line
              x1={0}
              y1={CHART_HEIGHT - CHART_V_PADDING}
              x2={width}
              y2={CHART_HEIGHT - CHART_V_PADDING}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth={1}
            />
            {hoveredIndex !== null && (
              <line
                x1={xFor(hoveredIndex)}
                y1={0}
                x2={xFor(hoveredIndex)}
                y2={CHART_HEIGHT}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
            <polyline
              points={entradaPoints}
              fill="none"
              stroke={DIVERGING.positive}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={saidaPoints}
              fill="none"
              stroke={DIVERGING.negative}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => (
              <g key={d.month}>
                <circle
                  cx={xFor(i)}
                  cy={yFor(d.entradas)}
                  r={hoveredIndex === i ? 4.5 : 3}
                  fill={DIVERGING.positive}
                />
                <circle
                  cx={xFor(i)}
                  cy={yFor(d.saidas)}
                  r={hoveredIndex === i ? 4.5 : 3}
                  fill={DIVERGING.negative}
                />
              </g>
            ))}
          </svg>

          <div className="absolute inset-x-0 top-0 flex" style={{ height: CHART_HEIGHT }}>
            {data.map((d, i) => {
              const monthNum = Number(d.month.split("-")[1]);
              return (
                <button
                  type="button"
                  key={d.month}
                  onClick={() => onMonthClick?.(d.month)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(i)}
                  onBlur={() => setHoveredIndex(null)}
                  disabled={!clickable}
                  aria-label={`${MONTH_ABBR[monthNum - 1]}: entradas ${formatCurrency(d.entradas)}, saídas ${formatCurrency(d.saidas)}`}
                  className={`shrink-0 rounded-sm ${
                    clickable
                      ? "cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                      : "cursor-default"
                  }`}
                  style={{ width: COLUMN_WIDTH }}
                />
              );
            })}
          </div>

          <div className="mt-1 flex">
            {data.map((d) => {
              const monthNum = Number(d.month.split("-")[1]);
              return (
                <span
                  key={d.month}
                  className="shrink-0 text-center text-[11px] text-slate-500 dark:text-slate-400"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {MONTH_ABBR[monthNum - 1]}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
