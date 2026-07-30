"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { CATEGORICAL } from "@/lib/chart-colors";
import { SolidPieChart } from "@/components/charts/SolidPieChart";
import { TimelineAreaChart } from "@/components/charts/TimelineAreaChart";
import { EmptyState } from "@/components/EmptyState";
import {
  type DateRange,
  type PeriodType,
  defaultSubPeriodFor,
  getPeriodRange,
  getPreviousPeriodRange,
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
import { buildBalanceTimeline } from "@/lib/balance-timeline";
import { downsampleTimeline } from "@/lib/timeline";
import { cardClass, KpiCard, Variation } from "@/components/KpiCard";
import type { Currency } from "@/types";

const DASHBOARD_PERIOD_TABS: PeriodType[] = ["mensal", "anual", "personalizado"];

function sumByType(
  transactions: { type: string; amount: number; currency: Currency }[],
  type: "entrada" | "saida",
  currency: Currency,
) {
  return transactions
    .filter((tx) => tx.type === type && tx.currency === currency)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function daysUntilDue(dueDay: number, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < start) due = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  return Math.round((due.getTime() - start.getTime()) / 86400000);
}

function dueDayLabel(days: number): string {
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}

export default function DashboardPage() {
  const { transactions, categories, cards, budgetGoals } = useFinanceData();

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

  const previousRange = useMemo(() => {
    const prev = getPreviousPeriodRange(periodType, year, subPeriod);
    if (!prev) return null;
    return getPeriodRange(periodType, prev.year, prev.subPeriod, null);
  }, [periodType, year, subPeriod]);

  const previousTransactions = useMemo(() => {
    if (!previousRange) return null;
    return transactions.filter(
      (tx) => tx.date >= previousRange.start && tx.date <= previousRange.end,
    );
  }, [transactions, previousRange]);

  const previousEntradas =
    previousTransactions !== null
      ? sumByType(previousTransactions, "entrada", selectedCurrency)
      : null;
  const previousSaidas =
    previousTransactions !== null
      ? sumByType(previousTransactions, "saida", selectedCurrency)
      : null;

  const balanceSeries = useMemo(
    () => buildBalanceTimeline(transactions, selectedCurrency, today),
    [transactions, selectedCurrency],
  );
  const saldoTotal = balanceSeries.at(-1)?.value ?? 0;
  const previousSaldoTotal =
    balanceSeries.length >= 2 ? balanceSeries[balanceSeries.length - 2].value : null;
  const balanceTimeline = useMemo(() => downsampleTimeline(balanceSeries), [balanceSeries]);

  const cardSpend = useMemo(() => {
    const totals = new Map<string, number>();
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
        totals.set(card.id, (totals.get(card.id) ?? 0) + tx.amount);
      });
    return totals;
  }, [periodTransactions, cards, selectedCurrency]);

  const cardBreakdown: CategoryBreakdownItem[] = useMemo(
    () =>
      Array.from(cardSpend.entries())
        .map(([cardId, value], index) => {
          const card = cards.find((c) => c.id === cardId)!;
          return {
            name: card.name,
            value,
            color: CATEGORICAL[index % CATEGORICAL.length],
          };
        })
        .sort((a, b) => b.value - a.value),
    [cardSpend, cards],
  );

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

  const latestTransactions = useMemo(
    () =>
      [...periodTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [periodTransactions],
  );

  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const monthSpendByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.date.startsWith(currentMonthStr) &&
          tx.currency === PRIMARY_CURRENCY,
      )
      .forEach((tx) => {
        if (!tx.categoryId) return;
        totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
      });
    return totals;
  }, [transactions, currentMonthStr]);
  const monthSpendByPaymentMethod = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.date.startsWith(currentMonthStr) &&
          tx.currency === PRIMARY_CURRENCY,
      )
      .forEach((tx) => {
        if (!tx.paymentMethodId) return;
        totals.set(
          tx.paymentMethodId,
          (totals.get(tx.paymentMethodId) ?? 0) + tx.amount,
        );
      });
    return totals;
  }, [transactions, currentMonthStr]);

  function goalLabel(goal: (typeof budgetGoals)[number]) {
    if (goal.categoryId) {
      const category = categories.find((c) => c.id === goal.categoryId);
      return category ? `${category.icon} ${category.name}` : "Categoria removida";
    }
    const card = cards.find((c) => c.id === goal.paymentMethodId);
    return card ? card.name : "Cartão removido";
  }

  function goalSpend(goal: (typeof budgetGoals)[number]) {
    if (goal.categoryId) return monthSpendByCategory.get(goal.categoryId) ?? 0;
    if (goal.paymentMethodId) return monthSpendByPaymentMethod.get(goal.paymentMethodId) ?? 0;
    return 0;
  }

  const topGoals = useMemo(
    () =>
      [...budgetGoals]
        .sort((a, b) => goalSpend(b) / b.monthlyLimit - goalSpend(a) / a.monthlyLimit)
        .slice(0, 3),
    [budgetGoals, monthSpendByCategory, monthSpendByPaymentMethod],
  );

  const upcomingPayments = useMemo(
    () =>
      cards
        .filter((c) => c.type !== "debito" && c.dueDay)
        .map((c) => ({
          card: c,
          days: daysUntilDue(c.dueDay as number, today),
          amount: cardSpend.get(c.id) ?? 0,
        }))
        .sort((a, b) => a.days - b.days)
        .slice(0, 4),
    [cards, cardSpend],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            Visão geral das suas finanças
          </p>
        </div>

        <div className="ml-auto flex items-center gap-4">
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
            tabs={DASHBOARD_PERIOD_TABS}
            showSteppers
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard
          label="Saldo total"
          value={formatCurrency(saldoTotal, selectedCurrency)}
          color={saldoTotal >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"}
          variation={
            <Variation current={saldoTotal} previous={previousSaldoTotal} higherIsGood />
          }
        />
        <KpiCard
          label="Entradas"
          value={formatCurrency(entradas, selectedCurrency)}
          color="var(--chart-positive)"
          variation={
            <Variation current={entradas} previous={previousEntradas} higherIsGood />
          }
        />
        <KpiCard
          label="Saídas"
          value={formatCurrency(saidas, selectedCurrency)}
          color="var(--chart-negative)"
          variation={
            <Variation current={saidas} previous={previousSaidas} higherIsGood={false} />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className={cardClass}>
          <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
            Evolução do saldo
          </h2>
          {balanceTimeline.points.length === 0 ? (
            <EmptyState
              message="Sem transações registradas ainda."
              actionLabel="Adicionar transação"
              actionHref="/transacoes"
            />
          ) : (
            <>
              <TimelineAreaChart points={balanceTimeline.points} currency={selectedCurrency} />
              {balanceTimeline.granularity !== "mensal" && (
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Valores {balanceTimeline.granularity === "semestral" ? "semestrais" : "anuais"}
                </p>
              )}
            </>
          )}
        </div>

        <div className={cardClass}>
          <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
            Gastos por categoria
          </h2>
          {categoryBreakdown.length === 0 ? (
            <EmptyState
              message="Nenhum gasto categorizado neste período."
              actionLabel="Adicionar transação"
              actionHref="/transacoes"
            />
          ) : (
            <SolidPieChart data={categoryBreakdown} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
              Últimas transações
            </h2>
            <Link
              href="/transacoes"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {latestTransactions.length === 0 ? (
            <EmptyState
              message="Nenhuma transação neste período."
              actionLabel="Adicionar transação"
              actionHref="/transacoes"
            />
          ) : (
            <ul className="space-y-3">
              {latestTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold ${
                      tx.type === "entrada"
                        ? "bg-[var(--chart-positive)]/15 text-[var(--chart-positive)]"
                        : "bg-[var(--chart-negative)]/15 text-[var(--chart-negative)]"
                    }`}
                  >
                    {tx.description.charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className="font-display shrink-0 text-sm font-bold tracking-tight tabular-nums"
                    style={{
                      color:
                        tx.type === "entrada"
                          ? "var(--chart-positive)"
                          : "var(--chart-negative)",
                    }}
                  >
                    {tx.type === "entrada" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-6">
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[var(--foreground)]">Metas</h2>
            <Link
              href="/metas"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {topGoals.length === 0 ? (
            <EmptyState
              message="Nenhuma meta cadastrada ainda."
              actionLabel="Criar meta"
              actionHref="/metas"
            />
          ) : (
            <div className="space-y-4">
              {topGoals.map((goal) => {
                const spend = goalSpend(goal);
                const percent =
                  goal.monthlyLimit > 0 ? (spend / goal.monthlyLimit) * 100 : 0;
                const overBudget = spend > goal.monthlyLimit;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-semibold text-[var(--foreground)]">
                        {goalLabel(goal)}
                      </span>
                      <span
                        className="shrink-0 text-xs font-medium"
                        style={{
                          color: overBudget
                            ? "var(--chart-negative)"
                            : "var(--text-tertiary)",
                        }}
                      >
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--background)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, percent))}%`,
                          backgroundColor: overBudget
                            ? "var(--chart-negative)"
                            : "var(--chart-positive)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`${cardClass} flex-1`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
              Próximos pagamentos
            </h2>
            <Link
              href="/pagamentos"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {upcomingPayments.length === 0 ? (
            <EmptyState
              message="Nenhum cartão com vencimento cadastrado."
              actionLabel="Configurar cartões"
              actionHref="/pagamentos"
            />
          ) : (
            <>
              <ul className="space-y-3">
                {upcomingPayments.map(({ card, days, amount }) => (
                  <li key={card.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {card.name}
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{
                          color:
                            days <= 5 ? "var(--chart-negative)" : "var(--text-tertiary)",
                        }}
                      >
                        {dueDayLabel(days)}
                      </p>
                    </div>
                    <span className="font-display shrink-0 text-sm font-bold tracking-tight tabular-nums text-[var(--foreground)]">
                      {formatCurrency(amount, selectedCurrency)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">
                Valor com base nos gastos do período selecionado.
              </p>
            </>
          )}
        </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
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
  );
}
