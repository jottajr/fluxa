"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { addMonthsToDate, formatCurrency, formatDate } from "@/lib/format";
import {
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getMonthsInPeriod,
} from "@/lib/period";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { PeriodSelector } from "@/components/PeriodSelector";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { EmptyState } from "@/components/EmptyState";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import type { Transaction, TransactionStatus, TransactionType } from "@/types";

const STATUS_OPTIONS: TransactionStatus[] = [
  "pendente",
  "pago",
  "agendado",
  "atrasado",
];

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

type RepeatType = "none" | "recorrente" | "parcelado";

function emptyForm() {
  return {
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: "saida" as TransactionType,
    status: "pendente" as TransactionStatus,
    paymentMethodId: "",
    categoryId: "",
    repeatType: "none" as RepeatType,
    installments: "2",
    note: "",
  };
}

export default function TransacoesPage() {
  const {
    transactions,
    cards,
    categories,
    genericPaymentMethods,
    addTransactions,
    updateTransaction,
    deleteTransaction,
  } = useFinanceData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "todos">(
    "todos",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("todos");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const years = useMemo(() => {
    const unique = new Set(transactions.map((tx) => Number(tx.date.slice(0, 4))));
    unique.add(currentYear);
    return Array.from(unique).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  function handlePeriodTypeChange(newType: PeriodType) {
    setPeriodType(newType);
    setSubPeriod(defaultSubPeriodFor(newType, currentMonth));
  }

  const periodMonths = useMemo(
    () => getMonthsInPeriod(periodType, year, subPeriod),
    [periodType, year, subPeriod],
  );

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => periodMonths.includes(tx.date.slice(0, 7)))
      .filter((tx) => statusFilter === "todos" || tx.status === statusFilter)
      .filter((tx) => categoryFilter === "todas" || tx.categoryId === categoryFilter)
      .filter(
        (tx) =>
          paymentMethodFilter === "todos" ||
          tx.paymentMethodId === paymentMethodFilter,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, periodMonths, statusFilter, categoryFilter, paymentMethodFilter]);

  const totals = useMemo(() => {
    const entradas = filtered
      .filter((tx) => tx.type === "entrada")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const saidas = filtered
      .filter((tx) => tx.type === "saida")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

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

  function startEdit(tx: Transaction) {
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      date: tx.date,
      type: tx.type,
      status: tx.status,
      paymentMethodId: tx.paymentMethodId ?? "",
      categoryId: tx.categoryId ?? "",
      repeatType: tx.recurring ? "recorrente" : "none",
      installments: "2",
      note: tx.note,
    });
    setEditingId(tx.id);
    setShowModal(true);
  }

  async function handleDelete(id: string, description: string, installmentInfo?: string) {
    const message = installmentInfo
      ? `Excluir a parcela ${installmentInfo} de "${description}"?`
      : `Excluir a transação "${description}"?`;
    if (window.confirm(message)) {
      await deleteTransaction(id);
      closeModal();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.description || !form.amount) return;

    if (editingId) {
      await updateTransaction(editingId, {
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        type: form.type,
        status: form.status,
        paymentMethodId: form.paymentMethodId || null,
        categoryId: form.categoryId || null,
        recurring: form.repeatType === "recorrente",
        note: form.note,
      });
      closeModal();
      return;
    }

    const totalAmount = Number(form.amount);

    if (form.repeatType === "parcelado") {
      const totalInstallments = Math.max(2, Number(form.installments) || 2);
      const groupId = crypto.randomUUID();
      const baseInstallment = Math.floor((totalAmount / totalInstallments) * 100) / 100;
      const roundingRemainder =
        Math.round((totalAmount - baseInstallment * totalInstallments) * 100) / 100;

      const installmentTransactions = Array.from(
        { length: totalInstallments },
        (_, i) => {
          const isLast = i === totalInstallments - 1;
          return {
            id: `tx-${crypto.randomUUID()}`,
            description: form.description,
            amount: isLast ? baseInstallment + roundingRemainder : baseInstallment,
            date: addMonthsToDate(form.date, i),
            type: form.type,
            status: i === 0 ? form.status : ("agendado" as TransactionStatus),
            paymentMethodId: form.paymentMethodId || null,
            categoryId: form.categoryId || null,
            recurring: false,
            note: form.note,
            installmentGroupId: groupId,
            installmentNumber: i + 1,
            totalInstallments,
          };
        },
      );

      await addTransactions(installmentTransactions);
    } else {
      await addTransactions([
        {
          id: `tx-${crypto.randomUUID()}`,
          description: form.description,
          amount: totalAmount,
          date: form.date,
          type: form.type,
          status: form.status,
          paymentMethodId: form.paymentMethodId || null,
          categoryId: form.categoryId || null,
          recurring: form.repeatType === "recorrente",
          note: form.note,
          installmentGroupId: null,
          installmentNumber: null,
          totalInstallments: null,
        },
      ]);
    }

    closeModal();
  }

  const editingTx = editingId
    ? transactions.find((tx) => tx.id === editingId)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Transações - {formatPeriodLabel(periodType, year, subPeriod)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualize e lance suas movimentações financeiras.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          + Nova transação
        </button>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? "Detalhes da transação" : "Nova transação"}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Descrição</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={inputClass}
              placeholder="Ex: Supermercado"
            />
          </div>

          <div>
            <label className={labelClass}>
              {editingId ? "Valor (R$)" : "Valor total (R$)"}
            </label>
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

          <div>
            <label className={labelClass}>Tipo</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as TransactionType,
                }))
              }
              className={inputClass}
            >
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as TransactionStatus,
                }))
              }
              className={inputClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Forma de pagamento</label>
            <select
              value={form.paymentMethodId}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentMethodId: e.target.value }))
              }
              className={inputClass}
            >
              <option value="">Nenhuma</option>
              <optgroup label="Formas de pagamento">
                {genericPaymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cartões">
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className={labelClass}>Categoria</label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
              className={inputClass}
            >
              <option value="">Nenhuma</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <label className={labelClass}>Esta transação se repete?</label>

            {editingId && editingTx?.totalInstallments ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Parcela {editingTx.installmentNumber} de{" "}
                {editingTx.totalInstallments} — o número de parcelas não pode
                ser alterado após a criação.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="repeatType"
                    checked={form.repeatType === "none"}
                    onChange={() =>
                      setForm((f) => ({ ...f, repeatType: "none" }))
                    }
                    className="h-4 w-4 border-slate-300 dark:border-slate-700"
                  />
                  Não, é única
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="repeatType"
                    checked={form.repeatType === "recorrente"}
                    onChange={() =>
                      setForm((f) => ({ ...f, repeatType: "recorrente" }))
                    }
                    className="h-4 w-4 border-slate-300 dark:border-slate-700"
                  />
                  Recorrente indefinidamente (ex: aluguel, salário, assinatura)
                </label>
                {!editingId && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="repeatType"
                      checked={form.repeatType === "parcelado"}
                      onChange={() =>
                        setForm((f) => ({ ...f, repeatType: "parcelado" }))
                      }
                      className="h-4 w-4 border-slate-300 dark:border-slate-700"
                    />
                    Parcelado em número fixo de vezes (ex: compra financiada)
                  </label>
                )}
              </div>
            )}

            {form.repeatType === "parcelado" && !editingId && (
              <div className="mt-3">
                <label className={labelClass}>Quantas parcelas?</label>
                <input
                  type="number"
                  min={2}
                  max={48}
                  value={form.installments}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, installments: e.target.value }))
                  }
                  className={`${inputClass} max-w-[140px]`}
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Serão criadas {Math.max(2, Number(form.installments) || 2)}{" "}
                  transações, uma por mês.
                </p>
              </div>
            )}
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
              placeholder="Opcional"
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <button
              type="submit"
              className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
            >
              {editingId ? "Salvar alterações" : "Salvar transação"}
            </button>
            {editingId && editingTx && (
              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    editingTx.id,
                    editingTx.description,
                    editingTx.totalInstallments
                      ? `${editingTx.installmentNumber}/${editingTx.totalInstallments}`
                      : undefined,
                  )
                }
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir transação
              </button>
            )}
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Entradas</p>
          <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totals.entradas)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
          <p className="mt-1 text-2xl font-medium text-red-600 dark:text-red-400">
            {formatCurrency(totals.saidas)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p
            className={`mt-1 text-2xl font-medium ${
              totals.saldo >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(totals.saldo)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <PeriodSelector
          periodType={periodType}
          onPeriodTypeChange={handlePeriodTypeChange}
          subPeriod={subPeriod}
          onSubPeriodChange={setSubPeriod}
          year={year}
          onYearChange={setYear}
          years={years}
        />

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TransactionStatus | "todos")
              }
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="todos">Todos</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="todas">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Forma de pagamento:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="todos">Todas</option>
              <optgroup label="Formas de pagamento">
                {genericPaymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cartões">
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Data
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Descrição
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Categoria
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Forma de pagamento
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((tx) => (
              <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => startEdit(tx)}
                    aria-label="Editar transação"
                    className="text-slate-300 hover:text-slate-700 group-hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-200 dark:group-hover:text-slate-400"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(tx.date)}
                </td>
                <td className="px-4 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
                  {tx.description}
                  {tx.recurring && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      recorrente
                    </span>
                  )}
                  {tx.totalInstallments && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {tx.installmentNumber}/{tx.totalInstallments}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {tx.categoryId && categoriesById.get(tx.categoryId)
                    ? `${categoriesById.get(tx.categoryId)!.icon} ${categoriesById.get(tx.categoryId)!.name}`
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                  {getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods)}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-center text-sm font-semibold ${
                    tx.type === "entrada"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "entrada" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    message="Nenhuma transação encontrada neste período."
                    actionLabel="Nova transação"
                    onAction={openNewModal}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
