import { formatCurrency } from "@/lib/format";
import type { CardInvoiceBar } from "@/lib/reports";

const STATUS_COLOR: Record<CardInvoiceBar["status"], string> = {
  paid: "var(--chart-positive)",
  current: "var(--accent)",
  future: "#cbd5e1",
};

const CHART_HEIGHT = 120;

export function CardInvoiceBarChart({
  bars,
  onSelect,
}: {
  bars: CardInvoiceBar[];
  onSelect?: (month: string) => void;
}) {
  const max = Math.max(1, ...bars.map((b) => b.total));

  return (
    <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1">
      {bars.map((bar) => {
        const height = bar.total > 0 ? Math.max(6, (bar.total / max) * CHART_HEIGHT) : 4;
        return (
          <button
            key={bar.month}
            type="button"
            onClick={() => onSelect?.(bar.month)}
            disabled={!onSelect}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="whitespace-nowrap text-[11px] font-semibold text-[var(--text-tertiary)]">
              {bar.total > 0 ? formatCurrency(bar.total) : ""}
            </span>
            <div className="relative">
              <div
                className="w-8 rounded-t-md transition-opacity hover:opacity-80"
                style={{ height, backgroundColor: STATUS_COLOR[bar.status] }}
              />
              {bar.selected && (
                <span
                  className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-[var(--surface)] bg-[var(--foreground)]"
                  aria-hidden
                />
              )}
            </div>
            <span
              className="text-[11.5px] font-semibold"
              style={{
                color: bar.selected ? "var(--foreground)" : "var(--text-tertiary)",
              }}
            >
              {bar.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
