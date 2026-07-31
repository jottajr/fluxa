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
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { PeriodSelector } from "@/components/PeriodSelector";
import { TransactionFiltersDrawer } from "@/components/TransactionFiltersDrawer";
import { EmptyState } from "@/components/EmptyState";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { exportToCSV, exportToPDF } from "@/lib/export";
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

  const exportHeaders = ["Data", "Descrição", "Categoria", "Forma de pagamento", "Valor", "Status"];

  function buildExportRows() {
    return filtered.map((tx) => [
      formatDate(tx.date),
      tx.description,
      tx.categoryId && categoriesById.get(tx.categoryId)
        ? categoriesById.get(tx.categoryId)!.name
        : "Sem categoria",
      getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods),
      `${tx.type === "entrada" ? "+" : "-"}${formatCurrency(tx.amount, tx.currency)}`,
      STATUS_LABELS[tx.status],
    ]);
  }

  const exportFilenameBase = `extrato-${formatPeriodLabel(periodType, year, subPeriod, customRange).replace(/\s+/g, "-")}`;

  function handleExportCSV() {
    exportToCSV(`${exportFilenameBase}.csv`, exportHeaders, buildExportRows());
  }

  async function handleExportPDF() {
    await exportToPDF(
      `${exportFilenameBase}.pdf`,
      `Extrato — ${formatPeriodLabel(periodType, year, subPeriod, customRange)}`,
      exportHeaders,
      buildExportRows(),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Extrato
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Consulte todos os lançamentos do período, de acordo com os filtros
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="group relative">
          <button className="rounded-[11px] border border-[var(--border-subtle)] px-3.5 py-2 text-[13px] font-bold text-[var(--text-secondary)] hover:border-[var(--accent)]/40">
            Exportar
          </button>
          <div className="absolute left-0 top-full z-10 hidden w-36 pt-1.5 group-hover:block">
            <div className="rounded-[11px] border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5 shadow-lg">
              <button
                onClick={handleExportCSV}
                className="block w-full rounded-md px-3 py-2 text-left text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--background)]"
              >
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="block w-full rounded-md px-3 py-2 text-left text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--background)]"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            showSteppers
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
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="grid grid-cols-[100px_1.8fr_0.85fr_0.85fr_0.85fr_0.7fr] gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          <div className="text-center">Data</div>
          <div className="text-left">Descrição</div>
          <div className="text-center">Categoria</div>
          <div className="text-center">Forma de pagamento</div>
          <div className="text-right">Valor</div>
          <div className="text-center">Status</div>
        </div>

        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="grid grid-cols-[100px_1.8fr_0.85fr_0.85fr_0.85fr_0.7fr] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
          >
            <div className="text-center text-[12.5px] font-medium text-[var(--text-tertiary)]">
              {formatDate(tx.date)}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                {tx.description}
                {tx.recurring && (
                  <span className="ml-2 rounded bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                    recorrente
                  </span>
                )}
                {tx.totalInstallments && (
                  <span className="ml-2 rounded bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                    {tx.installmentNumber}/{tx.totalInstallments}
                  </span>
                )}
              </p>
            </div>
            <div className="truncate text-center text-[13px] font-medium text-[var(--text-secondary)]">
              {tx.categoryId && categoriesById.get(tx.categoryId)
                ? categoriesById.get(tx.categoryId)!.name
                : "—"}
            </div>
            <div className="truncate text-center text-[13px] font-medium text-[var(--text-secondary)]">
              {getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods)}
            </div>
            <div
              className="font-display text-right text-[13.5px] font-bold tracking-tight tabular-nums"
              style={{
                color:
                  tx.type === "entrada"
                    ? "var(--chart-positive)"
                    : "var(--chart-negative)",
              }}
            >
              {tx.type === "entrada" ? "+" : "-"}
              {formatCurrency(tx.amount, tx.currency)}
            </div>
            <div className="flex justify-center">
              <StatusBadge status={tx.status} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState message="Nenhuma transação encontrada neste período." />
        )}
      </div>
    </div>
  );
}
