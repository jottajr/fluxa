"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { CurrencySelector } from "@/components/CurrencySelector";
import {
  CURRENCY_OPTIONS,
  PRIMARY_CURRENCY,
  presentCurrencies,
  sumByCurrency,
} from "@/lib/currency";
import {
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
  const defaultModel = INVESTMENT_MODEL_PRESETS[1];
  return {
    description: "",
    amount: "",
    currency: PRIMARY_CURRENCY,
    date: new Date().toISOString().slice(0, 10),
    modelKey: defaultModel.key,
    category: defaultModel.category,
    rateValue: String(defaultModel.rateValue ?? ""),
    rateUnit: (defaultModel.rateUnit ?? "anual") as InvestmentRateUnit,
    note: "",
  };
}

export default function InvestimentosPage() {
  const {
    investmentReturns,
    addInvestmentReturn,
    updateInvestmentReturn,
    deleteInvestmentReturn,
    investmentPositions,
    addInvestmentPosition,
    updateInvestmentPosition,
    deleteInvestmentPosition,
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
  const totalEquity = totalContributed + totalReturns;

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

  // ---- rendimentos (lançamento manual) ----
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState(emptyReturnForm());

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

  async function handleDeleteReturn(entry: InvestmentReturn) {
    const label = entry.note || formatCurrency(entry.amount, entry.currency);
    if (window.confirm(`Excluir o rendimento "${label}"?`)) {
      await deleteInvestmentReturn(entry.id);
      if (editingReturnId === entry.id) closeReturnModal();
    }
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
      INVESTMENT_MODEL_PRESETS[3];
    setPositionForm({
      description: position.description,
      amount: String(position.amount),
      currency: position.currency,
      date: position.date,
      modelKey: preset.key,
      category: position.category,
      rateValue: position.rateValue !== null ? String(position.rateValue) : "",
      rateUnit: position.rateUnit ?? "anual",
      note: position.note,
    });
    setEditingPositionId(position.id);
    setShowPositionModal(true);
  }

  async function handleDeletePosition(position: InvestmentPosition) {
    if (window.confirm(`Excluir o aporte "${position.description}"?`)) {
      await deleteInvestmentPosition(position.id);
      if (editingPositionId === position.id) closePositionModal();
    }
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
      note: positionForm.note,
    };

    if (editingPositionId) {
      await updateInvestmentPosition(editingPositionId, payload);
    } else {
      await addInvestmentPosition({ id: `inv-${crypto.randomUUID()}`, ...payload });
    }
    closePositionModal();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Investimentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe seus aportes e rendimentos.
          </p>
        </div>
        <CurrencySelector
          currencies={currencies}
          selected={selectedCurrency}
          onSelect={setSelectedCurrency}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total aportado
          </p>
          <p className="mt-1 text-2xl font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(totalContributed, selectedCurrency)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rendimento lançado
          </p>
          <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalReturns, selectedCurrency)}
          </p>
        </div>
        <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Patrimônio total
          </p>
          <p className="mt-1 text-2xl font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(totalEquity, selectedCurrency)}
          </p>
        </div>
      </div>

      {projectablePositions.length > 0 && (
        <div className="tech-card rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Projeção de rendimento (renda fixa)
          </p>
          <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">
            + {formatCurrency(projectedGainTotal, selectedCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Estimativa calculada pela taxa configurada em cada aporte de renda
            fixa — não é rendimento confirmado, só entra no patrimônio quando
            você lançar de fato em &ldquo;Rendimentos&rdquo;.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Aportes
          </h2>
          <button
            onClick={openNewPositionModal}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            + Novo aporte
          </button>
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
                  A partir daqui, o valor projetado desse aporte já vai
                  aparecer atualizado sozinho conforme os meses passam, com
                  base nessa taxa. É uma estimativa, não uma rentabilidade
                  garantida.
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
                    if (position) handleDeletePosition(position);
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
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Modelo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Aportado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Projeção atual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {investmentPositions.map((position) => (
                <tr
                  key={position.id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEditPosition(position)}
                      aria-label="Editar aporte"
                      className="text-slate-300 hover:text-slate-700 group-hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-200 dark:group-hover:text-slate-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(position.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {position.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASS[position.category]}`}
                    >
                      {CATEGORY_LABELS[position.category]}
                      {position.category === "renda_fixa" &&
                        position.rateValue !== null &&
                        ` · ${position.rateValue}% ${position.rateUnit === "anual" ? "a.a." : "a.m."}`}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(position.amount, position.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {isProjectable(position) ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          projectedValue(position),
                          position.currency,
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {investmentPositions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    Nenhum aporte lançado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Rendimentos lançados
          </h2>
          <button
            onClick={openNewReturnModal}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            + Novo rendimento
          </button>
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
                    if (entry) handleDeleteReturn(entry);
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
                      onClick={() => startEditReturn(entry)}
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
                    +{formatCurrency(entry.amount, entry.currency)}
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
    </div>
  );
}
