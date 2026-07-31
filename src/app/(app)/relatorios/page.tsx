"use client";

import { useMemo } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { EmptyState } from "@/components/EmptyState";
import { cardClass, KpiCard } from "@/components/KpiCard";
import { TimelineAreaChart } from "@/components/charts/TimelineAreaChart";
import { formatCurrency } from "@/lib/format";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { buildDashboardAlerts, buildSpendingSuggestions } from "@/lib/insights";
import {
  buildBalanceProjection,
  buildCategorySpendReport,
  buildUpcomingInstallments,
} from "@/lib/reports";

export default function RelatoriosPage() {
  const {
    transactions,
    categories,
    cards,
    budgetGoals,
    financialGoals,
    financialGoalContributions,
    investmentPositions,
  } = useFinanceData();

  const today = useMemo(() => new Date(), []);

  const alerts = useMemo(
    () => buildDashboardAlerts(transactions, cards, categories, budgetGoals, today),
    [transactions, cards, categories, budgetGoals, today],
  );

  const goalTotals = useMemo(() => {
    const totals = new Map<string, number>();
    financialGoalContributions.forEach((c) => {
      totals.set(c.goalId, (totals.get(c.goalId) ?? 0) + c.amount);
    });
    return totals;
  }, [financialGoalContributions]);

  const spendingSuggestions = useMemo(
    () => buildSpendingSuggestions(transactions, categories, financialGoals, goalTotals, today),
    [transactions, categories, financialGoals, goalTotals, today],
  );

  const categorySpend = useMemo(
    () => buildCategorySpendReport(transactions, categories, today),
    [transactions, categories, today],
  );
  const maxCategoryValue = Math.max(1, ...categorySpend.map((row) => row.value));

  const upcomingInstallments = useMemo(
    () => buildUpcomingInstallments(transactions, cards, today),
    [transactions, cards, today],
  );

  const projection = useMemo(
    () => buildBalanceProjection(transactions, investmentPositions, cards, today),
    [transactions, investmentPositions, cards, today],
  );
  const projectionChartPoints = useMemo(() => {
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return [{ month: currentMonth, value: projection.startingBalance }, ...projection.points];
  }, [projection, today]);

  const isInsightsEmpty = alerts.length === 0 && spendingSuggestions.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Relatórios
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Alertas, sugestões e projeções calculados a partir dos seus dados
        </p>
      </div>

      {isInsightsEmpty && (
        <EmptyState message="Nenhum alerta ou sugestão no momento. Tudo em ordem!" />
      )}

      {alerts.length > 0 && (
        <div className={cardClass}>
          <h2 className="font-display mb-3 text-sm font-bold text-[var(--foreground)]">
            Alertas
          </h2>
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      alert.level === "critical" ? "var(--chart-negative)" : "#d97706",
                  }}
                />
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {spendingSuggestions.length > 0 && (
        <div className={cardClass}>
          <h2 className="font-display mb-3 text-sm font-bold text-[var(--foreground)]">
            Sugestões de economia
          </h2>
          <ul className="space-y-3">
            {spendingSuggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                {suggestion.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={cardClass}>
        <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
          Gasto por categoria
        </h2>
        {categorySpend.length === 0 ? (
          <EmptyState message="Nenhum gasto categorizado neste mês." />
        ) : (
          <ul className="space-y-4">
            {categorySpend.map((row) => (
              <li key={row.categoryId}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-base"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${row.color} 18%, transparent)`,
                      }}
                    >
                      {row.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                        {row.name}
                      </p>
                      {row.variationAmount !== 0 && (
                        <p
                          className="text-[11px] font-medium"
                          style={{
                            color:
                              row.variationAmount > 0
                                ? "var(--chart-negative)"
                                : "var(--chart-positive)",
                          }}
                        >
                          {row.variationAmount > 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(row.variationAmount))} vs{" "}
                          {row.previousMonthLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-[13.5px] font-bold tracking-tight tabular-nums text-[var(--foreground)]">
                      {formatCurrency(row.value)}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                      {row.percentOfTotal}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--background)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (row.value / maxCategoryValue) * 100)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
          Próximas faturas
        </h2>
        {upcomingInstallments.length === 0 ? (
          <EmptyState message="Nenhuma parcela em aberto para os próximos meses." />
        ) : (
          <div className="space-y-5">
            {upcomingInstallments.map((monthData) => (
              <div key={monthData.month}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[var(--foreground)]">
                    {monthData.label}
                  </p>
                  <p className="font-display text-[13px] font-bold tracking-tight tabular-nums text-[var(--foreground)]">
                    {formatCurrency(monthData.totalAmount)}
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {monthData.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-[13px] text-[var(--text-secondary)]"
                    >
                      <span className="truncate">
                        {item.description}{" "}
                        <span className="text-[var(--text-tertiary)]">
                          {item.installmentLabel} · {item.cardName}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="font-display mb-1 text-sm font-bold text-[var(--foreground)]">
          Projeção de saldo
        </h2>
        <p className="mb-4 text-[11.5px] font-medium text-[var(--text-tertiary)]">
          Estimativa com base na sua receita e gastos recorrentes, parcelamentos em aberto,
          média de gastos variáveis e média de aportes.
        </p>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Receita fixa"
            value={formatCurrency(projection.assumptions.fixedIncome)}
            color="var(--chart-positive)"
            variation={null}
          />
          <KpiCard
            label="Gasto fixo"
            value={formatCurrency(projection.assumptions.fixedExpense)}
            color="var(--chart-negative)"
            variation={null}
          />
          <KpiCard
            label="Gasto variável médio"
            value={formatCurrency(projection.assumptions.avgVariableExpense)}
            color="var(--foreground)"
            variation={null}
          />
        </div>

        <TimelineAreaChart points={projectionChartPoints} currency={PRIMARY_CURRENCY} />
        <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
          Projeção para os próximos {projection.points.length} meses a partir do saldo atual.
        </p>
      </div>
    </div>
  );
}
