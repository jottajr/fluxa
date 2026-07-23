"use client";

import { CURRENCY_SYMBOLS } from "@/lib/currency";
import type { Currency } from "@/types";

export function CurrencySelector({
  currencies,
  selected,
  onSelect,
}: {
  currencies: Currency[];
  selected: Currency;
  onSelect: (currency: Currency) => void;
}) {
  if (currencies.length <= 1) return null;

  return (
    <div className="inline-flex items-center gap-3 text-sm">
      {currencies.map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => onSelect(currency)}
          className={`border-b-[1.5px] pb-0.5 font-semibold transition-colors ${
            selected === currency
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          }`}
        >
          {CURRENCY_SYMBOLS[currency]}
        </button>
      ))}
    </div>
  );
}
