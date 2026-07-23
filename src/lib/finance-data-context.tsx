"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useProfile } from "@/lib/profile-context";
import { createClient } from "@/lib/supabase/client";
import type { GenericPaymentMethod } from "@/lib/payment-methods";
import type {
  BudgetGoal,
  Card,
  CardType,
  Category,
  Currency,
  InvestmentReturn,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types";

interface DeleteCategoryResult {
  success: boolean;
  reason?: string;
}

const GENERIC_KIND_ICONS: Record<string, string> = {
  dinheiro: "💵",
  pix: "⚡",
  debito: "💳",
  boleto: "🧾",
};

interface PaymentMethodRow {
  id: string;
  kind: string;
  name: string;
  bank: string | null;
  card_type: CardType | null;
  closing_day: number | null;
  due_day: number | null;
  credit_limit: number | null;
  color: string | null;
  miles_ratio_amount: number | null;
  miles_ratio_miles: number | null;
}

function rowToCard(row: PaymentMethodRow): Card {
  return {
    id: row.id,
    name: row.name,
    bank: row.bank ?? "",
    type: row.card_type ?? "debito",
    closingDay: row.closing_day,
    dueDay: row.due_day,
    creditLimit: row.credit_limit,
    color: row.color ?? "#64748b",
    milesRatioAmount: row.miles_ratio_amount,
    milesRatioMiles: row.miles_ratio_miles,
  };
}

function rowToGenericMethod(row: PaymentMethodRow): GenericPaymentMethod {
  return {
    id: row.id,
    name: row.name,
    icon: GENERIC_KIND_ICONS[row.kind] ?? "💳",
  };
}

interface TransactionRow {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  status: TransactionStatus;
  type: TransactionType;
  payment_method_id: string | null;
  category_id: string | null;
  recurring: boolean;
  note: string | null;
  installment_group_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.date,
    status: row.status,
    type: row.type,
    paymentMethodId: row.payment_method_id,
    categoryId: row.category_id,
    recurring: row.recurring,
    note: row.note ?? "",
    installmentGroupId: row.installment_group_id,
    installmentNumber: row.installment_number,
    totalInstallments: row.total_installments,
  };
}

interface InvestmentReturnRow {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  note: string | null;
}

function rowToInvestmentReturn(row: InvestmentReturnRow): InvestmentReturn {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note ?? "",
  };
}

interface BudgetGoalRow {
  id: string;
  category_id: string | null;
  payment_method_id: string | null;
  monthly_limit: number;
}

function rowToBudgetGoal(row: BudgetGoalRow): BudgetGoal {
  return {
    id: row.id,
    categoryId: row.category_id,
    paymentMethodId: row.payment_method_id,
    monthlyLimit: Number(row.monthly_limit),
  };
}

interface FinanceDataContextValue {
  transactions: Transaction[];
  cards: Card[];
  categories: Category[];
  genericPaymentMethods: GenericPaymentMethod[];
  investmentReturns: InvestmentReturn[];
  addTransactions: (transactions: Transaction[]) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Omit<Transaction, "id">>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  addCard: (card: Card) => Promise<void>;
  updateCard: (id: string, updates: Partial<Omit<Card, "id">>) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (
    id: string,
    updates: Partial<Omit<Category, "id">>,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<DeleteCategoryResult>;
  addInvestmentReturn: (entry: InvestmentReturn) => Promise<void>;
  updateInvestmentReturn: (
    id: string,
    updates: Partial<Omit<InvestmentReturn, "id">>,
  ) => Promise<void>;
  deleteInvestmentReturn: (id: string) => Promise<void>;
  budgetGoals: BudgetGoal[];
  addBudgetGoal: (goal: BudgetGoal) => Promise<void>;
  updateBudgetGoal: (
    id: string,
    updates: Partial<Omit<BudgetGoal, "id">>,
  ) => Promise<void>;
  deleteBudgetGoal: (id: string) => Promise<void>;
}

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { activeProfileId } = useProfile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [genericPaymentMethods, setGenericPaymentMethods] = useState<
    GenericPaymentMethod[]
  >([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investmentReturns, setInvestmentReturns] = useState<InvestmentReturn[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);

  useEffect(() => {
    let active = true;

    async function loadProfileData() {
      if (!activeProfileId) return;
      const supabase = createClient();

      const [categoriesRes, paymentMethodsRes, transactionsRes, investmentReturnsRes, budgetGoalsRes] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id, name, icon, parent_id")
            .eq("profile_id", activeProfileId)
            .order("created_at", { ascending: true }),
          supabase
            .from("payment_methods")
            .select(
              "id, kind, name, bank, card_type, closing_day, due_day, credit_limit, color, miles_ratio_amount, miles_ratio_miles",
            )
            .eq("profile_id", activeProfileId)
            .order("created_at", { ascending: true }),
          supabase
            .from("transactions")
            .select(
              "id, description, amount, currency, date, status, type, payment_method_id, category_id, recurring, note, installment_group_id, installment_number, total_installments",
            )
            .eq("profile_id", activeProfileId)
            .order("date", { ascending: false }),
          supabase
            .from("investment_returns")
            .select("id, date, amount, currency, note")
            .eq("profile_id", activeProfileId)
            .order("date", { ascending: false }),
          supabase
            .from("budget_goals")
            .select("id, category_id, payment_method_id, monthly_limit")
            .eq("profile_id", activeProfileId)
            .order("created_at", { ascending: true }),
        ]);

      if (!active) return;

      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(
          categoriesRes.data.map((row) => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            parentId: row.parent_id,
          })),
        );
      }

      if (!paymentMethodsRes.error && paymentMethodsRes.data) {
        const rows = paymentMethodsRes.data as PaymentMethodRow[];
        setCards(rows.filter((r) => r.kind === "cartao").map(rowToCard));
        setGenericPaymentMethods(
          rows.filter((r) => r.kind !== "cartao").map(rowToGenericMethod),
        );
      }

      if (!transactionsRes.error && transactionsRes.data) {
        setTransactions(
          (transactionsRes.data as TransactionRow[]).map(rowToTransaction),
        );
      }

      if (!investmentReturnsRes.error && investmentReturnsRes.data) {
        setInvestmentReturns(
          (investmentReturnsRes.data as InvestmentReturnRow[]).map(
            rowToInvestmentReturn,
          ),
        );
      }

      if (!budgetGoalsRes.error && budgetGoalsRes.data) {
        setBudgetGoals(
          (budgetGoalsRes.data as BudgetGoalRow[]).map(rowToBudgetGoal),
        );
      }
    }

    loadProfileData();
    return () => {
      active = false;
    };
  }, [activeProfileId]);

  async function addTransactions(newTransactions: Transaction[]) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .insert(
        newTransactions.map((tx) => ({
          profile_id: activeProfileId,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency,
          date: tx.date,
          status: tx.status,
          type: tx.type,
          payment_method_id: tx.paymentMethodId,
          category_id: tx.categoryId,
          recurring: tx.recurring,
          note: tx.note || null,
          installment_group_id: tx.installmentGroupId,
          installment_number: tx.installmentNumber,
          total_installments: tx.totalInstallments,
        })),
      )
      .select(
        "id, description, amount, currency, date, status, type, payment_method_id, category_id, recurring, note, installment_group_id, installment_number, total_installments",
      );

    if (!error && data) {
      const inserted = (data as TransactionRow[]).map(rowToTransaction);
      setTransactions((prev) =>
        [...inserted, ...prev].sort((a, b) => b.date.localeCompare(a.date)),
      );
    }
  }

  async function updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, "id">>,
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update({
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.currency !== undefined && { currency: updates.currency }),
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.paymentMethodId !== undefined && {
          payment_method_id: updates.paymentMethodId,
        }),
        ...(updates.categoryId !== undefined && { category_id: updates.categoryId }),
        ...(updates.recurring !== undefined && { recurring: updates.recurring }),
        ...(updates.note !== undefined && { note: updates.note || null }),
      })
      .eq("id", id);

    if (!error) {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
      );
    }
  }

  async function deleteTransaction(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }
  }

  async function deleteTransactions(ids: string[]) {
    if (ids.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().in("id", ids);
    if (!error) {
      const idSet = new Set(ids);
      setTransactions((prev) => prev.filter((tx) => !idSet.has(tx.id)));
    }
  }

  async function addCard(card: Card) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payment_methods")
      .insert({
        profile_id: activeProfileId,
        kind: "cartao",
        name: card.name,
        bank: card.bank,
        card_type: card.type,
        closing_day: card.closingDay,
        due_day: card.dueDay,
        credit_limit: card.creditLimit,
        color: card.color,
        miles_ratio_amount: card.milesRatioAmount,
        miles_ratio_miles: card.milesRatioMiles,
      })
      .select(
        "id, kind, name, bank, card_type, closing_day, due_day, credit_limit, color",
      )
      .single();

    if (!error && data) {
      setCards((prev) => [...prev, rowToCard(data as PaymentMethodRow)]);
    }
  }

  async function updateCard(id: string, updates: Partial<Omit<Card, "id">>) {
    const supabase = createClient();
    const { error } = await supabase
      .from("payment_methods")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.bank !== undefined && { bank: updates.bank }),
        ...(updates.type !== undefined && { card_type: updates.type }),
        ...(updates.closingDay !== undefined && { closing_day: updates.closingDay }),
        ...(updates.dueDay !== undefined && { due_day: updates.dueDay }),
        ...(updates.creditLimit !== undefined && { credit_limit: updates.creditLimit }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.milesRatioAmount !== undefined && {
          miles_ratio_amount: updates.milesRatioAmount,
        }),
        ...(updates.milesRatioMiles !== undefined && {
          miles_ratio_miles: updates.milesRatioMiles,
        }),
      })
      .eq("id", id);

    if (!error) {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    }
  }

  async function addCategory(category: Category) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        profile_id: activeProfileId,
        name: category.name,
        icon: category.icon,
        parent_id: category.parentId,
      })
      .select("id, name, icon, parent_id")
      .single();

    if (!error && data) {
      setCategories((prev) => [
        ...prev,
        { id: data.id, name: data.name, icon: data.icon, parentId: data.parent_id },
      ]);
    }
  }

  async function updateCategory(
    id: string,
    updates: Partial<Omit<Category, "id">>,
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.parentId !== undefined && { parent_id: updates.parentId }),
      })
      .eq("id", id);

    if (!error) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    }
  }

  async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      return {
        success: false,
        reason:
          "Esta categoria possui subcategorias vinculadas. Remova ou mova as subcategorias primeiro.",
      };
    }

    const inUse = transactions.some((tx) => tx.categoryId === id);
    if (inUse) {
      return {
        success: false,
        reason:
          "Esta categoria está sendo usada em transações. Reatribua essas transações antes de excluí-la.",
      };
    }

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      return { success: false, reason: "Não foi possível excluir a categoria." };
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  }

  async function addInvestmentReturn(entry: InvestmentReturn) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("investment_returns")
      .insert({
        profile_id: activeProfileId,
        date: entry.date,
        amount: entry.amount,
        currency: entry.currency,
        note: entry.note || null,
      })
      .select("id, date, amount, currency, note")
      .single();

    if (!error && data) {
      setInvestmentReturns((prev) => [
        rowToInvestmentReturn(data as InvestmentReturnRow),
        ...prev,
      ]);
    }
  }

  async function updateInvestmentReturn(
    id: string,
    updates: Partial<Omit<InvestmentReturn, "id">>,
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_returns")
      .update({
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.currency !== undefined && { currency: updates.currency }),
        ...(updates.note !== undefined && { note: updates.note || null }),
      })
      .eq("id", id);

    if (!error) {
      setInvestmentReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    }
  }

  async function deleteInvestmentReturn(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_returns")
      .delete()
      .eq("id", id);
    if (!error) {
      setInvestmentReturns((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function addBudgetGoal(goal: BudgetGoal) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("budget_goals")
      .insert({
        profile_id: activeProfileId,
        category_id: goal.categoryId,
        payment_method_id: goal.paymentMethodId,
        monthly_limit: goal.monthlyLimit,
      })
      .select("id, category_id, payment_method_id, monthly_limit")
      .single();

    if (!error && data) {
      setBudgetGoals((prev) => [...prev, rowToBudgetGoal(data as BudgetGoalRow)]);
    }
  }

  async function updateBudgetGoal(
    id: string,
    updates: Partial<Omit<BudgetGoal, "id">>,
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("budget_goals")
      .update({
        ...(updates.categoryId !== undefined && { category_id: updates.categoryId }),
        ...(updates.paymentMethodId !== undefined && {
          payment_method_id: updates.paymentMethodId,
        }),
        ...(updates.monthlyLimit !== undefined && {
          monthly_limit: updates.monthlyLimit,
        }),
      })
      .eq("id", id);

    if (!error) {
      setBudgetGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );
    }
  }

  async function deleteBudgetGoal(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("budget_goals").delete().eq("id", id);
    if (!error) {
      setBudgetGoals((prev) => prev.filter((g) => g.id !== id));
    }
  }

  return (
    <FinanceDataContext.Provider
      value={{
        transactions,
        cards,
        categories,
        genericPaymentMethods,
        investmentReturns,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        addCard,
        updateCard,
        addCategory,
        updateCategory,
        deleteCategory,
        addInvestmentReturn,
        updateInvestmentReturn,
        deleteInvestmentReturn,
        budgetGoals,
        addBudgetGoal,
        updateBudgetGoal,
        deleteBudgetGoal,
      }}
    >
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceData() {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) {
    throw new Error("useFinanceData deve ser usado dentro de FinanceDataProvider");
  }
  return ctx;
}
