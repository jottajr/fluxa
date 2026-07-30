"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GoalFormModal, type GoalFormPayload } from "@/components/GoalFormModal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EmptyState } from "@/components/EmptyState";
import type { FinancialGoal } from "@/types";

export default function MetasPage() {
  const {
    financialGoals,
    financialGoalContributions,
    addFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
  } = useFinanceData();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null);

  const currentByGoal = useMemo(() => {
    const totals = new Map<string, number>();
    financialGoalContributions.forEach((c) => {
      totals.set(c.goalId, (totals.get(c.goalId) ?? 0) + c.amount);
    });
    return totals;
  }, [financialGoalContributions]);

  function openNewModal() {
    setEditingGoal(null);
    setShowModal(true);
  }

  function startEdit(goal: FinancialGoal) {
    setEditingGoal(goal);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingGoal(null);
  }

  function requestDelete(goal: FinancialGoal) {
    setDeleteTarget(goal);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteFinancialGoal(deleteTarget.id);
    setDeleteTarget(null);
    closeModal();
  }

  async function handleSubmit(payload: GoalFormPayload) {
    if (editingGoal) {
      await updateFinancialGoal(editingGoal.id, payload);
    } else {
      await addFinancialGoal({ id: "", ...payload });
    }
    closeModal();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            Metas
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            Objetivos financeiros em andamento
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
        >
          + Nova meta
        </button>
      </div>

      <GoalFormModal
        open={showModal}
        goal={editingGoal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={editingGoal ? () => requestDelete(editingGoal) : undefined}
      />

      {financialGoals.length === 0 ? (
        <EmptyState
          message="Nenhuma meta cadastrada ainda."
          actionLabel="Nova meta"
          onAction={openNewModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {financialGoals.map((goal) => {
            const current = currentByGoal.get(goal.id) ?? 0;
            const percent =
              goal.targetAmount > 0
                ? Math.min(100, (current / goal.targetAmount) * 100)
                : 0;
            return (
              <div
                key={goal.id}
                onClick={() => router.push(`/metas/${goal.id}`)}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-[22px] transition-colors hover:border-[var(--accent)]/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{goal.icon}</span>
                    <h2 className="font-display text-[15px] font-bold text-[var(--foreground)]">
                      {goal.name}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {goal.targetDate && (
                      <span className="text-xs font-semibold text-[var(--text-tertiary)]">
                        até {formatDate(goal.targetDate)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(goal);
                      }}
                      aria-label="Editar meta"
                      className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDelete(goal);
                      }}
                      aria-label="Excluir meta"
                      className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="font-display mt-3.5 text-2xl font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
                  {formatCurrency(current, goal.currency)}
                  <span className="text-sm font-semibold text-[var(--text-tertiary)]">
                    {" "}
                    / {formatCurrency(goal.targetAmount, goal.currency)}
                  </span>
                </p>

                <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-[var(--background)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(0, percent)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
                  {Math.round(percent)}% concluído
                </p>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir meta"
        message={
          deleteTarget
            ? `Excluir a meta "${deleteTarget.name}"? Os aportes lançados nela também serão excluídos. Essa ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
