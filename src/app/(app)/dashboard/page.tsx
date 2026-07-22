"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORICAL, DIVERGING } from "@/lib/chart-colors";
import { PieChart } from "@/components/charts/PieChart";
import { EmptyState } from "@/components/EmptyState";
import {
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getMonthsInPeriod,
} from "@/lib/period";
import { PeriodSelector } from "@/components/PeriodSelector";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import {
  CategoryBreakdownBars,
  type CategoryBreakdownItem,
} from "@/components/charts/CategoryBreakdownBars";

function sumByType(
  transactions: { type: string; amount: number }[],
  type: "entrada" | "saida",
) {
  return transactions
    .filter((tx) => tx.type === type)
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
  const { transactions, categories } = useFinanceData();
  const { userName } = useUser();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);

  const years = useMemo(() => {
    const unique = new Set(transactions.map((tx) => Number(tx.date.slice(0, 4))));
    unique.add(currentYear);
    return Array.from(unique).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  function handlePeriodTypeChange(newType: PeriodType) {
    setPeriodType(newType);
    setSubPeriod(defaultSubPeriodFor(newType, currentMonth));
  }

  function handleMonthClick(month: string) {
    const [clickedYear, clickedMonth] = month.split("-").map(Number);
    setPeriodType("mensal");
    setYear(clickedYear);
    setSubPeriod(clickedMonth);
  }

  const periodMonths = useMemo(
    () => getMonthsInPeriod(periodType, year, subPeriod),
    [periodType, year, subPeriod],
  );

  const periodTransactions = useMemo(
    () =>
      transactions.filter((tx) => periodMonths.includes(tx.date.slice(0, 7))),
    [transactions, periodMonths],
  );

  const entradas = useMemo(
    () => sumByType(periodTransactions, "entrada"),
    [periodTransactions],
  );

  const saidas = useMemo(
    () => sumByType(periodTransactions, "saida"),
    [periodTransactions],
  );

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
      ? sumByType(previousMonthTransactions, "entrada")
      : null;
  const previousSaidas =
    previousMonthTransactions !== null
      ? sumByType(previousMonthTransactions, "saida")
      : null;
  const previousSaldo =
    previousEntradas !== null && previousSaidas !== null
      ? previousEntradas - previousSaidas
      : null;

  const trendData = useMemo(
    () =>
      periodMonths.map((month) => {
        const monthTx = transactions.filter((tx) => tx.date.startsWith(month));
        return {
          month,
          entradas: sumByType(monthTx, "entrada"),
          saidas: sumByType(monthTx, "saida"),
        };
      }),
    [periodMonths, transactions],
  );

  const categoryBreakdown: CategoryBreakdownItem[] = useMemo(() => {
    const totalsByCategory = new Map<string, number>();

    periodTransactions
      .filter((tx) => tx.type === "saida")
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
  }, [periodTransactions, categories]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Dashboard Financeiro de {userName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatPeriodLabel(periodType, year, subPeriod)}
          </p>
        </div>

        <PeriodSelector
          periodType={periodType}
          onPeriodTypeChange={handlePeriodTypeChange}
          subPeriod={subPeriod}
          onSubPeriodChange={setSubPeriod}
          year={year}
          onYearChange={setYear}
          years={years}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Entradas</p>
          <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(entradas)}
          </p>
          <Variation current={entradas} previous={previousEntradas} higherIsGood />
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
          <p className="mt-1 text-2xl font-medium text-red-600 dark:text-red-400">
            {formatCurrency(saidas)}
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
            {formatCurrency(saldo)}
          </p>
          <Variation current={saldo} previous={previousSaldo} higherIsGood />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Entradas x Saídas por mês
          </h2>
          {periodTransactions.length === 0 ? (
            <EmptyState
              message="Nenhuma transação neste período."
              actionLabel="Adicionar transação"
              actionHref="/transacoes"
            />
          ) : (
            <MonthlyTrendChart data={trendData} onMonthClick={handleMonthClick} />
          )}
        </div>

        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Total comprometido: entradas x saídas
          </h2>
          <PieChart
            data={[
              { name: "Entradas", value: entradas, color: DIVERGING.positive },
              { name: "Saídas", value: saidas, color: DIVERGING.negative },
            ]}
            centerLabel={formatCurrency(entradas + saidas)}
            centerSubLabel="Movimentado"
          />
        </div>
      </div>

      <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Gastos por categoria
        </h2>
        <CategoryBreakdownBars data={categoryBreakdown} />
      </div>
    </div>
  );
}
