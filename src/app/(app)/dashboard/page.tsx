"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORICAL, DIVERGING } from "@/lib/chart-colors";
import { PieChart } from "@/components/charts/PieChart";
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

export default function DashboardPage() {
  const { transactions, categories } = useFinanceData();
  const { userName } = useUser();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("anual");
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
    () =>
      periodTransactions
        .filter((tx) => tx.type === "entrada")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [periodTransactions],
  );

  const saidas = useMemo(
    () =>
      periodTransactions
        .filter((tx) => tx.type === "saida")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [periodTransactions],
  );

  const saldo = entradas - saidas;

  const trendData = useMemo(
    () =>
      periodMonths.map((month) => {
        const monthTx = transactions.filter((tx) => tx.date.startsWith(month));
        return {
          month,
          entradas: monthTx
            .filter((tx) => tx.type === "entrada")
            .reduce((sum, tx) => sum + tx.amount, 0),
          saidas: monthTx
            .filter((tx) => tx.type === "saida")
            .reduce((sum, tx) => sum + tx.amount, 0),
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
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
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
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(entradas)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(saidas)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              saldo >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Entradas x Saídas por mês
          </h2>
          <MonthlyTrendChart data={trendData} onMonthClick={handleMonthClick} />
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
