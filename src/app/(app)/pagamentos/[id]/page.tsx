"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";
import { CATEGORICAL } from "@/lib/chart-colors";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { StatusBadge } from "@/components/StatusBadge";
import { PieChart, type PieSlice } from "@/components/charts/PieChart";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { CardInvoiceBarChart } from "@/components/charts/CardInvoiceBarChart";
import { cardClass, KpiCard } from "@/components/KpiCard";
import { EmptyState } from "@/components/EmptyState";
import { buildInstallmentGroupsForMonth } from "@/lib/insights";
import { buildCardInvoiceHistory } from "@/lib/reports";

export default function PaymentMethodDetailPage() {
  const params = useParams<{ id: string }>();
  const { cards, transactions, categories, genericPaymentMethods, budgetGoals } =
    useFinanceData();

  const card = cards.find((c) => c.id === params.id);
  const generic = genericPaymentMethods.find((m) => m.id === params.id);

  const title = card ? card.name : generic ? generic.name : null;
  const icon = generic ? generic.icon : null;

  const methodTransactions = useMemo(
    () => transactions.filter((tx) => tx.paymentMethodId === params.id),
    [transactions, params.id],
  );

  const months = useMemo(() => {
    const unique = new Set(methodTransactions.map((tx) => tx.date.slice(0, 7)));
    return Array.from(unique).sort().reverse();
  }, [methodTransactions]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (months.includes(currentMonth)) return currentMonth;
    return months.find((m) => m <= currentMonth) ?? months[0] ?? currentMonth;
  });

  const monthTransactions = useMemo(
    () =>
      methodTransactions
        .filter((tx) => tx.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [methodTransactions, selectedMonth],
  );

  const cardGoal = card
    ? budgetGoals.find((g) => g.paymentMethodId === card.id && !g.categoryId)
    : undefined;

  const total = monthTransactions
    .filter((tx) => tx.currency === PRIMARY_CURRENCY)
    .reduce((sum, tx) => {
      return tx.type === "saida" ? sum + tx.amount : sum - tx.amount;
    }, 0);

  const totalGastos = monthTransactions
    .filter((tx) => tx.type === "saida" && tx.currency === PRIMARY_CURRENCY)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const goalPercent = cardGoal ? (totalGastos / cardGoal.monthlyLimit) * 100 : null;
  const goalOverBudget = goalPercent !== null && goalPercent > 100;

  const milesEarned =
    card?.milesRatioAmount && card?.milesRatioMiles
      ? Math.floor(totalGastos / card.milesRatioAmount) * card.milesRatioMiles
      : null;

  const percentUsed = card?.creditLimit
    ? Math.round((total / card.creditLimit) * 100)
    : null;

  const meterColor =
    percentUsed === null
      ? "var(--chart-positive)"
      : percentUsed >= 90
        ? "var(--chart-negative)"
        : percentUsed >= 70
          ? "#d97706"
          : "var(--chart-positive)";

  const installmentGroupsForMonth = useMemo(
    () => buildInstallmentGroupsForMonth(methodTransactions, selectedMonth),
    [methodTransactions, selectedMonth],
  );

  const invoiceBars = useMemo(
    () => (card ? buildCardInvoiceHistory(methodTransactions, card.id, selectedMonth) : []),
    [methodTransactions, card, selectedMonth],
  );

  const categoryBreakdown: PieSlice[] = useMemo(() => {
    const totals = new Map<string, number>();
    monthTransactions
      .filter((tx) => tx.type === "saida" && tx.currency === PRIMARY_CURRENCY)
      .forEach((tx) => {
        const key = tx.categoryId ?? "sem-categoria";
        totals.set(key, (totals.get(key) ?? 0) + tx.amount);
      });

    return Array.from(totals.entries())
      .map(([categoryId, value], index) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category ? `${category.icon} ${category.name}` : "🏷️ Sem categoria",
          value,
          color: CATEGORICAL[index % CATEGORICAL.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  if (!title) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/pagamentos"
          className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
        >
          ← Voltar para pagamentos
        </Link>
        <p className="text-sm text-[var(--text-tertiary)]">
          Forma de pagamento não encontrada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        href="/pagamentos"
        className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
      >
        ← Voltar para pagamentos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-2 text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            {icon && <span>{icon}</span>}
            {title}
          </h1>
          {card && (
            <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
              {card.bank}
              {card.type !== "debito" &&
                ` · Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`}
            </p>
          )}
        </div>
        {months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-[11px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold capitalize text-[var(--foreground)]"
          >
            {months.map((month) => (
              <option key={month} value={month} className="capitalize">
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        )}
      </div>

      {card && invoiceBars.length > 0 && (
        <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
            Faturas
          </h2>
          <CardInvoiceBarChart bars={invoiceBars} onSelect={setSelectedMonth} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            Total comprometido no mês
          </p>
          <p className="font-display mt-2.5 text-[28px] font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
            {formatCurrency(total)}
          </p>
          {cardGoal && goalPercent !== null && (
            <p
              className="mt-1.5 text-[11px] font-semibold"
              style={{ color: goalOverBudget ? "var(--chart-negative)" : "var(--text-tertiary)" }}
            >
              Meta: {formatCurrency(cardGoal.monthlyLimit)} —{" "}
              {goalOverBudget
                ? `${Math.round(goalPercent - 100)}% acima da meta`
                : `${Math.round(goalPercent)}% gasto da meta`}
            </p>
          )}
        </div>

        {milesEarned !== null && (
          <KpiCard
            label="Milhas ganhas no mês"
            value={milesEarned.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            color="var(--foreground)"
            variation={null}
          />
        )}

        {percentUsed !== null && (
          <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                % do limite utilizado
              </p>
              <p className="font-display text-sm font-bold text-[var(--foreground)]">
                {percentUsed}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--background)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, percentUsed))}%`,
                  backgroundColor: meterColor,
                }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-[var(--text-tertiary)]">
              Limite de {formatCurrency(card?.creditLimit ?? 0)}
            </p>
          </div>
        )}
      </div>

      {card && installmentGroupsForMonth.length > 0 && (
        <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
            Parcelamentos ativos
          </h2>
          <div className="space-y-4">
            {installmentGroupsForMonth.map((group, index) => {
              const category = group.categoryId
                ? categories.find((c) => c.id === group.categoryId)
                : null;
              const color = CATEGORICAL[index % CATEGORICAL.length];
              return (
                <div key={group.groupId} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-base"
                      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)` }}
                    >
                      {category ? category.icon : "💳"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                        {group.description}
                      </p>
                      <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                        {formatCurrency(group.amount, group.currency)}
                      </p>
                    </div>
                  </div>
                  <ProgressRing
                    percent={(group.installmentNumber / group.totalInstallments) * 100}
                    label={`${group.installmentNumber}/${group.totalInstallments}`}
                    color={color}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
        <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
          Gastos por categoria no mês
        </h2>
        <PieChart data={categoryBreakdown} centerLabel={formatCurrency(total)} />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="grid grid-cols-[100px_1.4fr_1fr_1fr_0.8fr] gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          <div>Data</div>
          <div>Descrição</div>
          <div>Categoria</div>
          <div className="text-right">Valor</div>
          <div>Status</div>
        </div>

        {monthTransactions.map((tx) => {
          const category = tx.categoryId
            ? categories.find((c) => c.id === tx.categoryId)
            : null;
          return (
            <div
              key={tx.id}
              className="grid grid-cols-[100px_1.4fr_1fr_1fr_0.8fr] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
            >
              <div className="text-[12.5px] font-medium text-[var(--text-tertiary)]">
                {formatDate(tx.date)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                  {tx.description}
                  {tx.totalInstallments && (
                    <span className="ml-2 rounded bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                      {tx.installmentNumber}/{tx.totalInstallments}
                    </span>
                  )}
                </p>
              </div>
              <div className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
                {category ? category.name : "—"}
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
              <div>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          );
        })}

        {monthTransactions.length === 0 && (
          <EmptyState message="Nenhuma transação neste mês." />
        )}
      </div>
    </div>
  );
}
