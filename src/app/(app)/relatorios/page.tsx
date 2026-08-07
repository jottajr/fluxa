"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { EmptyState } from "@/components/EmptyState";
import { cardClass, KpiCard } from "@/components/KpiCard";
import { TimelineAreaChart } from "@/components/charts/TimelineAreaChart";
import { formatCurrency } from "@/lib/format";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { buildDashboardAlerts, buildPersonalizedInsights, buildSpendingSuggestions } from "@/lib/insights";
import { buildBalanceProjection } from "@/lib/reports";
import { useOnboarding } from "@/lib/onboarding-context";
import type { OnboardingMotivation } from "@/types";

type TabId = "geral" | "projecao";

const TABS: { id: TabId; label: string }[] = [
  { id: "geral", label: "Visão geral" },
  { id: "projecao", label: "Projeção de saldo" },
];

const MOTIVATION_LABEL: Record<OnboardingMotivation, string> = {
  dividas: "sair das dívidas",
  guardar: "guardar dinheiro",
  dia_a_dia: "controlar o dia a dia",
  visao_geral: "",
};

const LEVEL_COLOR: Record<"critical" | "warning" | "info", string> = {
  critical: "var(--chart-negative)",
  warning: "#d97706",
  info: "var(--accent)",
};

function TrendArrow({ trend }: { trend: "up" | "down" | null }) {
  if (!trend) return null;
  return (
    <span
      className="mt-0.5 shrink-0 text-sm font-bold"
      style={{ color: trend === "up" ? "var(--chart-negative)" : "var(--chart-positive)" }}
    >
      {trend === "up" ? "↑" : "↓"}
    </span>
  );
}

function InsightDot({ color }: { color: string }) {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

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
  const [activeTab, setActiveTab] = useState<TabId>("geral");
  const { preferences } = useOnboarding();
  const motivation = preferences?.motivation;

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

  const personalizedInsights = useMemo(
    () => buildPersonalizedInsights(alerts, spendingSuggestions, motivation),
    [alerts, spendingSuggestions, motivation],
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Relatórios
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Alertas, sugestões e projeções calculados a partir dos seus dados
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border-subtle)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "geral" && (
        <div className="space-y-3">
          {isInsightsEmpty && (
            <EmptyState message="Nenhum alerta ou sugestão no momento. Tudo em ordem!" />
          )}

          {!isInsightsEmpty && motivation && motivation !== "visao_geral" && (
            <p className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Ordenado com base no que você nos contou: foco em{" "}
              {MOTIVATION_LABEL[motivation]}.
            </p>
          )}

          {personalizedInsights.map((insight) => (
            <div key={insight.id} className={cardClass}>
              <div className="flex items-start gap-2.5">
                {insight.trend ? (
                  <TrendArrow trend={insight.trend} />
                ) : (
                  <InsightDot color={LEVEL_COLOR[insight.level]} />
                )}
                <p className="flex-1 text-[13px] text-[var(--text-secondary)]">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "projecao" && (
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
      )}
    </div>
  );
}
