"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { cardTypeLabel } from "@/lib/card-type";
import { CATEGORICAL } from "@/lib/chart-colors";
import type { Card, CardType, Transaction } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function cardInitial(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u);
  return (match?.[0] ?? "?").toUpperCase();
}

function emptyForm() {
  return {
    name: "",
    bank: "",
    type: "credito" as CardType,
    closingDay: "",
    dueDay: "",
    creditLimit: "",
    color: "#64748b",
    hasMiles: false,
    milesRatioAmount: "",
    milesRatioMiles: "",
  };
}

interface CardAlert {
  level: "critical" | "warning";
  message: string;
}

function getCardAlert(card: Card, transactions: Transaction[]): CardAlert | null {
  if (card.type === "debito") return null;

  const hasOverdue = transactions.some(
    (tx) => tx.paymentMethodId === card.id && tx.status === "atrasado",
  );
  if (hasOverdue) {
    return { level: "critical", message: "Fatura em atraso" };
  }

  if (!card.dueDay) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let due = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
  due.setHours(0, 0, 0, 0);
  if (due < today) {
    due = new Date(today.getFullYear(), today.getMonth() + 1, card.dueDay);
  }
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 5) {
    const message =
      diffDays <= 0 ? "Vence hoje" : diffDays === 1 ? "Vence amanhã" : `Vence em ${diffDays} dias`;
    return { level: "warning", message };
  }

  return null;
}

export default function PagamentosPage() {
  const { cards, transactions, addCard, updateCard, deleteCard, genericPaymentMethods } =
    useFinanceData();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);

  function requestDelete(card: Card) {
    setDeleteTarget(card);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteCard(deleteTarget.id);
    if (!result.success) {
      window.alert(result.reason ?? "Não foi possível excluir o cartão.");
    }
    setDeleteTarget(null);
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

  function startEdit(card: Card) {
    setForm({
      name: card.name,
      bank: card.bank,
      type: card.type,
      closingDay: card.closingDay ? String(card.closingDay) : "",
      dueDay: card.dueDay ? String(card.dueDay) : "",
      creditLimit: card.creditLimit ? String(card.creditLimit) : "",
      color: card.color,
      hasMiles: card.milesRatioAmount !== null && card.milesRatioMiles !== null,
      milesRatioAmount: card.milesRatioAmount ? String(card.milesRatioAmount) : "",
      milesRatioMiles: card.milesRatioMiles ? String(card.milesRatioMiles) : "",
    });
    setEditingId(card.id);
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name || !form.bank) return;

    const values = {
      name: form.name,
      bank: form.bank,
      type: form.type,
      closingDay: form.closingDay ? Number(form.closingDay) : null,
      dueDay: form.dueDay ? Number(form.dueDay) : null,
      creditLimit:
        form.type !== "debito" && form.creditLimit
          ? Number(form.creditLimit)
          : null,
      color: form.color,
      milesRatioAmount:
        form.type !== "debito" && form.hasMiles && form.milesRatioAmount
          ? Number(form.milesRatioAmount)
          : null,
      milesRatioMiles:
        form.type !== "debito" && form.hasMiles && form.milesRatioMiles
          ? Number(form.milesRatioMiles)
          : null,
    };

    if (editingId) {
      await updateCard(editingId, values);
    } else {
      const newCard: Card = { id: "", ...values };
      await addCard(newCard);
    }

    closeModal();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Pagamentos
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Formas de pagamento e cartões cadastrados. Clique em qualquer um para ver o detalhamento.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
          Formas gerais
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {genericPaymentMethods.map((method, index) => (
            <div
              key={method.id}
              onClick={() => router.push(`/pagamentos/${method.id}`)}
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/40"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-base"
                style={{
                  backgroundColor: `color-mix(in oklch, ${CATEGORICAL[index % CATEGORICAL.length]} 18%, transparent)`,
                }}
              >
                {method.icon}
              </span>
              <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                {method.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
            Cartões
          </h2>
          <button
            onClick={openNewModal}
            className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
          >
            + Novo cartão
          </button>
        </div>

        <Modal
          open={showModal}
          onClose={closeModal}
          title={editingId ? "Editar cartão" : "Novo cartão"}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                placeholder="Ex: Nubank"
              />
            </div>

            <div>
              <label className={labelClass}>Banco</label>
              <input
                type="text"
                required
                value={form.bank}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank: e.target.value }))
                }
                className={inputClass}
                placeholder="Ex: Nubank"
              />
            </div>

            <div>
              <label className={labelClass}>Cor do cartão</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="h-10 w-16 cursor-pointer rounded-md border border-slate-300 bg-transparent dark:border-slate-700"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {form.color}
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as CardType }))
                }
                className={inputClass}
              >
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="ambos">Crédito e Débito (mesmo cartão)</option>
              </select>
            </div>

            {(form.type === "credito" || form.type === "ambos") && (
              <>
                <div>
                  <label className={labelClass}>Dia de fechamento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.closingDay}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, closingDay: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dia de vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.dueDay}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDay: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Limite de crédito (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.creditLimit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, creditLimit: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.hasMiles}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, hasMiles: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                    />
                    Pontuação em milhas?
                  </label>

                  {form.hasMiles && (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>A cada R$</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={form.milesRatioAmount}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, milesRatioAmount: e.target.value }))
                          }
                          className={inputClass}
                          placeholder="Ex: 1,00"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Ganho quantas milhas</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={form.milesRatioMiles}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, milesRatioMiles: e.target.value }))
                          }
                          className={inputClass}
                          placeholder="Ex: 1,50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
              >
                {editingId ? "Salvar alterações" : "Salvar cartão"}
              </button>
            </div>
          </form>
        </Modal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const alert = getCardAlert(card, transactions);
            return (
              <div
                key={card.id}
                onClick={() => router.push(`/pagamentos/${card.id}`)}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${card.color} 18%, transparent)`,
                        color: card.color,
                      }}
                    >
                      {cardInitial(card.name)}
                    </span>
                    <h3 className="font-display truncate font-bold text-[var(--foreground)]">
                      {card.name}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
                      {cardTypeLabel(card.type)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(card);
                      }}
                      aria-label="Editar cartão"
                      className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDelete(card);
                      }}
                      aria-label="Excluir cartão"
                      className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                  {card.bank}
                </p>
                {card.type !== "debito" && (
                  <p className="mt-3 text-xs font-medium text-[var(--text-tertiary)]">
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                    {card.creditLimit && (
                      <> · Limite {card.creditLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</>
                    )}
                  </p>
                )}
                {alert && (
                  <div
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      alert.level === "critical"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    ⚠ {alert.message}
                  </div>
                )}
                <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
                  Ver detalhes →
                </p>
              </div>
            );
          })}
          {cards.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)]">
              Nenhum cartão cadastrado ainda.
            </p>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir cartão"
        message={
          deleteTarget
            ? `Excluir o cartão "${deleteTarget.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
