"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORICAL, DIVERGING } from "@/lib/chart-colors";
import { PieChart } from "@/components/charts/PieChart";
import { EmptyState } from "@/components/EmptyState";
import {
  type DateRange,
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getPeriodRange,
} from "@/lib/period";
import { PeriodSelector } from "@/components/PeriodSelector";
import { CurrencySelector } from "@/components/CurrencySelector";
import {
  CategoryBreakdownBars,
  type CategoryBreakdownItem,
} from "@/components/charts/CategoryBreakdownBars";
import {
  PRIMARY_CURRENCY,
  presentCurrencies,
  sumByCurrency,
} from "@/lib/currency";
import type { Currency } from "@/types";

function sumByType(
  transactions: { type: string; amount: number; currency: Currency }[],
  type: "entrada" | "saida",
  currency: Currency,
) {
  return transactions
    .filter((tx) => tx.type === type && tx.currency === currency)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function Variation({
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
      className={`mt-1 text-xs font-medium ${
        isGood
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {increased ? "↑" : "↓"} {Math.abs(rounded)}% vs mês anterior
    </p>
  );
}

export default function DashboardPage() {
  const { transactions, categories, cards } = useFinanceData();
  const { userName } = useUser();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(PRIMARY_CURRENCY);

  const currencies = useMemo(
    () => presentCurrencies(transactions),
    [transactions],
  );

  const years = useMemo(() => {
    const unique = new Set(transactions.map((tx) => Number(tx.date.slice(0, 4))));
    unique.add(currentYear);
    return Array.from(unique).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  function handlePeriodTypeChange(newType: PeriodType) {
    setPeriodType(newType);
    setSubPeriod(defaultSubPeriodFor(newType, currentMonth));
  }

  const periodRange = useMemo(
    () => getPeriodRange(periodType, year, subPeriod, customRange),
    [periodType, year, subPeriod, customRange],
  );

  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.date >= periodRange.start && tx.date <= periodRange.end,
      ),
    [transactions, periodRange],
  );

  const entradasByCurrency = useMemo(
    () => sumByCurrency(periodTransactions.filter((tx) => tx.type === "entrada")),
    [periodTransactions],
  );
  const saidasByCurrency = useMemo(
    () => sumByCurrency(periodTransactions.filter((tx) => tx.type === "saida")),
    [periodTransactions],
  );

  const entradas = entradasByCurrency[selectedCurrency] ?? 0;
  const saidas = saidasByCurrency[selectedCurrency] ?? 0;
  const saldo = entradas - saidas;

  const previousMonthTransactions = useMemo(() => {
    if (periodType !== "mensal") return null;
    const prevMonth = subPeriod === 1 ? 12 : subPeriod - 1;
    const prevYear = subPeriod === 1 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    return transactions.filter((tx) => tx.date.startsWith(prevMonthStr));
  }, [periodType, subPeriod, year, transactions]);

  const previousEntradas =
    previousMonthTransactions !== null
      ? sumByType(previousMonthTransactions, "entrada", selectedCurrency)
      : null;
  const previousSaidas =
    previousMonthTransactions !== null
      ? sumByType(previousMonthTransactions, "saida", selectedCurrency)
      : null;
  const previousSaldo =
    previousEntradas !== null && previousSaidas !== null
      ? previousEntradas - previousSaidas
      : null;

  const cardBreakdown: CategoryBreakdownItem[] = useMemo(() => {
    const totalsByCard = new Map<string, number>();

    periodTransactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.paymentMethodId &&
          tx.currency === selectedCurrency,
      )
      .forEach((tx) => {
        const card = cards.find(
          (c) =>
            c.id === tx.paymentMethodId &&
            (c.type === "credito" || c.type === "ambos"),
        );
        if (!card) return;
        totalsByCard.set(card.id, (totalsByCard.get(card.id) ?? 0) + tx.amount);
      });

    return Array.from(totalsByCard.entries())
      .map(([cardId, value], index) => {
        const card = cards.find((c) => c.id === cardId)!;
        return {
          name: card.name,
          value,
          color: CATEGORICAL[index % CATEGORICAL.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions, cards, selectedCurrency]);

  const categoryBreakdown: CategoryBreakdownItem[] = useMemo(() => {
    const totalsByCategory = new Map<string, number>();

    periodTransactions
      .filter((tx) => tx.type === "saida" && tx.currency === selectedCurrency)
      .forEach((tx) => {
        const key = tx.categoryId ?? "sem-categoria";
        totalsByCategory.set(key, (totalsByCategory.get(key) ?? 0) + tx.amount);
      });

    return Array.from(totalsByCategory.entries())
      .map(([categoryId, value], index) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category ? `${category.icon} ${category.name}` : "🏷️ Sem categoria",
          value,
          color: CATEGORICAL[index % CATEGORICAL.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions, categories, selectedCurrency]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Dashboard de {userName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatPeriodLabel(periodType, year, subPeriod, customRange)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <CurrencySelector
            currencies={currencies}
            selected={selectedCurrency}
            onSelect={setSelectedCurrency}
          />
          <PeriodSelector
            periodType={periodType}
            onPeriodTypeChange={handlePeriodTypeChange}
            subPeriod={subPeriod}
            onSubPeriodChange={setSubPeriod}
            year={year}
            onYearChange={setYear}
            years={years}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            align="right"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Entradas</p>
          <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(entradas, selectedCurrency)}
          </p>
          <Variation current={entradas} previous={previousEntradas} higherIsGood />
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
          <p className="mt-1 text-2xl font-medium text-red-600 dark:text-red-400">
            {formatCurrency(saidas, selectedCurrency)}
          </p>
          <Variation
            current={saidas}
            previous={previousSaidas}
            higherIsGood={false}
          />
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p
            className={`mt-1 text-2xl font-medium ${
              saldo >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(saldo, selectedCurrency)}
          </p>
          <Variation current={saldo} previous={previousSaldo} higherIsGood />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Total comprometido: entradas x saídas
          </h2>
          <PieChart
            data={[
              { name: "Entradas", value: entradas, color: DIVERGING.positive },
              { name: "Saídas", value: saidas, color: DIVERGING.negative },
            ]}
            centerLabel={formatCurrency(entradas + saidas, selectedCurrency)}
            centerSubLabel="Movimentado"
            currency={selectedCurrency}
          />
        </div>

        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Gasto por cartão
          </h2>
          {cardBreakdown.length === 0 ? (
            <EmptyState
              message="Nenhum gasto em cartão de crédito neste período."
              actionLabel="Adicionar transação"
              actionHref="/transacoes"
            />
          ) : (
            <CategoryBreakdownBars data={cardBreakdown} currency={selectedCurrency} />
          )}
        </div>
      </div>

      <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Gastos por categoria
        </h2>
        <CategoryBreakdownBars data={categoryBreakdown} currency={selectedCurrency} />
      </div>
    </div>
  );
}
