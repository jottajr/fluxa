"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GoalFormModal, type GoalFormPayload } from "@/components/GoalFormModal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import type { FinancialGoalContribution } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyContributionForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    note: "",
  };
}

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    financialGoals,
    financialGoalContributions,
    updateFinancialGoal,
    deleteFinancialGoal,
    addFinancialGoalContribution,
    updateFinancialGoalContribution,
    deleteFinancialGoalContribution,
    deleteFinancialGoalContributions,
  } = useFinanceData();

  const goal = financialGoals.find((g) => g.id === params.id);

  const contributions = useMemo(
    () =>
      financialGoalContributions
        .filter((c) => c.goalId === params.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [financialGoalContributions, params.id],
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(
    null,
  );
  const [contributionForm, setContributionForm] = useState(emptyContributionForm());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState(false);
  const [confirmState, setConfirmState] = useState<
    | { type: "single"; id: string; label: string }
    | { type: "bulk"; ids: string[] }
    | null
  >(null);

  if (!goal) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/metas"
          className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
        >
          ← Voltar para metas
        </Link>
        <p className="text-sm text-[var(--text-tertiary)]">Meta não encontrada.</p>
      </div>
    );
  }

  const current = contributions.reduce((sum, c) => sum + c.amount, 0);
  const percent =
    goal.targetAmount > 0 ? Math.min(100, (current / goal.targetAmount) * 100) : 0;
  const remaining = Math.max(0, goal.targetAmount - current);

  async function handleGoalSubmit(payload: GoalFormPayload) {
    if (!goal) return;
    await updateFinancialGoal(goal.id, payload);
    setShowEditModal(false);
  }

  async function confirmGoalDeletion() {
    if (!goal) return;
    await deleteFinancialGoal(goal.id);
  }

  function openNewContributionModal() {
    setContributionForm(emptyContributionForm());
    setEditingContributionId(null);
    setShowContributionModal(true);
  }

  function closeContributionModal() {
    setContributionForm(emptyContributionForm());
    setEditingContributionId(null);
    setShowContributionModal(false);
  }

  function startEditContribution(entry: FinancialGoalContribution) {
    setContributionForm({
      date: entry.date,
      amount: String(entry.amount),
      note: entry.note,
    });
    setEditingContributionId(entry.id);
    setShowContributionModal(true);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === contributions.length
        ? new Set()
        : new Set(contributions.map((c) => c.id)),
    );
  }

  function requestDeleteContribution(entry: FinancialGoalContribution) {
    setConfirmState({
      type: "single",
      id: entry.id,
      label: entry.note || formatCurrency(entry.amount, goal!.currency),
    });
  }

  function requestBulkDelete() {
    if (selectedIds.size === 0) return;
    setConfirmState({ type: "bulk", ids: Array.from(selectedIds) });
  }

  async function confirmContributionDeletion() {
    if (!confirmState) return;
    if (confirmState.type === "single") {
      await deleteFinancialGoalContribution(confirmState.id);
      if (editingContributionId === confirmState.id) closeContributionModal();
      setSelectedIds((prev) => {
        if (!prev.has(confirmState.id)) return prev;
        const next = new Set(prev);
        next.delete(confirmState.id);
        return next;
      });
    } else {
      await deleteFinancialGoalContributions(confirmState.ids);
      setSelectedIds(new Set());
    }
    setConfirmState(null);
  }

  async function handleSubmitContribution(event: React.FormEvent) {
    event.preventDefault();
    if (!contributionForm.amount || !goal) return;

    if (editingContributionId) {
      await updateFinancialGoalContribution(editingContributionId, {
        date: contributionForm.date,
        amount: Number(contributionForm.amount),
        note: contributionForm.note,
      });
    } else {
      await addFinancialGoalContribution({
        id: "",
        goalId: goal.id,
        date: contributionForm.date,
        amount: Number(contributionForm.amount),
        note: contributionForm.note,
      });
    }
    closeContributionModal();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        href="/metas"
        className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
      >
        ← Voltar para metas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-2 text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            <span>{goal.icon}</span>
            {goal.name}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            {goal.targetDate ? `Prazo: ${formatDate(goal.targetDate)}` : "Sem prazo definido"}
          </p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          aria-label="Editar meta"
          className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>

      <GoalFormModal
        open={showEditModal}
        goal={goal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleGoalSubmit}
        onDelete={() => setDeleteGoalConfirm(true)}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard
          label="Valor atual"
          value={formatCurrency(current, goal.currency)}
          color="var(--chart-positive)"
          variation={null}
        />
        <KpiCard
          label="Valor-alvo"
          value={formatCurrency(goal.targetAmount, goal.currency)}
          color="var(--foreground)"
          variation={null}
        />
        <KpiCard
          label="Falta guardar"
          value={formatCurrency(remaining, goal.currency)}
          color="var(--foreground)"
          variation={null}
        />
      </div>

      <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-display font-bold text-[var(--foreground)]">
            {Math.round(percent)}% concluído
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--background)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${Math.max(0, percent)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
            Aportes
          </h2>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={requestBulkDelete}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir selecionados ({selectedIds.size})
              </button>
            )}
            <button
              onClick={openNewContributionModal}
              className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
            >
              + Novo aporte
            </button>
          </div>
        </div>

        <Modal
          open={showContributionModal}
          onClose={closeContributionModal}
          title={editingContributionId ? "Editar aporte" : "Novo aporte"}
        >
          <form
            onSubmit={handleSubmitContribution}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>Valor</label>
              <input
                type="number"
                step="0.01"
                required
                value={contributionForm.amount}
                onChange={(e) =>
                  setContributionForm((f) => ({ ...f, amount: e.target.value }))
                }
                className={inputClass}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input
                type="date"
                required
                value={contributionForm.date}
                onChange={(e) =>
                  setContributionForm((f) => ({ ...f, date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Observação</label>
              <input
                type="text"
                value={contributionForm.note}
                onChange={(e) =>
                  setContributionForm((f) => ({ ...f, note: e.target.value }))
                }
                className={inputClass}
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-center justify-between gap-2 sm:col-span-2">
              <button
                type="submit"
                className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
              >
                {editingContributionId ? "Salvar alterações" : "Salvar aporte"}
              </button>
              {editingContributionId && (
                <button
                  type="button"
                  onClick={() => {
                    const entry = contributions.find(
                      (c) => c.id === editingContributionId,
                    );
                    if (entry) requestDeleteContribution(entry);
                  }}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Excluir
                </button>
              )}
            </div>
          </form>
        </Modal>

        <div className="overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]">
          <div className="grid grid-cols-[28px_100px_1.6fr_1fr_60px] items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            <input
              type="checkbox"
              checked={contributions.length > 0 && selectedIds.size === contributions.length}
              onChange={toggleSelectAll}
              aria-label="Selecionar todos os aportes"
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            <div>Data</div>
            <div>Observação</div>
            <div className="text-right">Valor</div>
            <div />
          </div>

          {contributions.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[28px_100px_1.6fr_1fr_60px] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(entry.id)}
                onChange={() => toggleSelected(entry.id)}
                aria-label="Selecionar aporte"
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
              />
              <div className="text-[12.5px] font-medium text-[var(--text-tertiary)]">
                {formatDate(entry.date)}
              </div>
              <div className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                {entry.note || "—"}
              </div>
              <div
                className="font-display text-right text-[13.5px] font-bold tracking-tight tabular-nums"
                style={{ color: "var(--chart-positive)" }}
              >
                +{formatCurrency(entry.amount, goal.currency)}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => startEditContribution(entry)}
                  aria-label="Editar aporte"
                  className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => requestDeleteContribution(entry)}
                  aria-label="Excluir aporte"
                  className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {contributions.length === 0 && (
            <EmptyState message="Nenhum aporte lançado ainda." />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.type === "bulk" ? "Excluir aportes selecionados" : "Excluir aporte"}
        message={
          confirmState?.type === "bulk"
            ? `Tem certeza que deseja excluir ${confirmState.ids.length} ${confirmState.ids.length === 1 ? "aporte selecionado" : "aportes selecionados"}? Essa ação não pode ser desfeita.`
            : confirmState?.type === "single"
              ? `Excluir o aporte "${confirmState.label}"? Essa ação não pode ser desfeita.`
              : ""
        }
        onConfirm={confirmContributionDeletion}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmDialog
        open={deleteGoalConfirm}
        title="Excluir meta"
        message={`Excluir a meta "${goal.name}"? Os aportes lançados nela também serão excluídos. Essa ação não pode ser desfeita.`}
        onConfirm={confirmGoalDeletion}
        onCancel={() => setDeleteGoalConfirm(false)}
      />
    </div>
  );
}
