export const cardClass =
  "rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6";

export function Variation({
  current,
  previous,
  higherIsGood,
}: {
  current: number;
  previous: number | null;
  higherIsGood: boolean;
}) {
  if (previous === null || previous === 0) return null;

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct);
  if (rounded === 0) return null;

  const increased = rounded > 0;
  const isGood = increased === higherIsGood;

  return (
    <p
      className="mt-2 flex flex-nowrap items-center gap-1 whitespace-nowrap text-xs font-bold"
      style={{ color: isGood ? "var(--chart-positive)" : "var(--chart-negative)" }}
    >
      {increased ? "↑" : "↓"} {Math.abs(rounded)}%
      <span className="font-medium text-[var(--text-tertiary)]">vs período anterior</span>
    </p>
  );
}

export function KpiCard({
  label,
  value,
  color,
  variation,
  caption,
}: {
  label: string;
  value: string;
  color: string;
  variation: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p
        className="font-display mt-2.5 text-[28px] font-extrabold tracking-tight tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
      {variation}
      {caption && (
        <p className="mt-1.5 text-[11px] font-medium text-[var(--text-tertiary)]">{caption}</p>
      )}
    </div>
  );
}
