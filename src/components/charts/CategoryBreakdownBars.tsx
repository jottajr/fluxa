import { formatCurrency } from "@/lib/format";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { EmptyState } from "@/components/EmptyState";
import type { Currency } from "@/types";

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export function CategoryBreakdownBars({
  data,
  currency = PRIMARY_CURRENCY,
}: {
  data: CategoryBreakdownItem[];
  currency?: Currency;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <EmptyState
        message="Nenhum gasto categorizado neste período."
        actionLabel="Adicionar transação"
        actionHref="/transacoes"
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-slate-600 dark:text-slate-400">
            {d.name}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color,
              }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(d.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}
