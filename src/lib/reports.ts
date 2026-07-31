import { CATEGORICAL } from "@/lib/chart-colors";
import { formatCurrency, formatMonthLabel, monthNameOnly, MONTH_ABBR } from "@/lib/format";
import { buildBalanceTimeline } from "@/lib/balance-timeline";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import type {
  BudgetGoal,
  Card,
  Category,
  InvestmentPosition,
  Transaction,
} from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function shiftMonth(today: Date, offset: number): Date {
  return new Date(today.getFullYear(), today.getMonth() + offset, 1);
}

// ---------- gasto por categoria (com variação vs mês anterior) ----------

export interface CategorySpendRow {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  value: number;
  percentOfTotal: number;
  variationAmount: number;
  previousMonthLabel: string;
}

export function buildCategorySpendReport(
  transactions: Transaction[],
  categories: Category[],
  today: Date = new Date(),
): CategorySpendRow[] {
  const currentMonthStr = monthStr(today);
  const previousMonthStr = monthStr(shiftMonth(today, -1));
  const topCategories = categories.filter((c) => c.parentId === null);

  function spendByCategory(monthPrefix: string) {
    const totals = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.currency === PRIMARY_CURRENCY &&
          tx.date.startsWith(monthPrefix),
      )
      .forEach((tx) => {
        if (!tx.categoryId) return;
        totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
      });
    return totals;
  }

  const current = spendByCategory(currentMonthStr);
  const previous = spendByCategory(previousMonthStr);
  const total = Array.from(current.values()).reduce((sum, v) => sum + v, 0);

  return topCategories
    .map((category, index) => {
      const value = current.get(category.id) ?? 0;
      const previousValue = previous.get(category.id) ?? 0;
      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: CATEGORICAL[index % CATEGORICAL.length],
        value,
        percentOfTotal: total > 0 ? Math.round((value / total) * 100) : 0,
        variationAmount: value - previousValue,
        previousMonthLabel: monthNameOnly(previousMonthStr),
      };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

export interface CategorySpendSummary {
  total: number;
  previousTotal: number;
  variationPercent: number | null;
  previousMonthLabel: string;
  message: string | null;
}

export function buildCategorySpendSummary(
  transactions: Transaction[],
  categories: Category[],
  today: Date = new Date(),
): CategorySpendSummary {
  const currentMonthStr = monthStr(today);
  const previousMonthStr = monthStr(shiftMonth(today, -1));
  const previousMonthLabel = monthNameOnly(previousMonthStr);

  function totalSpend(monthPrefix: string) {
    return transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.currency === PRIMARY_CURRENCY &&
          tx.date.startsWith(monthPrefix),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  const total = totalSpend(currentMonthStr);
  const previousTotal = totalSpend(previousMonthStr);
  const variationPercent =
    previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;

  const rows = buildCategorySpendReport(transactions, categories, today);
  if (rows.length === 0) {
    return { total, previousTotal, variationPercent, previousMonthLabel, message: null };
  }

  const biggest = rows[0];
  const rising = [...rows].sort((a, b) => b.variationAmount - a.variationAmount)[0];

  let message = `${biggest.name} continua o maior peso`;
  if (rising.variationAmount > 0 && rising.categoryId !== biggest.categoryId) {
    message += ` — e ${rising.name} subiu ${formatCurrency(rising.variationAmount)} vs ${previousMonthLabel}.`;
  } else if (rising.variationAmount > 0) {
    message += `, e também foi quem mais subiu: ${formatCurrency(rising.variationAmount)} vs ${previousMonthLabel}.`;
  } else {
    message += ".";
  }

  return { total, previousTotal, variationPercent, previousMonthLabel, message };
}

// ---------- próximas faturas (parcelas futuras, todos os cartões) ----------

export interface UpcomingInstallmentItem {
  id: string;
  description: string;
  installmentLabel: string;
  amount: number;
  cardName: string;
}

export interface UpcomingInvoiceCardGroup {
  cardName: string;
  totalAmount: number;
  items: UpcomingInstallmentItem[];
}

export interface UpcomingInvoiceMonth {
  month: string;
  label: string;
  totalAmount: number;
  items: UpcomingInstallmentItem[];
  byCard: UpcomingInvoiceCardGroup[];
}

const UPCOMING_MONTHS_AHEAD = 6;

export function buildUpcomingInstallments(
  transactions: Transaction[],
  cards: Card[],
  today: Date = new Date(),
): UpcomingInvoiceMonth[] {
  const pending = transactions.filter(
    (tx) => tx.totalInstallments && tx.status !== "pago",
  );

  const months: UpcomingInvoiceMonth[] = [];
  for (let i = 0; i < UPCOMING_MONTHS_AHEAD; i++) {
    const monthDate = shiftMonth(today, i);
    const month = monthStr(monthDate);
    const monthItems = pending.filter((tx) => tx.date.startsWith(month));

    const items = monthItems.map((tx) => {
      const card = cards.find((c) => c.id === tx.paymentMethodId);
      return {
        id: tx.id,
        description: tx.description,
        installmentLabel: `${tx.installmentNumber}/${tx.totalInstallments}`,
        amount: tx.amount,
        cardName: card ? card.name : "—",
      };
    });

    const cardGroups = new Map<string, UpcomingInstallmentItem[]>();
    items.forEach((item) => {
      if (!cardGroups.has(item.cardName)) cardGroups.set(item.cardName, []);
      cardGroups.get(item.cardName)!.push(item);
    });
    const byCard = Array.from(cardGroups.entries())
      .map(([cardName, cardItems]) => ({
        cardName,
        totalAmount: cardItems.reduce((sum, i) => sum + i.amount, 0),
        items: cardItems,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    months.push({
      month,
      label: formatMonthLabel(month),
      totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
      items,
      byCard,
    });
  }

  return months.filter((m) => m.items.length > 0);
}

// ---------- projeção de saldo ----------

export interface BalanceProjectionAssumptions {
  fixedIncome: number;
  fixedExpense: number;
  avgVariableExpense: number;
  avgMonthlyContribution: number;
}

export interface BalanceProjectionPoint {
  month: string;
  label: string;
  value: number;
}

export interface BalanceProjection {
  assumptions: BalanceProjectionAssumptions;
  startingBalance: number;
  points: BalanceProjectionPoint[];
}

const PROJECTION_MONTHS_AHEAD = 6;
const PROJECTION_HISTORY_MONTHS = 3;

function monthTotal(
  transactions: Transaction[],
  month: string,
  type: "entrada" | "saida",
  opts: { recurringOnly?: boolean; excludeRecurringAndInstallments?: boolean } = {},
): number {
  return transactions
    .filter((tx) => {
      if (tx.type !== type) return false;
      if (tx.currency !== PRIMARY_CURRENCY) return false;
      if (!tx.date.startsWith(month)) return false;
      if (opts.recurringOnly && !tx.recurring) return false;
      if (opts.excludeRecurringAndInstallments && (tx.recurring || tx.totalInstallments)) {
        return false;
      }
      return true;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function findFixedAmount(
  transactions: Transaction[],
  type: "entrada" | "saida",
  today: Date,
): number {
  for (let i = 0; i >= -PROJECTION_HISTORY_MONTHS; i--) {
    const month = monthStr(shiftMonth(today, i));
    const total = monthTotal(transactions, month, type, { recurringOnly: true });
    if (total > 0) return total;
  }
  return 0;
}

export function buildBalanceProjection(
  transactions: Transaction[],
  investmentPositions: InvestmentPosition[],
  cards: Card[],
  today: Date = new Date(),
): BalanceProjection {
  const fixedIncome = findFixedAmount(transactions, "entrada", today);
  const fixedExpense = findFixedAmount(transactions, "saida", today);

  const variableMonths: number[] = [];
  for (let i = 1; i <= PROJECTION_HISTORY_MONTHS; i++) {
    const month = monthStr(shiftMonth(today, -i));
    variableMonths.push(
      monthTotal(transactions, month, "saida", { excludeRecurringAndInstallments: true }),
    );
  }
  const avgVariableExpense =
    variableMonths.reduce((sum, v) => sum + v, 0) / Math.max(1, variableMonths.length);

  const positionsInPrimary = investmentPositions.filter((p) => p.currency === PRIMARY_CURRENCY);
  let avgMonthlyContribution = 0;
  if (positionsInPrimary.length > 0) {
    const earliestDate = positionsInPrimary.reduce(
      (min, p) => (p.date < min ? p.date : min),
      positionsInPrimary[0].date,
    );
    const [startYear, startMonth] = earliestDate.split("-").map(Number);
    const monthsSinceFirst =
      (today.getFullYear() - startYear) * 12 + (today.getMonth() + 1 - startMonth) + 1;
    const totalContributed = positionsInPrimary.reduce((sum, p) => sum + p.amount, 0);
    avgMonthlyContribution = totalContributed / Math.max(1, monthsSinceFirst);
  }

  const upcomingInstallments = buildUpcomingInstallments(transactions, cards, today);
  const installmentsByMonth = new Map(
    upcomingInstallments.map((m) => [m.month, m.totalAmount]),
  );

  const balanceHistory = buildBalanceTimeline(transactions, PRIMARY_CURRENCY, today);
  const startingBalance = balanceHistory.at(-1)?.value ?? 0;

  const points: BalanceProjectionPoint[] = [];
  let balance = startingBalance;
  for (let i = 1; i <= PROJECTION_MONTHS_AHEAD; i++) {
    const monthDate = shiftMonth(today, i);
    const month = monthStr(monthDate);
    const installmentAmount = installmentsByMonth.get(month) ?? 0;

    balance =
      balance +
      fixedIncome -
      fixedExpense -
      avgVariableExpense -
      avgMonthlyContribution -
      installmentAmount;

    points.push({ month, label: formatMonthLabel(month), value: balance });
  }

  return {
    assumptions: { fixedIncome, fixedExpense, avgVariableExpense, avgMonthlyContribution },
    startingBalance,
    points,
  };
}

// ---------- histórico de faturas de um cartão (visão anual) ----------

export interface CardInvoiceBar {
  month: string;
  label: string;
  total: number;
  status: "paid" | "current" | "future";
  selected: boolean;
}

export function buildCardInvoiceHistory(
  transactions: Transaction[],
  paymentMethodId: string,
  selectedMonth: string,
  today: Date = new Date(),
  monthsBack = 3,
  monthsAhead = 4,
): CardInvoiceBar[] {
  const [selectedYear, selectedMonthNum] = selectedMonth.split("-").map(Number);
  const anchor = new Date(selectedYear, selectedMonthNum - 1, 1);
  const currentMonthStr = monthStr(today);

  const bars: CardInvoiceBar[] = [];
  for (let i = -monthsBack; i <= monthsAhead; i++) {
    const d = shiftMonth(anchor, i);
    const month = monthStr(d);
    const total = transactions
      .filter(
        (tx) =>
          tx.paymentMethodId === paymentMethodId &&
          tx.type === "saida" &&
          tx.currency === PRIMARY_CURRENCY &&
          tx.date.startsWith(month),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    bars.push({
      month,
      label: `${MONTH_ABBR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      total,
      status: month < currentMonthStr ? "paid" : month === currentMonthStr ? "current" : "future",
      selected: month === selectedMonth,
    });
  }

  return bars;
}

// ---------- ritmo de gastos (meta geral) ----------

export interface DailyPaceInsight {
  spend: number;
  limit: number;
  percent: number;
  daysRemaining: number;
  dailyAllowance: number;
  overPace: boolean;
  avgDailySpend: number;
  paceWarning: boolean;
}

export function findGeneralBudgetGoal(budgetGoals: BudgetGoal[]): BudgetGoal | undefined {
  return budgetGoals.find((g) => !g.categoryId && !g.paymentMethodId);
}

export function buildDailyPaceInsight(
  transactions: Transaction[],
  generalGoal: BudgetGoal,
  today: Date = new Date(),
): DailyPaceInsight {
  const currentMonthStr = monthStr(today);
  const spend = transactions
    .filter(
      (tx) =>
        tx.type === "saida" &&
        tx.currency === PRIMARY_CURRENCY &&
        tx.date.startsWith(currentMonthStr),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const daysElapsed = Math.max(1, today.getDate());
  const remaining = generalGoal.monthlyLimit - spend;
  const overPace = remaining < 0;
  const avgDailySpend = spend / daysElapsed;
  const dailyAllowance = remaining > 0 ? remaining / daysRemaining : 0;

  return {
    spend,
    limit: generalGoal.monthlyLimit,
    percent: generalGoal.monthlyLimit > 0 ? (spend / generalGoal.monthlyLimit) * 100 : 0,
    daysRemaining,
    dailyAllowance,
    overPace,
    avgDailySpend,
    paceWarning: !overPace && avgDailySpend > dailyAllowance,
  };
}
