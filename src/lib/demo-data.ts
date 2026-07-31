import type {
  BudgetGoal,
  Card,
  Category,
  FinancialGoal,
  FinancialGoalContribution,
  InvestmentPosition,
  InvestmentReturn,
  Transaction,
} from "@/types";

export const DEMO_NAME_PREFIX = "[Demo] ";
export const DEMO_NOTE_MARKER = "[dados de exemplo]";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateAt(today: Date, monthOffset: number, day: number): string {
  const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`;
}

function nearDueDay(today: Date, daysAhead: number): number {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const target = today.getDate() + daysAhead;
  return target > daysInMonth ? target - daysInMonth : target;
}

function findCategory(categories: Category[], name: string): Category | undefined {
  return categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

interface DemoDataContext {
  categories: Category[];
  addCard: (card: Card) => Promise<Card | null>;
  addTransactions: (transactions: Transaction[]) => Promise<void>;
  addBudgetGoal: (goal: BudgetGoal) => Promise<void>;
  addFinancialGoal: (goal: FinancialGoal) => Promise<FinancialGoal | null>;
  addFinancialGoalContribution: (
    contribution: FinancialGoalContribution,
  ) => Promise<void>;
  addInvestmentPosition: (position: InvestmentPosition) => Promise<void>;
  addInvestmentReturn: (entry: InvestmentReturn) => Promise<void>;
}

const MONTH_MULTIPLIERS = [0.9, 1.05, 0.85, 1.15, 1, 1.1];

export async function seedDemoData(ctx: DemoDataContext): Promise<void> {
  const today = new Date();
  const monthsBack = MONTH_MULTIPLIERS.length - 1;

  const topCategories = ctx.categories.filter((c) => c.parentId === null);
  const salaryCategory = findCategory(ctx.categories, "Salário");
  const rentCategory = findCategory(ctx.categories, "Moradia");
  const primaryCategory = topCategories[0] ?? null;
  const secondaryCategory = topCategories[1] ?? topCategories[0] ?? null;

  const card = await ctx.addCard({
    id: "",
    name: `${DEMO_NAME_PREFIX}Cartão de Teste`,
    bank: "Banco de Teste",
    type: "credito",
    closingDay: 20,
    dueDay: nearDueDay(today, 2),
    creditLimit: 6000,
    color: "#8A05BE",
    milesRatioAmount: null,
    milesRatioMiles: null,
  });
  if (!card) return;

  const transactions: Transaction[] = [];

  for (let i = 0; i <= monthsBack; i++) {
    const offset = i - monthsBack;
    const multiplier = MONTH_MULTIPLIERS[i];
    const isCurrentMonth = offset === 0;

    function push(
      day: number,
      description: string,
      amount: number,
      type: "entrada" | "saida",
      categoryId: string | null,
      paymentMethodId: string | null,
      opts: { recurring?: boolean; status?: Transaction["status"] } = {},
    ) {
      if (isCurrentMonth && day > today.getDate()) return;
      const rounded = Math.round(amount * multiplier);
      transactions.push({
        id: `tx-${crypto.randomUUID()}`,
        description,
        amount: rounded,
        currency: "BRL",
        date: dateAt(today, offset, day),
        status: opts.status ?? "pago",
        type,
        paymentMethodId,
        categoryId,
        recurring: opts.recurring ?? false,
        note: DEMO_NOTE_MARKER,
        installmentGroupId: null,
        installmentNumber: null,
        totalInstallments: null,
      });
    }

    push(5, "Salário", 8500, "entrada", salaryCategory?.id ?? null, null, {
      recurring: true,
    });
    push(10, "Aluguel", 1800, "saida", rentCategory?.id ?? null, null, {
      recurring: true,
    });
    if (primaryCategory) {
      push(3, "Supermercado", 540, "saida", primaryCategory.id, card.id);
      push(18, "Restaurante", 180, "saida", primaryCategory.id, card.id);
    }
    if (secondaryCategory) {
      push(12, "Transporte", 220, "saida", secondaryCategory.id, card.id);
    }
    if (isCurrentMonth && primaryCategory) {
      push(
        today.getDate(),
        "Gasto extra do mês",
        450,
        "saida",
        primaryCategory.id,
        card.id,
      );
    }
  }

  // compra parcelada (parcelas passadas/atual pagas, futuras agendadas)
  const installmentGroupId = crypto.randomUUID();
  [-1, 0, 1, 2].forEach((offset, index) => {
    transactions.push({
      id: `tx-${crypto.randomUUID()}`,
      description: "Notebook novo",
      amount: 375,
      currency: "BRL",
      date: dateAt(today, offset, 20),
      status: offset <= 0 ? "pago" : "agendado",
      type: "saida",
      paymentMethodId: card.id,
      categoryId: secondaryCategory?.id ?? primaryCategory?.id ?? null,
      recurring: false,
      note: DEMO_NOTE_MARKER,
      installmentGroupId,
      installmentNumber: index + 1,
      totalInstallments: 4,
    });
  });
  // parcela deste mês ainda não paga, pra aparecer como fatura em aberto
  const currentInstallment = transactions.find(
    (tx) => tx.installmentGroupId === installmentGroupId && tx.installmentNumber === 2,
  );
  if (currentInstallment) currentInstallment.status = "pendente";

  await ctx.addTransactions(transactions);

  const currentMonthStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const cardSpendThisMonth = transactions
    .filter(
      (tx) =>
        tx.type === "saida" &&
        tx.paymentMethodId === card.id &&
        tx.date.startsWith(currentMonthStr),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (cardSpendThisMonth > 0) {
    await ctx.addBudgetGoal({
      id: "",
      categoryId: null,
      paymentMethodId: card.id,
      monthlyLimit: Math.max(100, Math.round(cardSpendThisMonth / 0.95)),
    });
  }

  const goal = await ctx.addFinancialGoal({
    id: "",
    name: `${DEMO_NAME_PREFIX}Meta de Exemplo`,
    icon: "🎯",
    targetAmount: 5000,
    targetDate: null,
    currency: "BRL",
    note: DEMO_NOTE_MARKER,
  });
  if (goal) {
    for (let i = 1; i <= 3; i++) {
      await ctx.addFinancialGoalContribution({
        id: "",
        goalId: goal.id,
        date: dateAt(today, -i, 15),
        amount: 500,
        note: DEMO_NOTE_MARKER,
      });
    }
  }

  await ctx.addInvestmentPosition({
    id: "",
    description: "CDB Banco de Teste",
    amount: 3000,
    currency: "BRL",
    date: dateAt(today, -4, 10),
    category: "renda_fixa",
    rateValue: 12,
    rateUnit: "anual",
    maturityDate: null,
    note: DEMO_NOTE_MARKER,
  });
  await ctx.addInvestmentPosition({
    id: "",
    description: "Ações de Teste",
    amount: 1200,
    currency: "BRL",
    date: dateAt(today, -2, 8),
    category: "renda_variavel",
    rateValue: null,
    rateUnit: null,
    maturityDate: null,
    note: DEMO_NOTE_MARKER,
  });
  await ctx.addInvestmentReturn({
    id: "",
    date: dateAt(today, -1, 28),
    amount: 60,
    currency: "BRL",
    note: DEMO_NOTE_MARKER,
  });
}

export function findDemoCards(cards: Card[]): Card[] {
  return cards.filter((c) => c.name.startsWith(DEMO_NAME_PREFIX));
}

interface ClearDemoNonCardDataContext {
  transactions: Transaction[];
  cards: Card[];
  budgetGoals: BudgetGoal[];
  financialGoals: FinancialGoal[];
  investmentPositions: InvestmentPosition[];
  investmentReturns: InvestmentReturn[];
  deleteTransactions: (ids: string[]) => Promise<void>;
  deleteBudgetGoal: (id: string) => Promise<void>;
  deleteFinancialGoal: (id: string) => Promise<void>;
  deleteInvestmentPositions: (ids: string[]) => Promise<void>;
  deleteInvestmentReturns: (ids: string[]) => Promise<void>;
}

/**
 * Apaga tudo que referencia o cartão demo (transações, meta de gastos do
 * cartão) e o restante dos dados de exemplo — exceto o próprio cartão.
 * O cartão precisa ser apagado depois, numa renderização seguinte, porque
 * `deleteCard` valida "está em uso?" contra o estado do contexto capturado
 * no momento em que essa função foi chamada — que ainda inclui as
 * transações que acabamos de apagar aqui. Ver `findDemoCards`.
 */
export async function clearDemoNonCardData(
  ctx: ClearDemoNonCardDataContext,
): Promise<void> {
  const demoCardIds = new Set(findDemoCards(ctx.cards).map((c) => c.id));

  const demoTransactionIds = ctx.transactions
    .filter(
      (tx) =>
        tx.note?.includes(DEMO_NOTE_MARKER) ||
        (tx.paymentMethodId && demoCardIds.has(tx.paymentMethodId)),
    )
    .map((tx) => tx.id);
  if (demoTransactionIds.length > 0) {
    await ctx.deleteTransactions(demoTransactionIds);
  }

  const demoPositionIds = ctx.investmentPositions
    .filter((p) => p.note?.includes(DEMO_NOTE_MARKER))
    .map((p) => p.id);
  if (demoPositionIds.length > 0) await ctx.deleteInvestmentPositions(demoPositionIds);

  const demoReturnIds = ctx.investmentReturns
    .filter((r) => r.note?.includes(DEMO_NOTE_MARKER))
    .map((r) => r.id);
  if (demoReturnIds.length > 0) await ctx.deleteInvestmentReturns(demoReturnIds);

  const demoGoals = ctx.financialGoals.filter((g) => g.name.startsWith(DEMO_NAME_PREFIX));
  for (const goal of demoGoals) {
    await ctx.deleteFinancialGoal(goal.id);
  }

  const demoCardBudgetGoals = ctx.budgetGoals.filter(
    (g) => g.paymentMethodId && demoCardIds.has(g.paymentMethodId),
  );
  for (const goal of demoCardBudgetGoals) {
    await ctx.deleteBudgetGoal(goal.id);
  }
}
