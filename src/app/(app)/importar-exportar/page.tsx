"use client";

import { useMemo, useRef, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { parseTransactionsCSV } from "@/lib/csv-import";
import {
  type PeriodType,
  defaultSubPeriodFor,
  formatPeriodLabel,
  getMonthsInPeriod,
} from "@/lib/period";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { PeriodSelector } from "@/components/PeriodSelector";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import type { Transaction, TransactionType } from "@/types";

export default function ImportarExportarPage() {
  const { transactions, categories, cards, genericPaymentMethods, addTransactions } =
    useFinanceData();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);

  const importFileRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<
    {
      tempId: string;
      date: string;
      description: string;
      amount: number;
      type: TransactionType;
      categoryId: string;
    }[]
  >([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

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

  const periodTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => periodMonths.includes(tx.date.slice(0, 7)))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, periodMonths],
  );

  const totals = useMemo(() => {
    const entradas = periodTransactions
      .filter((tx) => tx.type === "entrada")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const saidas = periodTransactions
      .filter((tx) => tx.type === "saida")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [periodTransactions]);

  const exportHeaders = ["Data", "Descrição", "Categoria", "Forma de pagamento", "Valor", "Status"];

  function buildExportRows() {
    return periodTransactions.map((tx) => [
      formatDate(tx.date),
      tx.description,
      tx.categoryId && categoriesById.get(tx.categoryId)
        ? categoriesById.get(tx.categoryId)!.name
        : "Sem categoria",
      getPaymentMethodLabel(tx.paymentMethodId, cards, genericPaymentMethods),
      `${tx.type === "entrada" ? "+" : "-"}${formatCurrency(tx.amount)}`,
      STATUS_LABELS[tx.status],
    ]);
  }

  function buildSummaryRows() {
    return [
      ["", "", "", "Total entradas", formatCurrency(totals.entradas), ""],
      ["", "", "", "Total saídas", formatCurrency(totals.saidas), ""],
      ["", "", "", "Saldo", formatCurrency(totals.saldo), ""],
    ];
  }

  function handleExportCSV() {
    exportToCSV(
      `transacoes-${formatPeriodLabel(periodType, year, subPeriod).replace(/\s+/g, "-")}.csv`,
      exportHeaders,
      buildExportRows(),
      buildSummaryRows(),
    );
  }

  async function handleExportPDF() {
    await exportToPDF(
      `transacoes-${formatPeriodLabel(periodType, year, subPeriod).replace(/\s+/g, "-")}.pdf`,
      `Transações — ${formatPeriodLabel(periodType, year, subPeriod)}`,
      exportHeaders,
      buildExportRows(),
      [
        `Total entradas: ${formatCurrency(totals.entradas)}`,
        `Total saídas: ${formatCurrency(totals.saidas)}`,
        `Saldo: ${formatCurrency(totals.saldo)}`,
      ],
    );
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors } = parseTransactionsCSV(text);
      setImportRows(
        rows.map((row) => ({
          tempId: crypto.randomUUID(),
          date: row.date,
          description: row.description,
          amount: Math.abs(row.amount),
          type: row.amount < 0 ? "saida" : "entrada",
          categoryId: "",
        })),
      );
      setImportErrors(errors);
      setShowImportModal(true);
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  function updateImportRowCategory(tempId: string, categoryId: string) {
    setImportRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, categoryId } : row)),
    );
  }

  function removeImportRow(tempId: string) {
    setImportRows((prev) => prev.filter((row) => row.tempId !== tempId));
  }

  function closeImportModal() {
    setImportRows([]);
    setImportErrors([]);
    setShowImportModal(false);
  }

  async function confirmImport() {
    const newTransactions: Transaction[] = importRows.map((row) => ({
      id: `tx-${crypto.randomUUID()}`,
      description: row.description,
      amount: row.amount,
      date: row.date,
      status: "pago",
      type: row.type,
      paymentMethodId: null,
      categoryId: row.categoryId || null,
      recurring: false,
      note: "Importado via CSV",
      installmentGroupId: null,
      installmentNumber: null,
      totalInstallments: null,
    }));
    await addTransactions(newTransactions);
    closeImportModal();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
          Importar e exportar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Exporte suas transações em CSV/PDF ou importe um extrato em CSV.
        </p>
      </div>

      <section className="tech-card space-y-5 rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Exportar
        </h2>

        <PeriodSelector
          periodType={periodType}
          onPeriodTypeChange={handlePeriodTypeChange}
          subPeriod={subPeriod}
          onSubPeriodChange={setSubPeriod}
          year={year}
          onYearChange={setYear}
          years={years}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Entradas</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.entradas)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Saídas</p>
            <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totals.saidas)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                totals.saldo >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(totals.saldo)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Exportar Excel (CSV)
          </button>
          <button
            onClick={handleExportPDF}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Exportar PDF
          </button>
        </div>
      </section>

      <section className="tech-card space-y-4 rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Importar CSV
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O arquivo precisa ter colunas de Data, Descrição e Valor. Você revisa
          e ajusta a categoria de cada lançamento antes de confirmar.
        </p>
        <input
          ref={importFileRef}
          type="file"
          accept=".csv"
          onChange={handleImportFile}
          className="hidden"
        />
        <button
          onClick={() => importFileRef.current?.click()}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Selecionar arquivo CSV
        </button>
      </section>

      <Modal
        open={showImportModal}
        onClose={closeImportModal}
        title="Revisar importação"
      >
        <div className="space-y-4">
          {importErrors.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
              {importErrors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}

          {importRows.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Nenhum lançamento válido encontrado nesse arquivo.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {importRows.length} lançamento{importRows.length > 1 ? "s" : ""}{" "}
                pronto{importRows.length > 1 ? "s" : ""} para importar. Ajuste a
                categoria se quiser, ou remova alguma linha.
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {importRows.map((row) => (
                  <div
                    key={row.tempId}
                    className="rounded-md border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {row.description}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(row.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`whitespace-nowrap text-sm font-semibold ${
                            row.type === "entrada"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {row.type === "entrada" ? "+" : "-"}
                          {formatCurrency(row.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImportRow(row.tempId)}
                          aria-label="Remover linha"
                          className="text-slate-300 hover:text-red-600 dark:text-slate-600 dark:hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <select
                      value={row.categoryId}
                      onChange={(e) =>
                        updateImportRowCategory(row.tempId, e.target.value)
                      }
                      className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeImportModal}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={importRows.length === 0}
              className="btn-primary rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Importar {importRows.length} lançamento
              {importRows.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
