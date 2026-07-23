import type { Currency } from "@/types";

export const PRIMARY_CURRENCY: Currency = "BRL";

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "BRL", label: "R$ Real" },
  { value: "USD", label: "US$ Dólar" },
  { value: "EUR", label: "€ Euro" },
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: "R$",
  USD: "US$",
  EUR: "€",
};

const CURRENCY_ORDER: Currency[] = ["BRL", "USD", "EUR"];
const ALWAYS_VISIBLE_CURRENCIES: Currency[] = ["BRL", "USD"];

export function presentCurrencies(
  items: { currency: Currency }[],
): Currency[] {
  const found = new Set(items.map((item) => item.currency));
  for (const currency of ALWAYS_VISIBLE_CURRENCIES) found.add(currency);
  return CURRENCY_ORDER.filter((currency) => found.has(currency));
}

export function sumByCurrency(
  items: { amount: number; currency: Currency }[],
): Partial<Record<Currency, number>> {
  const totals: Partial<Record<Currency, number>> = {};
  for (const item of items) {
    totals[item.currency] = (totals[item.currency] ?? 0) + item.amount;
  }
  return totals;
}

export function secondaryCurrencyTotals(
  totals: Partial<Record<Currency, number>>,
): [Currency, number][] {
  return (Object.entries(totals) as [Currency, number][]).filter(
    ([currency, value]) => currency !== PRIMARY_CURRENCY && value !== 0,
  );
}
