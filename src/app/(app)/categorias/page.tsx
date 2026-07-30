"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CATEGORICAL } from "@/lib/chart-colors";
import { PRIMARY_CURRENCY } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import type { BudgetGoal, Category } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyForm() {
  return {
    name: "",
    parentId: "",
    icon: "🏷️",
  };
}

export default function CategoriasPage() {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    budgetGoals,
    addBudgetGoal,
    updateBudgetGoal,
    deleteBudgetGoal,
  } = useFinanceData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [budgetEditingId, setBudgetEditingId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  function childrenOf(parentId: string) {
    return categories.filter((c) => c.parentId === parentId);
  }

  const editingHasChildren = useMemo(
    () => (editingId ? categories.some((c) => c.parentId === editingId) : false),
    [categories, editingId],
  );

  const editingCategory = useMemo(
    () => (editingId ? (categories.find((c) => c.id === editingId) ?? null) : null),
    [categories, editingId],
  );
  const isEditingSubcategory = editingCategory !== null && editingCategory.parentId !== null;

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

  const goalByCategory = useMemo(
    () => new Map(budgetGoals.filter((g) => g.categoryId).map((g) => [g.categoryId as string, g])),
    [budgetGoals],
  );

  function openNewForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(category: Category) {
    setForm({
      name: category.name,
      parentId: category.parentId ?? "",
      icon: category.icon,
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  function requestDelete(category: Category) {
    setDeleteTarget(category);
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget) return;
    const result = await deleteCategory(deleteTarget.id);
    if (!result.success) {
      window.alert(result.reason);
      setDeleteTarget(null);
      return;
    }
    if (editingId === deleteTarget.id) closeForm();
    setDeleteTarget(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name) return;

    if (editingId) {
      await updateCategory(editingId, {
        name: form.name,
        parentId: editingHasChildren ? null : form.parentId || null,
        icon: form.icon || "🏷️",
      });
      closeForm();
      return;
    }

    const newCategory: Category = {
      id: "",
      name: form.name,
      parentId: form.parentId || null,
      icon: form.icon || "🏷️",
    };

    await addCategory(newCategory);
    closeForm();
  }

  function startBudgetEdit(categoryId: string, goal: BudgetGoal | undefined) {
    setBudgetEditingId(categoryId);
    setBudgetDraft(goal ? String(goal.monthlyLimit) : "");
  }

  async function saveBudget(categoryId: string) {
    const value = Number(budgetDraft);
    if (!value || value <= 0) return;

    const existing = goalByCategory.get(categoryId);
    if (existing) {
      await updateBudgetGoal(existing.id, { monthlyLimit: value });
    } else {
      await addBudgetGoal({
        id: `goal-${crypto.randomUUID()}`,
        categoryId,
        paymentMethodId: null,
        monthlyLimit: value,
      });
    }
    setBudgetEditingId(null);
  }

  async function removeBudget(goalId: string) {
    await deleteBudgetGoal(goalId);
    setBudgetEditingId(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            Categorias
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            Organize suas categorias e acompanhe o orçamento do mês
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openNewForm())}
          className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
        >
          {showForm ? "Cancelar" : "+ Nova categoria"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 sm:grid-cols-2"
        >
          {editingId && (
            <div className="sm:col-span-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Editando categoria
              </span>
            </div>
          )}

          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className={inputClass}
              placeholder="Ex: Saúde"
            />
          </div>

          <div>
            <label className={labelClass}>Ícone</label>
            <EmojiPicker
              value={form.icon}
              onChange={(icon) => setForm((f) => ({ ...f, icon }))}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Categoria pai (opcional)</label>
            <select
              value={editingHasChildren ? "" : form.parentId}
              disabled={editingHasChildren}
              onChange={(e) =>
                setForm((f) => ({ ...f, parentId: e.target.value }))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">Nenhuma (categoria principal)</option>
              {parentCategories
                .filter((category) => category.id !== editingId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            {editingHasChildren && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Esta categoria possui subcategorias, por isso continua como
                categoria principal.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
              >
                {editingId ? "Salvar alterações" : "Salvar categoria"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            {isEditingSubcategory && editingCategory && (
              <button
                type="button"
                onClick={() => requestDelete(editingCategory)}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parentCategories.map((category, index) => {
          const goal = goalByCategory.get(category.id);
          const spent = monthSpendByCategory.get(category.id) ?? 0;
          const percent = goal ? Math.min(100, (spent / goal.monthlyLimit) * 100) : 0;
          const overBudget = goal ? spent > goal.monthlyLimit : false;
          const isEditingBudget = budgetEditingId === category.id;

          return (
            <div
              key={category.id}
              className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-base"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${CATEGORICAL[index % CATEGORICAL.length]} 18%, transparent)`,
                    }}
                  >
                    {category.icon}
                  </span>
                  <h2 className="font-display text-[13.5px] font-bold text-[var(--foreground)]">
                    {category.name}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => startEdit(category)}
                    aria-label="Editar categoria"
                    className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => requestDelete(category)}
                    aria-label="Excluir categoria"
                    className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3.5">
                {isEditingBudget ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      autoFocus
                      value={budgetDraft}
                      onChange={(e) => setBudgetDraft(e.target.value)}
                      placeholder="Limite mensal"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      onClick={() => saveBudget(category.id)}
                      className="shrink-0 text-xs font-bold text-[var(--accent)]"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setBudgetEditingId(null)}
                      className="shrink-0 text-xs font-medium text-[var(--text-tertiary)]"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : goal ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p
                        className="font-display text-xl font-extrabold tracking-tight tabular-nums"
                        style={{
                          color: overBudget
                            ? "var(--chart-negative)"
                            : "var(--foreground)",
                        }}
                      >
                        {formatCurrency(spent)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startBudgetEdit(category.id, goal)}
                          aria-label="Editar meta"
                          className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeBudget(goal.id)}
                          aria-label="Remover meta"
                          className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="my-1 text-[11.5px] font-medium text-[var(--text-tertiary)]">
                      de {formatCurrency(goal.monthlyLimit)}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--background)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, percent)}%`,
                          backgroundColor: overBudget
                            ? "var(--chart-negative)"
                            : "var(--chart-positive)",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => startBudgetEdit(category.id, undefined)}
                    className="text-xs font-semibold text-[var(--accent)]"
                  >
                    + Definir meta mensal
                  </button>
                )}
              </div>

              {childrenOf(category.id).length > 0 && (
                <div className="mt-4 space-y-2 border-t border-[var(--background)] pt-3">
                  {childrenOf(category.id).map((child) => (
                    <div key={child.id} className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(child)}
                        aria-label="Editar subcategoria"
                        className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                        {child.icon} {child.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir categoria"
        message={
          deleteTarget ? `Excluir a categoria "${deleteTarget.name}"? Essa ação não pode ser desfeita.` : ""
        }
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
