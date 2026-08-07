import { formatCurrency } from "@/lib/format";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import type {
  BudgetGoal,
  Card,
  Category,
  FinancialGoal,
  OnboardingMotivation,
  Transaction,
} from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function pickVariant<T>(id: string, variants: T[]): T {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % variants.length;
  }
  return variants[Math.abs(hash) % variants.length];
}

// ---------- parcelamentos ativos ----------

export interface InstallmentGroup {
  groupId: string;
  description: string;
  paymentMethodId: string | null;
  totalInstallments: number;
  remainingCount: number;
  installmentAmount: number;
  currency: Transaction["currency"];
  lastDate: string;
}

export function buildInstallmentGroups(transactions: Transaction[]): InstallmentGroup[] {
  const groups = new Map<string, Transaction[]>();

  transactions
    .filter((tx) => tx.installmentGroupId && tx.totalInstallments)
    .forEach((tx) => {
      const key = tx.installmentGroupId as string;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    });

  return Array.from(groups.entries())
    .map(([groupId, txs]) => {
      const sorted = [...txs].sort(
        (a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0),
      );
      const remaining = sorted.filter((tx) => tx.status !== "pago");
      const reference =
        sorted.find((tx) => tx.installmentNumber !== tx.totalInstallments) ?? sorted[0];
      return {
        groupId,
        description: sorted[0].description,
        paymentMethodId: sorted[0].paymentMethodId,
        totalInstallments: sorted[0].totalInstallments as number,
        remainingCount: remaining.length,
        installmentAmount: reference.amount,
        currency: sorted[0].currency,
        lastDate: sorted[sorted.length - 1].date,
      };
    })
    .filter((group) => group.remainingCount > 0)
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate));
}

export interface InstallmentMonthGroup {
  groupId: string;
  description: string;
  categoryId: string | null;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  currency: Transaction["currency"];
  date: string;
}

export function buildInstallmentGroupsForMonth(
  transactions: Transaction[],
  monthPrefix: string,
): InstallmentMonthGroup[] {
  return transactions
    .filter(
      (tx) =>
        tx.installmentGroupId &&
        tx.totalInstallments &&
        tx.installmentNumber &&
        tx.date.startsWith(monthPrefix),
    )
    .map((tx) => ({
      groupId: tx.installmentGroupId as string,
      description: tx.description,
      categoryId: tx.categoryId,
      installmentNumber: tx.installmentNumber as number,
      totalInstallments: tx.totalInstallments as number,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- alertas do dashboard ----------

export interface DashboardAlert {
  id: string;
  level: "critical" | "warning";
  message: string;
  trend: "up" | "down" | null;
  kind: "fatura" | "limite";
}

const DUE_SOON_DAYS = 5;
const BUDGET_WARNING_PERCENT = 90;

function daysUntilDue(dueDay: number, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < start) due = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  return Math.round((due.getTime() - start.getTime()) / 86400000);
}

export function buildDashboardAlerts(
  transactions: Transaction[],
  cards: Card[],
  categories: Category[],
  budgetGoals: BudgetGoal[],
  today: Date = new Date(),
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const currentMonthStr = monthStr(today);

  cards
    .filter((card) => card.type !== "debito" && card.dueDay)
    .forEach((card) => {
      const days = daysUntilDue(card.dueDay as number, today);
      if (days > DUE_SOON_DAYS) return;

      transactions
        .filter(
          (tx) =>
            tx.paymentMethodId === card.id &&
            tx.totalInstallments &&
            tx.status !== "pago" &&
            tx.date.startsWith(currentMonthStr),
        )
        .forEach((tx) => {
          const id = `installment-${tx.id}`;
          const installment = `${tx.installmentNumber}/${tx.totalInstallments}`;
          const amount = formatCurrency(tx.amount, tx.currency);
          const dayWord = days === 1 ? "dia" : "dias";
          const message = pickVariant(id, [
            `Parcela ${installment} de "${tx.description}" (${amount}) está na fatura do ${card.name}, que vence em ${days} ${dayWord}.`,
            `A fatura do ${card.name} vence em ${days} ${dayWord} e inclui a parcela ${installment} de "${tx.description}" (${amount}).`,
            `Fique de olho: em ${days} ${dayWord} fecha a fatura do ${card.name}, com a parcela ${installment} de "${tx.description}" (${amount}).`,
            `${card.name}: vencimento em ${days} ${dayWord}, com a parcela ${installment} de "${tx.description}" (${amount}) na fatura.`,
          ]);
          alerts.push({
            id,
            level: days <= 2 ? "critical" : "warning",
            message,
            trend: null,
            kind: "fatura",
          });
        });
    });

  const ALERT_HISTORY_MONTHS = 3;

  function goalSpendInMonth(goal: BudgetGoal, month: string): number {
    return transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.currency === PRIMARY_CURRENCY &&
          tx.date.startsWith(month) &&
          (goal.categoryId
            ? tx.categoryId === goal.categoryId
            : tx.paymentMethodId === goal.paymentMethodId),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  budgetGoals.forEach((goal) => {
    if (goal.monthlyLimit <= 0) return;

    const spend = goalSpendInMonth(goal, currentMonthStr);

    const percent = (spend / goal.monthlyLimit) * 100;
    if (percent < BUDGET_WARNING_PERCENT) return;

    const label = goal.categoryId
      ? (() => {
          const category = categories.find((c) => c.id === goal.categoryId);
          return category ? category.name : "categoria removida";
        })()
      : (() => {
          const card = cards.find((c) => c.id === goal.paymentMethodId);
          return card ? card.name : "cartão removido";
        })();

    const historyMonths: number[] = [];
    for (let i = 1; i <= ALERT_HISTORY_MONTHS; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      historyMonths.push(goalSpendInMonth(goal, monthStr(d)));
    }
    const monthsWithData = historyMonths.filter((v) => v > 0);
    const avgPrevious =
      monthsWithData.length > 0
        ? monthsWithData.reduce((sum, v) => sum + v, 0) / monthsWithData.length
        : 0;
    const percentVsAvg = avgPrevious > 0 ? Math.round(((spend - avgPrevious) / avgPrevious) * 100) : null;

    const budgetId = `budget-${goal.id}`;
    const roundedPercent = Math.round(percent);
    const spendStr = formatCurrency(spend);
    const limitStr = formatCurrency(goal.monthlyLimit);
    const avgContext =
      percentVsAvg !== null && percentVsAvg >= 5
        ? ` — ${percentVsAvg}% acima da média dos últimos meses`
        : "";
    const budgetMessage = pickVariant(budgetId, [
      `Você já usou ${roundedPercent}% da meta de ${label} este mês (${spendStr} de ${limitStr})${avgContext}.`,
      `A meta de ${label} está em ${roundedPercent}% (${spendStr} de ${limitStr}) neste mês${avgContext}.`,
      `Fique atento: ${label} já consumiu ${roundedPercent}% do limite mensal (${spendStr} de ${limitStr})${avgContext}.`,
      `${label} chegou a ${roundedPercent}% da meta mensal — ${spendStr} de ${limitStr} já gastos${avgContext}.`,
    ]);

    alerts.push({
      id: budgetId,
      level: percent >= 100 ? "critical" : "warning",
      message: budgetMessage,
      trend: percentVsAvg === null ? null : percentVsAvg >= 0 ? "up" : "down",
      kind: "limite",
    });
  });

  return alerts.sort((a, b) => {
    if (a.level === b.level) return 0;
    return a.level === "critical" ? -1 : 1;
  });
}

// ---------- sugestões de corte (metas) ----------

export interface SpendingSuggestion {
  id: string;
  categoryName: string;
  overspendPercent: number;
  overspendAmount: number;
  goalName: string;
  goalPercent: number;
  message: string;
  trend: "up";
}

const OVERSPEND_THRESHOLD_PERCENT = 15;
const OVERSPEND_MIN_AMOUNT = 20;
const HISTORY_MONTHS = 3;

function previousMonths(today: Date, count: number): string[] {
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    result.push(monthStr(d));
  }
  return result;
}

export function buildSpendingSuggestions(
  transactions: Transaction[],
  categories: Category[],
  financialGoals: FinancialGoal[],
  goalTotals: Map<string, number>,
  today: Date = new Date(),
): SpendingSuggestion[] {
  const activeGoals = financialGoals
    .filter((goal) => (goalTotals.get(goal.id) ?? 0) < goal.targetAmount)
    .sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return 0;
    });
  if (activeGoals.length === 0) return [];
  const goal = activeGoals[0];

  const currentMonthStr = monthStr(today);
  const priorMonths = previousMonths(today, HISTORY_MONTHS);
  const topCategories = categories.filter((c) => c.parentId === null);

  const suggestions: SpendingSuggestion[] = [];

  topCategories.forEach((category) => {
    const currentSpend = transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.categoryId === category.id &&
          tx.currency === PRIMARY_CURRENCY &&
          tx.date.startsWith(currentMonthStr),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthTotals = priorMonths.map((month) =>
      transactions
        .filter(
          (tx) =>
            tx.type === "saida" &&
            tx.categoryId === category.id &&
            tx.currency === PRIMARY_CURRENCY &&
            tx.date.startsWith(month),
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    );
    const monthsWithData = monthTotals.filter((value) => value > 0);
    if (monthsWithData.length === 0) return;

    const avgPrevious = monthsWithData.reduce((sum, v) => sum + v, 0) / monthsWithData.length;
    if (avgPrevious <= 0) return;

    const overspendAmount = currentSpend - avgPrevious;
    const overspendPercent = (overspendAmount / avgPrevious) * 100;
    if (overspendPercent < OVERSPEND_THRESHOLD_PERCENT || overspendAmount < OVERSPEND_MIN_AMOUNT) {
      return;
    }

    const goalPercent = goal.targetAmount > 0 ? (overspendAmount / goal.targetAmount) * 100 : 0;
    const suggestionId = `suggestion-${category.id}`;
    const categoryName = category.name;
    const roundedOverspendPercent = Math.round(overspendPercent);
    const overspendStr = formatCurrency(overspendAmount);
    const roundedGoalPercent = Math.round(goalPercent);

    const message = pickVariant(suggestionId, [
      `Você gastou ${roundedOverspendPercent}% a mais em ${categoryName} esse mês (${overspendStr} a mais que a média). Isso equivale a ${roundedGoalPercent}% da sua meta "${goal.name}".`,
      `${categoryName} ficou ${roundedOverspendPercent}% acima da média este mês — ${overspendStr} a mais, o equivalente a ${roundedGoalPercent}% da meta "${goal.name}".`,
      `Seu gasto em ${categoryName} subiu ${roundedOverspendPercent}% em relação à média (${overspendStr}). Isso representa ${roundedGoalPercent}% da meta "${goal.name}".`,
      `Fique de olho em ${categoryName}: ${roundedOverspendPercent}% acima do normal esse mês, o que equivale a ${roundedGoalPercent}% da meta "${goal.name}".`,
    ]);

    suggestions.push({
      id: suggestionId,
      categoryName,
      overspendPercent: roundedOverspendPercent,
      overspendAmount,
      goalName: goal.name,
      goalPercent: roundedGoalPercent,
      message,
      trend: "up",
    });
  });

  return suggestions.sort((a, b) => b.overspendAmount - a.overspendAmount).slice(0, 3);
}

// ---------- priorização personalizada (baseada no onboarding) ----------

export interface CombinedInsight {
  id: string;
  kind: "fatura" | "limite" | "economia";
  level: "critical" | "warning" | "info";
  message: string;
  trend: "up" | "down" | null;
}

// Ordem de prioridade dos tipos de insight por motivação escolhida no
// onboarding. "visao_geral" (ou sem preferência) mantém a ordem padrão:
// alertas primeiro (já vêm ordenados por severidade), sugestões depois.
const MOTIVATION_PRIORITY: Record<Exclude<OnboardingMotivation, "visao_geral">, CombinedInsight["kind"][]> = {
  dividas: ["fatura", "limite", "economia"],
  guardar: ["economia", "limite", "fatura"],
  dia_a_dia: ["limite", "economia", "fatura"],
};

export function buildPersonalizedInsights(
  alerts: DashboardAlert[],
  suggestions: SpendingSuggestion[],
  motivation?: OnboardingMotivation,
): CombinedInsight[] {
  const combined: CombinedInsight[] = [
    ...alerts.map((a) => ({
      id: a.id,
      kind: a.kind,
      level: a.level,
      message: a.message,
      trend: a.trend,
    })),
    ...suggestions.map((s) => ({
      id: s.id,
      kind: "economia" as const,
      level: "info" as const,
      message: s.message,
      trend: s.trend,
    })),
  ];

  if (!motivation || motivation === "visao_geral") return combined;

  const priority = MOTIVATION_PRIORITY[motivation];
  return [...combined].sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind));
}
