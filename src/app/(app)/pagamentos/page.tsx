"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFinanceData } from "@/lib/finance-data-context";
import { Modal } from "@/components/Modal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { cardTypeLabel } from "@/lib/card-type";
import type { Card, CardType, Transaction } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyForm() {
  return {
    name: "",
    bank: "",
    type: "credito" as CardType,
    closingDay: "",
    dueDay: "",
    creditLimit: "",
    color: "#64748b",
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
  const { cards, transactions, addCard, updateCard, genericPaymentMethods } =
    useFinanceData();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

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
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
          Pagamentos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Formas de pagamento disponíveis para suas transações. Clique em
          qualquer uma para ver o detalhamento.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Formas gerais
        </h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {genericPaymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => router.push(`/pagamentos/${method.id}`)}
              role="button"
              tabIndex={0}
              className="tech-card cursor-pointer rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 text-center transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <span className="text-3xl">{method.icon}</span>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {method.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cartões
          </h2>
          <button
            onClick={openNewModal}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map((card) => {
            const alert = getCardAlert(card, transactions);
            return (
              <div
                key={card.id}
                onClick={() => router.push(`/pagamentos/${card.id}`)}
                role="button"
                tabIndex={0}
                className="tech-card cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                <div className="h-1.5" style={{ backgroundColor: card.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {card.name}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {cardTypeLabel(card.type)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(card);
                        }}
                        aria-label="Editar cartão"
                        className="text-slate-300 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {card.bank}
                  </p>
                  {card.type !== "debito" && (
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                      {card.creditLimit && (
                        <> · Limite {card.creditLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</>
                      )}
                    </p>
                  )}
                  {alert && (
                    <div
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        alert.level === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      ⚠ {alert.message}
                    </div>
                  )}
                  <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Ver detalhes →
                  </p>
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Nenhum cartão cadastrado ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
