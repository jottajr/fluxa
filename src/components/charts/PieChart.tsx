import { formatCurrency } from "@/lib/format";

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

const RADIUS = 60;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PieChart({
  data,
  centerLabel,
  centerSubLabel,
}: {
  data: PieSlice[];
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativeFraction = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-slate-100 dark:stroke-slate-800"
          />
          {total > 0 &&
            data.map((slice) => {
              const fraction = slice.value / total;
              const dash = fraction * CIRCUMFERENCE;
              const dashOffset = -cumulativeFraction * CIRCUMFERENCE;
              cumulativeFraction += fraction;
              return (
                <circle
                  key={slice.name}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {centerLabel && (
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {centerLabel}
            </span>
          )}
          {centerSubLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {centerSubLabel}
            </span>
          )}
        </div>
      </div>

      <div className="w-full flex-1 space-y-2">
        {data.map((slice) => (
          <div
            key={slice.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-400">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(slice.value)}
              {total > 0 && (
                <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
                  ({Math.round((slice.value / total) * 100)}%)
                </span>
              )}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Sem dados no período.
          </p>
        )}
      </div>
    </div>
  );
}
