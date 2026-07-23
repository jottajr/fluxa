"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  type DateRange,
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getPeriodRange,
} from "@/lib/period";
import { StatusBadge } from "@/components/StatusBadge";
import { PeriodSelector } from "@/components/PeriodSelector";
import { TransactionFiltersDrawer } from "@/components/TransactionFiltersDrawer";
import { EmptyState } from "@/components/EmptyState";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import type { TransactionStatus } from "@/types";

export default function ExtratoPage() {
  const { transactions, cards, categories, genericPaymentMethods } =
    useFinanceData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "todos">(
    "todos",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("todos");

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
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

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => tx.date >= periodRange.start && tx.date <= periodRange.end)
      .filter((tx) => statusFilter === "todos" || tx.status === statusFilter)
      .filter((tx) => categoryFilter === "todas" || tx.categoryId === categoryFilter)
      .filter(
        (tx) =>
          paymentMethodFilter === "todos" ||
          tx.paymentMethodId === paymentMethodFilter,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, periodRange, statusFilter, categoryFilter, paymentMethodFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
          Extrato - {formatPeriodLabel(periodType, year, subPeriod, customRange)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Consulte todos os lançamentos do período, de acordo com os filtros.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
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
        />

        <TransactionFiltersDrawer
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          paymentMethodFilter={paymentMethodFilter}
          onPaymentMethodFilterChange={setPaymentMethodFilter}
          cards={cards}
          genericPaymentMethods={genericPaymentMethods}
        />
      </div>

      <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Data
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Descrição
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categoria
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Forma de pagamento
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
                  {tx.description}
                  {tx.recurring && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      recorrente
                    </span>
                  )}
                  {tx.totalInstallments && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {tx.installmentNumber}/{tx.totalInstallments}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {tx.categoryId && categoriesById.get(tx.categoryId)
                    ? `${categoriesById.get(tx.categoryId)!.icon} ${categoriesById.get(tx.categoryId)!.name}`
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods)}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-center text-sm font-semibold ${
                    tx.type === "entrada"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "entrada" ? "+" : "-"}
                  {formatCurrency(tx.amount, tx.currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="Nenhuma transação encontrada neste período." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
