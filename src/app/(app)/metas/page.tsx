"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency } from "@/lib/format";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { Modal } from "@/components/Modal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import type { BudgetGoal } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

type TargetType = "categoria" | "cartao";

function emptyForm() {
  return {
    targetType: "categoria" as TargetType,
    targetId: "",
    monthlyLimit: "",
  };
}

export default function MetasPage() {
  const {
    categories,
    cards,
    transactions,
    budgetGoals,
    addBudgetGoal,
    updateBudgetGoal,
    deleteBudgetGoal,
  } = useFinanceData();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthSpendByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.date.startsWith(currentMonth) &&
          tx.currency === PRIMARY_CURRENCY,
      )
      .forEach((tx) => {
        if (!tx.categoryId) return;
        totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
      });
    return totals;
  }, [transactions, currentMonth]);

  const monthSpendByPaymentMethod = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.type === "saida" &&
          tx.date.startsWith(currentMonth) &&
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
  }, [transactions, currentMonth]);

  function goalLabel(goal: BudgetGoal) {
    if (goal.categoryId) {
      const category = categories.find((c) => c.id === goal.categoryId);
      return category ? `${category.icon} ${category.name}` : "Categoria removida";
    }
    return getPaymentMethodLabel(goal.paymentMethodId, cards);
  }

  function goalSpend(goal: BudgetGoal) {
    if (goal.categoryId) {
      return monthSpendByCategory.get(goal.categoryId) ?? 0;
    }
    if (goal.paymentMethodId) {
      return monthSpendByPaymentMethod.get(goal.paymentMethodId) ?? 0;
    }
    return 0;
  }

  function openNewModal() {
    setForm(emptyForm());
    setEditingId(null);
    setShowModal(true);
  }

  function closeModal() {
    setForm(emptyForm());
    setEditingId(null);
    setShowModal(false);
  }

  function startEdit(goal: BudgetGoal) {
    setForm({
      targetType: goal.categoryId ? "categoria" : "cartao",
      targetId: goal.categoryId ?? goal.paymentMethodId ?? "",
      monthlyLimit: String(goal.monthlyLimit),
    });
    setEditingId(goal.id);
    setShowModal(true);
  }

  async function handleDelete(id: string, label: string) {
    if (window.confirm(`Excluir a meta de "${label}"?`)) {
      await deleteBudgetGoal(id);
      closeModal();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.targetId || !form.monthlyLimit) return;

    const values = {
      categoryId: form.targetType === "categoria" ? form.targetId : null,
      paymentMethodId: form.targetType === "cartao" ? form.targetId : null,
      monthlyLimit: Number(form.monthlyLimit),
    };

    if (editingId) {
      await updateBudgetGoal(editingId, values);
    } else {
      await addBudgetGoal({ id: `goal-${crypto.randomUUID()}`, ...values });
    }

    closeModal();
  }

  const editingGoal = editingId
    ? budgetGoals.find((g) => g.id === editingId)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Metas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Defina um limite mensal de gasto por categoria ou por cartão.
          </p>
        </div>
        <button onClick={openNewModal} className="btn-primary rounded-md px-4 py-2 text-sm font-medium">
          + Nova meta
        </button>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? "Editar meta" : "Nova meta"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Aplicar meta em</label>
            <select
              value={form.targetType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targetType: e.target.value as TargetType,
                  targetId: "",
                }))
              }
              className={inputClass}
            >
              <option value="categoria">Categoria</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              {form.targetType === "categoria" ? "Categoria" : "Cartão"}
            </label>
            <select
              required
              value={form.targetId}
              onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              {form.targetType === "categoria"
                ? categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))
                : cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Limite mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              required
              value={form.monthlyLimit}
              onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
              className={inputClass}
              placeholder="0,00"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm font-medium">
              {editingId ? "Salvar alterações" : "Salvar meta"}
            </button>
            {editingId && editingGoal && (
              <button
                type="button"
                onClick={() => handleDelete(editingId, goalLabel(editingGoal))}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir meta
              </button>
            )}
          </div>
        </form>
      </Modal>

      <div className="tech-card space-y-5 rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 dark:border-slate-800 dark:bg-slate-900">
        {budgetGoals.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Nenhuma meta cadastrada ainda.
          </p>
        )}
        {budgetGoals.map((goal) => {
          const spend = goalSpend(goal);
          const percent = goal.monthlyLimit > 0 ? (spend / goal.monthlyLimit) * 100 : 0;
          const overBudget = spend > goal.monthlyLimit;
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(goal)}
                    aria-label="Editar meta"
                    className="text-slate-300 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {goalLabel(goal)}
                  </span>
                </div>
                <span
                  className={`text-sm ${
                    overBudget
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {formatCurrency(spend)} / {formatCurrency(goal.monthlyLimit)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    overBudget ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
