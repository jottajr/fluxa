"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { EmojiPicker } from "@/components/EmojiPicker";
import { CURRENCY_OPTIONS, PRIMARY_CURRENCY } from "@/lib/currency";
import type { Currency, FinancialGoal } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyForm() {
  return {
    name: "",
    icon: "🎯",
    targetAmount: "",
    targetDate: "",
    currency: PRIMARY_CURRENCY,
    note: "",
  };
}

export interface GoalFormPayload {
  name: string;
  icon: string;
  targetAmount: number;
  targetDate: string | null;
  currency: Currency;
  note: string;
}

export function GoalFormModal({
  open,
  goal,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  goal: FinancialGoal | null;
  onClose: () => void;
  onSubmit: (payload: GoalFormPayload) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (!open) return;
    setForm(
      goal
        ? {
            name: goal.name,
            icon: goal.icon,
            targetAmount: String(goal.targetAmount),
            targetDate: goal.targetDate ?? "",
            currency: goal.currency,
            note: goal.note,
          }
        : emptyForm(),
    );
  }, [open, goal]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name || !form.targetAmount) return;
    onSubmit({
      name: form.name,
      icon: form.icon || "🎯",
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate || null,
      currency: form.currency,
      note: form.note,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? "Editar meta" : "Nova meta"}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="Ex: Reserva de emergência"
          />
        </div>

        <div>
          <label className={labelClass}>Ícone</label>
          <EmojiPicker
            value={form.icon}
            onChange={(icon) => setForm((f) => ({ ...f, icon }))}
          />
        </div>

        <div>
          <label className={labelClass}>Valor-alvo</label>
          <input
            type="number"
            step="0.01"
            min={0}
            required
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            className={inputClass}
            placeholder="0,00"
          />
        </div>

        <div>
          <label className={labelClass}>Moeda</label>
          <select
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value as Currency }))
            }
            className={inputClass}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Prazo (opcional)</label>
          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Observação</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>

        <div className="flex items-center justify-between gap-2 sm:col-span-2">
          <button
            type="submit"
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            {goal ? "Salvar alterações" : "Salvar meta"}
          </button>
          {goal && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Excluir
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
