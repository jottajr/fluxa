"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";
import { CATEGORICAL } from "@/lib/chart-colors";
import { StatusBadge } from "@/components/StatusBadge";
import { PieChart, type PieSlice } from "@/components/charts/PieChart";

export default function PaymentMethodDetailPage() {
  const params = useParams<{ id: string }>();
  const { cards, transactions, categories, genericPaymentMethods } = useFinanceData();

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

  const total = monthTransactions.reduce((sum, tx) => {
    return tx.type === "saida" ? sum + tx.amount : sum - tx.amount;
  }, 0);

  const percentUsed = card?.creditLimit
    ? Math.round((total / card.creditLimit) * 100)
    : null;

  const meterColor =
    percentUsed === null
      ? ""
      : percentUsed >= 90
        ? "bg-red-500"
        : percentUsed >= 70
          ? "bg-amber-500"
          : "bg-emerald-500";

  const categoryBreakdown: PieSlice[] = useMemo(() => {
    const totals = new Map<string, number>();
    monthTransactions
      .filter((tx) => tx.type === "saida")
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
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Voltar para pagamentos
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Forma de pagamento não encontrada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <Link
          href="/pagamentos"
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Voltar para pagamentos
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            {icon && <span>{icon}</span>}
            {title}
          </h1>
          {card && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {card.bank} ·{" "}
              {card.type === "debito"
                ? "Débito"
                : `Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`}
            </p>
          )}
        </div>
        {months.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm capitalize focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {months.map((month) => (
              <option key={month} value={month} className="capitalize">
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total comprometido no mês
          </p>
          <p className="mt-1 text-2xl font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(total)}
          </p>
        </div>

        {percentUsed !== null && (
          <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                % do limite utilizado
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {percentUsed}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${meterColor}`}
                style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Limite de {formatCurrency(card?.creditLimit ?? 0)}
            </p>
          </div>
        )}
      </div>

      <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
          Gastos por categoria no mês
        </h2>
        <PieChart data={categoryBreakdown} centerLabel={formatCurrency(total)} />
      </div>

      <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categoria
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {monthTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {tx.description}
                  {tx.totalInstallments && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {tx.installmentNumber}/{tx.totalInstallments}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {(() => {
                    const category = tx.categoryId
                      ? categories.find((c) => c.id === tx.categoryId)
                      : null;
                    return category ? `${category.icon} ${category.name}` : "—";
                  })()}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                    tx.type === "entrada"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "entrada" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
            {monthTransactions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  Nenhuma transação neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
