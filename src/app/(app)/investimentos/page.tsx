"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import type { InvestmentReturn } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    note: "",
  };
}

export default function InvestimentosPage() {
  const {
    transactions,
    categories,
    cards,
    genericPaymentMethods,
    investmentReturns,
    addInvestmentReturn,
    updateInvestmentReturn,
    deleteInvestmentReturn,
  } = useFinanceData();

  const investmentCategory = categories.find(
    (c) => c.name.trim().toLowerCase() === "investimentos",
  );

  const contributions = useMemo(() => {
    if (!investmentCategory) return [];
    return transactions
      .filter(
        (tx) => tx.type === "saida" && tx.categoryId === investmentCategory.id,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, investmentCategory]);

  const totalContributed = contributions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalReturns = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const totalEquity = totalContributed + totalReturns;

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

  function startEdit(entry: InvestmentReturn) {
    setForm({
      date: entry.date,
      amount: String(entry.amount),
      note: entry.note,
    });
    setEditingId(entry.id);
    setShowModal(true);
  }

  async function handleDelete(entry: InvestmentReturn) {
    const label = entry.note || formatCurrency(entry.amount);
    if (window.confirm(`Excluir o rendimento "${label}"?`)) {
      await deleteInvestmentReturn(entry.id);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.amount) return;

    if (editingId) {
      await updateInvestmentReturn(editingId, {
        date: form.date,
        amount: Number(form.amount),
        note: form.note,
      });
    } else {
      await addInvestmentReturn({
        id: `ret-${crypto.randomUUID()}`,
        date: form.date,
        amount: Number(form.amount),
        note: form.note,
      });
    }
    closeModal();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
          Investimentos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe seus aportes e rendimentos.
        </p>
      </div>

      {!investmentCategory && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          Crie uma categoria chamada &ldquo;Investimentos&rdquo; na aba
          Categorias para começar a rastrear seus aportes automaticamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total aportado
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalContributed)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total de rendimento
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalReturns)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Patrimônio total
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalEquity)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Rendimentos
          </h2>
          <button
            onClick={openNewModal}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            + Novo rendimento
          </button>
        </div>

        <Modal
          open={showModal}
          onClose={closeModal}
          title={editingId ? "Editar rendimento" : "Novo rendimento"}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
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
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Observação</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                className={inputClass}
                placeholder="Ex: Rendimento CDB"
              />
            </div>
            <div className="flex items-center justify-between gap-2 sm:col-span-2">
              <button
                type="submit"
                className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
              >
                {editingId ? "Salvar alterações" : "Salvar rendimento"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    const entry = investmentReturns.find((r) => r.id === editingId);
                    if (entry) handleDelete(entry);
                  }}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Excluir
                </button>
              )}
            </div>
          </form>
        </Modal>

        <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Observação
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {investmentReturns.map((entry) => (
                <tr key={entry.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(entry)}
                      aria-label="Editar rendimento"
                      className="text-slate-300 hover:text-slate-700 group-hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-200 dark:group-hover:text-slate-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entry.note || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(entry.amount)}
                  </td>
                </tr>
              ))}
              {investmentReturns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    Nenhum rendimento lançado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Aportes
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Transações lançadas na aba Transações com a categoria
          &ldquo;Investimentos&rdquo;.
        </p>

        <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Forma de pagamento
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contributions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {tx.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {contributions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    Nenhum aporte lançado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
