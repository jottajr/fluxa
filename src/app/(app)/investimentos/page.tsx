"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { CurrencySelector } from "@/components/CurrencySelector";
import { EmptyState } from "@/components/EmptyState";
import { TimelineAreaChart } from "@/components/charts/TimelineAreaChart";
import { SolidPieChart } from "@/components/charts/SolidPieChart";
import { KpiCard, Variation } from "@/components/KpiCard";
import { CATEGORICAL } from "@/lib/chart-colors";
import { downsampleTimeline } from "@/lib/timeline";
import {
  CURRENCY_OPTIONS,
  PRIMARY_CURRENCY,
  presentCurrencies,
  sumByCurrency,
} from "@/lib/currency";
import {
  buildPatrimonioTimeline,
  getMaturityAlert,
  INVESTMENT_MODEL_PRESETS,
  isProjectable,
  projectedGain,
  projectedValue,
} from "@/lib/investment-projection";
import type {
  Currency,
  InvestmentCategory,
  InvestmentPosition,
  InvestmentRateUnit,
  InvestmentReturn,
} from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  renda_fixa: "Renda fixa",
  renda_variavel: "Renda variável",
  outro: "Outro",
};

const CATEGORY_BADGE_CLASS: Record<InvestmentCategory, string> = {
  renda_fixa:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  renda_variavel: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  outro: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function emptyReturnForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    currency: PRIMARY_CURRENCY,
    note: "",
  };
}

function emptyPositionForm() {
  const defaultModel = INVESTMENT_MODEL_PRESETS[0];
  return {
    description: "",
    amount: "",
    currency: PRIMARY_CURRENCY,
    date: new Date().toISOString().slice(0, 10),
    modelKey: defaultModel.key,
    category: defaultModel.category,
    rateValue: String(defaultModel.rateValue ?? ""),
    rateUnit: (defaultModel.rateUnit ?? "anual") as InvestmentRateUnit,
    maturityDate: "",
    note: "",
  };
}

export default function InvestimentosPage() {
  const {
    investmentReturns,
    addInvestmentReturn,
    updateInvestmentReturn,
    deleteInvestmentReturn,
    deleteInvestmentReturns,
    investmentPositions,
    addInvestmentPosition,
    updateInvestmentPosition,
    deleteInvestmentPosition,
    deleteInvestmentPositions,
  } = useFinanceData();

  const contributedByCurrency = useMemo(
    () => sumByCurrency(investmentPositions),
    [investmentPositions],
  );
  const returnsByCurrency = useMemo(
    () => sumByCurrency(investmentReturns),
    [investmentReturns],
  );

  const currencies = useMemo(
    () => presentCurrencies([...investmentPositions, ...investmentReturns]),
    [investmentPositions, investmentReturns],
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(PRIMARY_CURRENCY);

  const totalContributed = contributedByCurrency[selectedCurrency] ?? 0;
  const totalReturns = returnsByCurrency[selectedCurrency] ?? 0;

  const projectablePositions = useMemo(
    () =>
      investmentPositions.filter(
        (p) => p.currency === selectedCurrency && isProjectable(p),
      ),
    [investmentPositions, selectedCurrency],
  );
  const projectedGainTotal = useMemo(
    () => projectablePositions.reduce((sum, p) => sum + projectedGain(p), 0),
    [projectablePositions],
  );

  const totalRendimento = totalReturns + projectedGainTotal;
  const totalEquity = totalContributed + totalRendimento;

  const monthlyEquitySeries = useMemo(
    () => buildPatrimonioTimeline(investmentPositions, investmentReturns, selectedCurrency),
    [investmentPositions, investmentReturns, selectedCurrency],
  );
  const timeline = useMemo(
    () => downsampleTimeline(monthlyEquitySeries),
    [monthlyEquitySeries],
  );
  const previousEquity =
    monthlyEquitySeries.length >= 2
      ? monthlyEquitySeries[monthlyEquitySeries.length - 2].value
      : null;

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const aportesMes = useMemo(
    () =>
      investmentPositions
        .filter((p) => p.currency === selectedCurrency && p.date.startsWith(currentMonthStr))
        .reduce((sum, p) => sum + p.amount, 0),
    [investmentPositions, selectedCurrency, currentMonthStr],
  );
  const allocation = useMemo(() => {
    const totals = new Map<InvestmentCategory, number>();
    investmentPositions
      .filter((p) => p.currency === selectedCurrency)
      .forEach((p) => {
        const value = isProjectable(p) ? projectedValue(p) : p.amount;
        totals.set(p.category, (totals.get(p.category) ?? 0) + value);
      });
    return Array.from(totals.entries())
      .map(([category, value], index) => ({
        name: CATEGORY_LABELS[category],
        value,
        color: CATEGORICAL[index % CATEGORICAL.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [investmentPositions, selectedCurrency]);

  // ---- rendimentos (lançamento manual) ----
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState(emptyReturnForm());
  const [selectedReturnIds, setSelectedReturnIds] = useState<Set<string>>(new Set());
  const [confirmReturnState, setConfirmReturnState] = useState<
    | { type: "single"; id: string; label: string }
    | { type: "bulk"; ids: string[] }
    | null
  >(null);

  function openNewReturnModal() {
    setReturnForm(emptyReturnForm());
    setEditingReturnId(null);
    setShowReturnModal(true);
  }

  function closeReturnModal() {
    setReturnForm(emptyReturnForm());
    setEditingReturnId(null);
    setShowReturnModal(false);
  }

  function startEditReturn(entry: InvestmentReturn) {
    setReturnForm({
      date: entry.date,
      amount: String(entry.amount),
      currency: entry.currency,
      note: entry.note,
    });
    setEditingReturnId(entry.id);
    setShowReturnModal(true);
  }

  function toggleReturnSelected(id: string) {
    setSelectedReturnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllReturns() {
    setSelectedReturnIds((prev) =>
      prev.size === investmentReturns.length
        ? new Set()
        : new Set(investmentReturns.map((r) => r.id)),
    );
  }

  function requestDeleteReturn(entry: InvestmentReturn) {
    setConfirmReturnState({
      type: "single",
      id: entry.id,
      label: entry.note || formatCurrency(entry.amount, entry.currency),
    });
  }

  function requestBulkDeleteReturns() {
    if (selectedReturnIds.size === 0) return;
    setConfirmReturnState({ type: "bulk", ids: Array.from(selectedReturnIds) });
  }

  async function confirmReturnDeletion() {
    if (!confirmReturnState) return;
    if (confirmReturnState.type === "single") {
      await deleteInvestmentReturn(confirmReturnState.id);
      if (editingReturnId === confirmReturnState.id) closeReturnModal();
      setSelectedReturnIds((prev) => {
        if (!prev.has(confirmReturnState.id)) return prev;
        const next = new Set(prev);
        next.delete(confirmReturnState.id);
        return next;
      });
    } else {
      await deleteInvestmentReturns(confirmReturnState.ids);
      setSelectedReturnIds(new Set());
    }
    setConfirmReturnState(null);
  }

  async function handleSubmitReturn(event: React.FormEvent) {
    event.preventDefault();
    if (!returnForm.amount) return;

    if (editingReturnId) {
      await updateInvestmentReturn(editingReturnId, {
        date: returnForm.date,
        amount: Number(returnForm.amount),
        currency: returnForm.currency,
        note: returnForm.note,
      });
    } else {
      await addInvestmentReturn({
        id: `ret-${crypto.randomUUID()}`,
        date: returnForm.date,
        amount: Number(returnForm.amount),
        currency: returnForm.currency,
        note: returnForm.note,
      });
    }
    closeReturnModal();
  }

  // ---- posições / aportes ----
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [positionForm, setPositionForm] = useState(emptyPositionForm());
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(
    new Set(),
  );
  const [confirmPositionState, setConfirmPositionState] = useState<
    | { type: "single"; id: string; description: string }
    | { type: "bulk"; ids: string[] }
    | null
  >(null);

  function openNewPositionModal() {
    setPositionForm(emptyPositionForm());
    setEditingPositionId(null);
    setShowPositionModal(true);
  }

  function closePositionModal() {
    setPositionForm(emptyPositionForm());
    setEditingPositionId(null);
    setShowPositionModal(false);
  }

  function startEditPosition(position: InvestmentPosition) {
    const preset =
      INVESTMENT_MODEL_PRESETS.find((m) => m.category === position.category) ??
      INVESTMENT_MODEL_PRESETS[INVESTMENT_MODEL_PRESETS.length - 1];
    setPositionForm({
      description: position.description,
      amount: String(position.amount),
      currency: position.currency,
      date: position.date,
      modelKey: preset.key,
      category: position.category,
      rateValue: position.rateValue !== null ? String(position.rateValue) : "",
      rateUnit: position.rateUnit ?? "anual",
      maturityDate: position.maturityDate ?? "",
      note: position.note,
    });
    setEditingPositionId(position.id);
    setShowPositionModal(true);
  }

  function toggleSelectAllPositions() {
    setSelectedPositionIds((prev) =>
      prev.size === investmentPositions.length
        ? new Set()
        : new Set(investmentPositions.map((p) => p.id)),
    );
  }

  function togglePositionSelected(id: string) {
    setSelectedPositionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestDeletePosition(position: InvestmentPosition) {
    setConfirmPositionState({
      type: "single",
      id: position.id,
      description: position.description,
    });
  }

  function requestBulkDeletePositions() {
    if (selectedPositionIds.size === 0) return;
    setConfirmPositionState({ type: "bulk", ids: Array.from(selectedPositionIds) });
  }

  async function confirmPositionDeletion() {
    if (!confirmPositionState) return;
    if (confirmPositionState.type === "single") {
      await deleteInvestmentPosition(confirmPositionState.id);
      if (editingPositionId === confirmPositionState.id) closePositionModal();
      setSelectedPositionIds((prev) => {
        if (!prev.has(confirmPositionState.id)) return prev;
        const next = new Set(prev);
        next.delete(confirmPositionState.id);
        return next;
      });
    } else {
      await deleteInvestmentPositions(confirmPositionState.ids);
      setSelectedPositionIds(new Set());
    }
    setConfirmPositionState(null);
  }

  function handleModelChange(modelKey: string) {
    const preset = INVESTMENT_MODEL_PRESETS.find((m) => m.key === modelKey);
    if (!preset) return;
    setPositionForm((f) => ({
      ...f,
      modelKey,
      category: preset.category,
      rateValue: preset.rateValue !== null ? String(preset.rateValue) : "",
      rateUnit: preset.rateUnit ?? "anual",
    }));
  }

  async function handleSubmitPosition(event: React.FormEvent) {
    event.preventDefault();
    if (!positionForm.description || !positionForm.amount) return;

    const isRendaFixa = positionForm.category === "renda_fixa";
    const payload = {
      description: positionForm.description,
      amount: Number(positionForm.amount),
      currency: positionForm.currency,
      date: positionForm.date,
      category: positionForm.category,
      rateValue: isRendaFixa && positionForm.rateValue ? Number(positionForm.rateValue) : null,
      rateUnit: isRendaFixa ? positionForm.rateUnit : null,
      maturityDate: positionForm.maturityDate || null,
      note: positionForm.note,
    };

    if (editingPositionId) {
      await updateInvestmentPosition(editingPositionId, payload);
    } else {
      await addInvestmentPosition({ id: `inv-${crypto.randomUUID()}`, ...payload });
    }
    closePositionModal();
  }

  const cardClass =
    "rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6";

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            Investimentos
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            Patrimônio investido e alocação
          </p>
        </div>
        <div className="ml-auto">
          <CurrencySelector
            currencies={currencies}
            selected={selectedCurrency}
            onSelect={setSelectedCurrency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Patrimônio total"
          value={formatCurrency(totalEquity, selectedCurrency)}
          color="var(--foreground)"
          variation={<Variation current={totalEquity} previous={previousEquity} higherIsGood />}
        />
        <KpiCard
          label="Total aportado"
          value={formatCurrency(totalContributed, selectedCurrency)}
          color="var(--foreground)"
          variation={null}
        />
        <KpiCard
          label="Rendimento"
          value={formatCurrency(totalRendimento, selectedCurrency)}
          color="var(--chart-positive)"
          variation={null}
          caption={
            projectedGainTotal > 0
              ? `${formatCurrency(projectedGainTotal, selectedCurrency)} projetado (renda fixa) + ${formatCurrency(totalReturns, selectedCurrency)} lançado`
              : undefined
          }
        />
        <KpiCard
          label="Aportes (mês)"
          value={formatCurrency(aportesMes, selectedCurrency)}
          color="var(--foreground)"
          variation={null}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className={cardClass}>
          <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
            Alocação
          </h2>
          {allocation.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum aporte lançado ainda.</p>
          ) : (
            <SolidPieChart data={allocation} />
          )}
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
              Evolução do patrimônio
            </h2>
            {timeline.granularity !== "mensal" && (
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                Valores {timeline.granularity === "semestral" ? "semestrais" : "anuais"}
              </span>
            )}
          </div>
          {timeline.points.length > 1 ? (
            <TimelineAreaChart points={timeline.points} currency={selectedCurrency} />
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              Lance mais de um aporte para ver a evolução ao longo do tempo.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
              Aportes
            </h2>
            <p className="mt-0.5 text-xs font-medium text-[var(--text-tertiary)]">
              A projeção de renda fixa é recalculada todos os dias, com base
              na taxa configurada em cada aporte.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedPositionIds.size > 0 && (
              <button
                onClick={requestBulkDeletePositions}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir selecionados ({selectedPositionIds.size})
              </button>
            )}
            <button
              onClick={openNewPositionModal}
              className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
            >
              + Novo aporte
            </button>
          </div>
        </div>

        <Modal
          open={showPositionModal}
          onClose={closePositionModal}
          title={editingPositionId ? "Editar aporte" : "Novo aporte"}
        >
          <form
            onSubmit={handleSubmitPosition}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição</label>
              <input
                type="text"
                required
                value={positionForm.description}
                onChange={(e) =>
                  setPositionForm((f) => ({ ...f, description: e.target.value }))
                }
                className={inputClass}
                placeholder="Ex: CDB Banco X"
              />
            </div>
            <div>
              <label className={labelClass}>Valor</label>
              <input
                type="number"
                step="0.01"
                required
                value={positionForm.amount}
                onChange={(e) =>
                  setPositionForm((f) => ({ ...f, amount: e.target.value }))
                }
                className={inputClass}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelClass}>Moeda</label>
              <select
                value={positionForm.currency}
                onChange={(e) =>
                  setPositionForm((f) => ({
                    ...f,
                    currency: e.target.value as Currency,
                  }))
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
              <label className={labelClass}>Data do aporte</label>
              <input
                type="date"
                required
                value={positionForm.date}
                onChange={(e) =>
                  setPositionForm((f) => ({ ...f, date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modelo</label>
              <select
                value={positionForm.modelKey}
                onChange={(e) => handleModelChange(e.target.value)}
                className={inputClass}
              >
                {INVESTMENT_MODEL_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Vencimento (opcional)</label>
              <input
                type="date"
                value={positionForm.maturityDate}
                onChange={(e) =>
                  setPositionForm((f) => ({ ...f, maturityDate: e.target.value }))
                }
                className={inputClass}
              />
            </div>

            {positionForm.category === "renda_fixa" && (
              <>
                <div>
                  <label className={labelClass}>Taxa</label>
                  <input
                    type="number"
                    step="0.01"
                    value={positionForm.rateValue}
                    onChange={(e) =>
                      setPositionForm((f) => ({ ...f, rateValue: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Ex: 12"
                  />
                </div>
                <div>
                  <label className={labelClass}>Período da taxa</label>
                  <select
                    value={positionForm.rateUnit}
                    onChange={(e) =>
                      setPositionForm((f) => ({
                        ...f,
                        rateUnit: e.target.value as InvestmentRateUnit,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="anual">% ao ano</option>
                    <option value="mensal">% ao mês</option>
                  </select>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 sm:col-span-2">
                  Com base nessa taxa, o valor projetado deste aporte é
                  recalculado automaticamente todos os dias — ele cresce um
                  pouco a cada dia que passa, sem você precisar lançar nada, e
                  já entra somado no Patrimônio total.
                </p>
              </>
            )}

            {positionForm.category === "renda_variavel" && (
              <p className="text-xs text-slate-400 dark:text-slate-500 sm:col-span-2">
                Renda variável não tem taxa garantida, então esse aporte não
                projeta sozinho — lance o rendimento manualmente em
                &ldquo;Rendimentos&rdquo; quando quiser refletir o resultado real.
              </p>
            )}

            <div className="sm:col-span-2">
              <label className={labelClass}>Observação</label>
              <input
                type="text"
                value={positionForm.note}
                onChange={(e) =>
                  setPositionForm((f) => ({ ...f, note: e.target.value }))
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
                {editingPositionId ? "Salvar alterações" : "Salvar aporte"}
              </button>
              {editingPositionId && (
                <button
                  type="button"
                  onClick={() => {
                    const position = investmentPositions.find(
                      (p) => p.id === editingPositionId,
                    );
                    if (position) requestDeletePosition(position);
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
          <div className="grid grid-cols-[28px_90px_1.5fr_1.2fr_1fr_1fr_60px] items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            <input
              type="checkbox"
              checked={
                investmentPositions.length > 0 &&
                selectedPositionIds.size === investmentPositions.length
              }
              onChange={toggleSelectAllPositions}
              aria-label="Selecionar todos os aportes"
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            <div>Data</div>
            <div>Descrição</div>
            <div>Modelo</div>
            <div className="text-right">Aportado</div>
            <div className="text-right">Projeção atual</div>
            <div />
          </div>

          {investmentPositions.map((position) => {
            const maturityAlert = getMaturityAlert(position.maturityDate);
            return (
              <div
                key={position.id}
                className="grid grid-cols-[28px_90px_1.5fr_1.2fr_1fr_1fr_60px] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedPositionIds.has(position.id)}
                  onChange={() => togglePositionSelected(position.id)}
                  aria-label="Selecionar aporte"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                />
                <div className="text-[12.5px] font-medium text-[var(--text-tertiary)]">
                  {formatDate(position.date)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                    {position.description}
                  </p>
                  {maturityAlert && (
                    <span
                      className={`mt-1 inline-flex whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        maturityAlert.level === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      ⚠ {maturityAlert.message}
                    </span>
                  )}
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${CATEGORY_BADGE_CLASS[position.category]}`}
                  >
                    {CATEGORY_LABELS[position.category]}
                    {position.category === "renda_fixa" &&
                      position.rateValue !== null &&
                      ` · ${position.rateValue}% ${position.rateUnit === "anual" ? "a.a." : "a.m."}`}
                  </span>
                </div>
                <div className="font-display text-right text-[13.5px] font-bold tracking-tight tabular-nums text-[var(--foreground)]">
                  {formatCurrency(position.amount, position.currency)}
                </div>
                <div className="font-display text-right text-[13.5px] font-bold tracking-tight tabular-nums">
                  {isProjectable(position) ? (
                    <span style={{ color: "var(--chart-positive)" }}>
                      {formatCurrency(projectedValue(position), position.currency)}
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => startEditPosition(position)}
                    aria-label="Editar aporte"
                    className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => requestDeletePosition(position)}
                    aria-label="Excluir aporte"
                    className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {investmentPositions.length === 0 && (
            <EmptyState message="Nenhum aporte lançado ainda." />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
            Rendimentos lançados
          </h2>
          <div className="flex items-center gap-2">
            {selectedReturnIds.size > 0 && (
              <button
                onClick={requestBulkDeleteReturns}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir selecionados ({selectedReturnIds.size})
              </button>
            )}
            <button
              onClick={openNewReturnModal}
              className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
            >
              + Novo rendimento
            </button>
          </div>
        </div>

        <Modal
          open={showReturnModal}
          onClose={closeReturnModal}
          title={editingReturnId ? "Editar rendimento" : "Novo rendimento"}
        >
          <form
            onSubmit={handleSubmitReturn}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>Valor</label>
              <input
                type="number"
                step="0.01"
                required
                value={returnForm.amount}
                onChange={(e) =>
                  setReturnForm((f) => ({ ...f, amount: e.target.value }))
                }
                className={inputClass}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelClass}>Moeda</label>
              <select
                value={returnForm.currency}
                onChange={(e) =>
                  setReturnForm((f) => ({
                    ...f,
                    currency: e.target.value as Currency,
                  }))
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
                value={returnForm.date}
                onChange={(e) =>
                  setReturnForm((f) => ({ ...f, date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Observação</label>
              <input
                type="text"
                value={returnForm.note}
                onChange={(e) =>
                  setReturnForm((f) => ({ ...f, note: e.target.value }))
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
                {editingReturnId ? "Salvar alterações" : "Salvar rendimento"}
              </button>
              {editingReturnId && (
                <button
                  type="button"
                  onClick={() => {
                    const entry = investmentReturns.find(
                      (r) => r.id === editingReturnId,
                    );
                    if (entry) requestDeleteReturn(entry);
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
          <div className="grid grid-cols-[28px_90px_1.6fr_1fr_60px] items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            <input
              type="checkbox"
              checked={
                investmentReturns.length > 0 &&
                selectedReturnIds.size === investmentReturns.length
              }
              onChange={toggleSelectAllReturns}
              aria-label="Selecionar todos os rendimentos"
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            <div>Data</div>
            <div>Observação</div>
            <div className="text-right">Valor</div>
            <div />
          </div>

          {investmentReturns.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[28px_90px_1.6fr_1fr_60px] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selectedReturnIds.has(entry.id)}
                onChange={() => toggleReturnSelected(entry.id)}
                aria-label="Selecionar rendimento"
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
                +{formatCurrency(entry.amount, entry.currency)}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => startEditReturn(entry)}
                  aria-label="Editar rendimento"
                  className="text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => requestDeleteReturn(entry)}
                  aria-label="Excluir rendimento"
                  className="text-[var(--text-tertiary)] hover:text-[var(--chart-negative)]"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {investmentReturns.length === 0 && (
            <EmptyState message="Nenhum rendimento lançado ainda." />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmPositionState !== null}
        title={
          confirmPositionState?.type === "bulk"
            ? "Excluir aportes selecionados"
            : "Excluir aporte"
        }
        message={
          confirmPositionState?.type === "bulk"
            ? `Tem certeza que deseja excluir ${confirmPositionState.ids.length} ${confirmPositionState.ids.length === 1 ? "aporte selecionado" : "aportes selecionados"}? Essa ação não pode ser desfeita.`
            : confirmPositionState?.type === "single"
              ? `Excluir o aporte "${confirmPositionState.description}"? Essa ação não pode ser desfeita.`
              : ""
        }
        onConfirm={confirmPositionDeletion}
        onCancel={() => setConfirmPositionState(null)}
      />

      <ConfirmDialog
        open={confirmReturnState !== null}
        title={
          confirmReturnState?.type === "bulk"
            ? "Excluir rendimentos selecionados"
            : "Excluir rendimento"
        }
        message={
          confirmReturnState?.type === "bulk"
            ? `Tem certeza que deseja excluir ${confirmReturnState.ids.length} ${confirmReturnState.ids.length === 1 ? "rendimento selecionado" : "rendimentos selecionados"}? Essa ação não pode ser desfeita.`
            : confirmReturnState?.type === "single"
              ? `Excluir o rendimento "${confirmReturnState.label}"? Essa ação não pode ser desfeita.`
              : ""
        }
        onConfirm={confirmReturnDeletion}
        onCancel={() => setConfirmReturnState(null)}
      />
    </div>
  );
}
