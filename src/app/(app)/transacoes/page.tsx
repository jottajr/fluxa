"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { addMonthsToDate, formatCurrency, formatDate } from "@/lib/format";
import {
  type DateRange,
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getPeriodRange,
} from "@/lib/period";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PeriodSelector } from "@/components/PeriodSelector";
import { TransactionFiltersDrawer } from "@/components/TransactionFiltersDrawer";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { EmptyState } from "@/components/EmptyState";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import {
  CURRENCY_OPTIONS,
  PRIMARY_CURRENCY,
  secondaryCurrencyTotals,
  sumByCurrency,
} from "@/lib/currency";
import type { Currency, Transaction, TransactionStatus, TransactionType } from "@/types";

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
    currency: PRIMARY_CURRENCY,
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
    deleteTransactions,
  } = useFinanceData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "todos">(
    "todos",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("todos");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<
    | { type: "single"; id: string; description: string; installmentInfo?: string }
    | { type: "bulk"; ids: string[] }
    | null
  >(null);

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

  const periodRange = useMemo(
    () => getPeriodRange(periodType, year, subPeriod, customRange),
    [periodType, year, subPeriod, customRange],
  );

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => tx.date >= periodRange.start && tx.date <= periodRange.end)
      .filter((tx) => statusFilter === "todos" || tx.status === statusFilter)
      .filter((tx) => categoryFilter === "todas" || tx.categoryId === categoryFilter)
      .filter(
        (tx) =>
          paymentMethodFilter === "todos" ||
          tx.paymentMethodId === paymentMethodFilter,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, periodRange, statusFilter, categoryFilter, paymentMethodFilter]);

  const totals = useMemo(() => {
    const entradasByCurrency = sumByCurrency(
      filtered.filter((tx) => tx.type === "entrada"),
    );
    const saidasByCurrency = sumByCurrency(
      filtered.filter((tx) => tx.type === "saida"),
    );
    const entradasPrimary = entradasByCurrency[PRIMARY_CURRENCY] ?? 0;
    const saidasPrimary = saidasByCurrency[PRIMARY_CURRENCY] ?? 0;

    const secondaryCurrencies = Array.from(
      new Set([
        ...Object.keys(entradasByCurrency),
        ...Object.keys(saidasByCurrency),
      ].filter((c) => c !== PRIMARY_CURRENCY)),
    ) as Currency[];

    return {
      entradasByCurrency,
      saidasByCurrency,
      entradasPrimary,
      saidasPrimary,
      saldoPrimary: entradasPrimary - saidasPrimary,
      secondaryCurrencies,
    };
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
      currency: tx.currency,
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

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map((tx) => tx.id)),
    );
  }

  function requestDelete(tx: Transaction) {
    setConfirmState({
      type: "single",
      id: tx.id,
      description: tx.description,
      installmentInfo: tx.totalInstallments
        ? `${tx.installmentNumber}/${tx.totalInstallments}`
        : undefined,
    });
  }

  function requestBulkDelete() {
    if (selectedIds.size === 0) return;
    setConfirmState({ type: "bulk", ids: Array.from(selectedIds) });
  }

  async function confirmDeletion() {
    if (!confirmState) return;
    if (confirmState.type === "single") {
      await deleteTransaction(confirmState.id);
      if (editingId === confirmState.id) closeModal();
      setSelectedIds((prev) => {
        if (!prev.has(confirmState.id)) return prev;
        const next = new Set(prev);
        next.delete(confirmState.id);
        return next;
      });
    } else {
      await deleteTransactions(confirmState.ids);
      setSelectedIds(new Set());
    }
    setConfirmState(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.description || !form.amount) return;

    if (editingId) {
      await updateTransaction(editingId, {
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency,
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
            currency: form.currency,
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
          currency: form.currency,
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
            Transações - {formatPeriodLabel(periodType, year, subPeriod, customRange)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualize e lance suas movimentações financeiras.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={requestBulkDelete}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Excluir selecionadas ({selectedIds.size})
            </button>
          )}
          <button
            onClick={openNewModal}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            + Nova transação
          </button>
        </div>
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
                onClick={() => requestDelete(editingTx)}
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
            {formatCurrency(totals.entradasPrimary)}
          </p>
          {secondaryCurrencyTotals(totals.entradasByCurrency).map(([currency, value]) => (
            <p key={currency} className="text-xs text-slate-400 dark:text-slate-500">
              {formatCurrency(value, currency)}
            </p>
          ))}
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
          <p className="mt-1 text-2xl font-medium text-red-600 dark:text-red-400">
            {formatCurrency(totals.saidasPrimary)}
          </p>
          {secondaryCurrencyTotals(totals.saidasByCurrency).map(([currency, value]) => (
            <p key={currency} className="text-xs text-slate-400 dark:text-slate-500">
              {formatCurrency(value, currency)}
            </p>
          ))}
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p
            className={`mt-1 text-2xl font-medium ${
              totals.saldoPrimary >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(totals.saldoPrimary)}
          </p>
          {totals.secondaryCurrencies.map((currency) => {
            const value =
              (totals.entradasByCurrency[currency] ?? 0) -
              (totals.saidasByCurrency[currency] ?? 0);
            return (
              <p key={currency} className="text-xs text-slate-400 dark:text-slate-500">
                {formatCurrency(value, currency)}
              </p>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PeriodSelector
          periodType={periodType}
          onPeriodTypeChange={handlePeriodTypeChange}
          subPeriod={subPeriod}
          onSubPeriodChange={setSubPeriod}
          year={year}
          onYearChange={setYear}
          years={years}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        <TransactionFiltersDrawer
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          paymentMethodFilter={paymentMethodFilter}
          onPaymentMethodFilterChange={setPaymentMethodFilter}
          cards={cards}
          genericPaymentMethods={genericPaymentMethods}
        />
      </div>

      <div className="tech-card overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                />
              </th>
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
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((tx) => (
              <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tx.id)}
                    onChange={() => toggleSelected(tx.id)}
                    aria-label="Selecionar transação"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                  />
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
                  {formatCurrency(tx.amount, tx.currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => startEdit(tx)}
                      aria-label="Editar transação"
                      className="text-slate-300 hover:text-slate-700 group-hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-200 dark:group-hover:text-slate-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => requestDelete(tx)}
                      aria-label="Excluir transação"
                      className="text-slate-300 hover:text-red-600 group-hover:text-slate-500 dark:text-slate-600 dark:hover:text-red-400 dark:group-hover:text-slate-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
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

      <ConfirmDialog
        open={confirmState !== null}
        title={
          confirmState?.type === "bulk"
            ? "Excluir transações selecionadas"
            : "Excluir transação"
        }
        message={
          confirmState?.type === "bulk"
            ? `Tem certeza que deseja excluir ${confirmState.ids.length} ${confirmState.ids.length === 1 ? "transação selecionada" : "transações selecionadas"}? Essa ação não pode ser desfeita.`
            : confirmState?.type === "single"
              ? confirmState.installmentInfo
                ? `Excluir a parcela ${confirmState.installmentInfo} de "${confirmState.description}"? Essa ação não pode ser desfeita.`
                : `Excluir a transação "${confirmState.description}"? Essa ação não pode ser desfeita.`
              : ""
        }
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
