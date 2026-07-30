"use client";

import { useState } from "react";
import { KpiCard, Variation } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PeriodSelector } from "@/components/PeriodSelector";
import { formatCurrency } from "@/lib/format";
import {
  type DateRange,
  type PeriodType,
  defaultSubPeriodFor,
} from "@/lib/period";
import type { TransactionStatus, TransactionType } from "@/types";

// CASCA VISUAL — dados fictícios, aguardando plugar os dados/funcionalidades reais da Fluxa.
const MOCK_ROWS: {
  initial: string;
  name: string;
  date: string;
  category: string;
  paymentMethod: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}[] = [
  { initial: "S", name: "Supermercado Extra", date: "22 Jul", category: "Alimentação", paymentMethod: "Cartão", amount: 342.1, type: "saida", status: "pago" },
  { initial: "U", name: "Salário", date: "20 Jul", category: "Receita", paymentMethod: "Cartão", amount: 8200, type: "entrada", status: "pago" },
  { initial: "N", name: "Netflix", date: "19 Jul", category: "Assinaturas", paymentMethod: "Cartão", amount: 44.9, type: "saida", status: "pago" },
  { initial: "P", name: "Posto Ipiranga", date: "17 Jul", category: "Transporte", paymentMethod: "Cartão", amount: 210, type: "saida", status: "pago" },
  { initial: "F", name: "Freelance design", date: "15 Jul", category: "Receita", paymentMethod: "Cartão", amount: 1500, type: "entrada", status: "pago" },
];

export default function TransacoesPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [year, setYear] = useState(currentYear);
  const [subPeriod, setSubPeriod] = useState(currentMonth);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  function handlePeriodTypeChange(newType: PeriodType) {
    setPeriodType(newType);
    setSubPeriod(defaultSubPeriodFor(newType, currentMonth));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            Transações
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
            Visualize e lance suas movimentações financeiras
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <PeriodSelector
            periodType={periodType}
            onPeriodTypeChange={handlePeriodTypeChange}
            subPeriod={subPeriod}
            onSubPeriodChange={setSubPeriod}
            year={year}
            onYearChange={setYear}
            years={[currentYear]}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            align="right"
            tabs={["mensal", "trimestral", "semestral", "anual", "personalizado"]}
            showSteppers
          />
          <button className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white">
            + Nova transação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard
          label="Entradas"
          value={formatCurrency(9700)}
          color="var(--chart-positive)"
          variation={<Variation current={9700} previous={8660} higherIsGood />}
        />
        <KpiCard
          label="Saídas"
          value={formatCurrency(596.9)}
          color="var(--chart-negative)"
          variation={<Variation current={596.9} previous={615} higherIsGood={false} />}
        />
        <KpiCard
          label="Saldo"
          value={formatCurrency(24850)}
          color="var(--chart-positive)"
          variation={<Variation current={24850} previous={23010} higherIsGood />}
        />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
            Todas as transações
          </h2>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            Filtros <span className="opacity-40">⌄</span>
          </button>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_0.9fr] gap-3 border-b border-[var(--border-subtle)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          <div>Descrição</div>
          <div>Categoria</div>
          <div>Forma de pagamento</div>
          <div className="text-right">Valor</div>
          <div>Status</div>
        </div>

        {MOCK_ROWS.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[1.3fr_1fr_1fr_1fr_0.9fr] items-center gap-3 border-b border-[var(--background)] px-6 py-3.5 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[12.5px] font-bold ${
                  row.type === "entrada"
                    ? "bg-[var(--chart-positive)]/15 text-[var(--chart-positive)]"
                    : "bg-[var(--chart-negative)]/15 text-[var(--chart-negative)]"
                }`}
              >
                {row.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                  {row.name}
                </p>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)]">{row.date}</p>
              </div>
            </div>
            <div className="text-[13px] font-medium text-[var(--text-secondary)]">
              {row.category}
            </div>
            <div className="text-[13px] font-medium text-[var(--text-secondary)]">
              {row.paymentMethod}
            </div>
            <div
              className="font-display text-right text-sm font-bold tracking-tight tabular-nums"
              style={{
                color: row.type === "entrada" ? "var(--chart-positive)" : "var(--foreground)",
              }}
            >
              {row.type === "entrada" ? "+" : "-"}
              {formatCurrency(row.amount)}
            </div>
            <div>
              <StatusBadge status={row.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
