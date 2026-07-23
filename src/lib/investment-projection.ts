import type { InvestmentCategory, InvestmentPosition, InvestmentRateUnit } from "@/types";

export const INVESTMENT_MODEL_PRESETS: {
  key: string;
  label: string;
  category: InvestmentCategory;
  rateValue: number | null;
  rateUnit: InvestmentRateUnit | null;
}[] = [
  {
    key: "poupanca",
    label: "Poupança",
    category: "renda_fixa",
    rateValue: 6,
    rateUnit: "anual",
  },
  {
    key: "renda_fixa_taxa",
    label: "CDB / Tesouro / outro título de taxa fixa",
    category: "renda_fixa",
    rateValue: 12,
    rateUnit: "anual",
  },
  {
    key: "renda_variavel",
    label: "Renda variável (ações, fundos, cripto)",
    category: "renda_variavel",
    rateValue: null,
    rateUnit: null,
  },
  {
    key: "outro",
    label: "Outro / sem projeção automática",
    category: "outro",
    rateValue: null,
    rateUnit: null,
  },
];

const AVG_DAYS_PER_MONTH = 30.4368;
const MS_PER_DAY = 86400000;

function monthlyRateFor(position: InvestmentPosition): number | null {
  if (
    position.category !== "renda_fixa" ||
    position.rateValue === null ||
    position.rateUnit === null
  ) {
    return null;
  }
  if (position.rateUnit === "anual") {
    return Math.pow(1 + position.rateValue / 100, 1 / 12) - 1;
  }
  return position.rateValue / 100;
}

function monthsElapsed(dateISO: string, asOf: Date): number {
  const start = new Date(`${dateISO}T00:00:00`);
  const days = (asOf.getTime() - start.getTime()) / MS_PER_DAY;
  return Math.max(0, days / AVG_DAYS_PER_MONTH);
}

export function isProjectable(position: InvestmentPosition): boolean {
  return monthlyRateFor(position) !== null;
}

export function projectedValue(
  position: InvestmentPosition,
  asOf: Date = new Date(),
): number {
  const monthlyRate = monthlyRateFor(position);
  if (monthlyRate === null) return position.amount;
  const months = monthsElapsed(position.date, asOf);
  return position.amount * Math.pow(1 + monthlyRate, months);
}

export function projectedGain(
  position: InvestmentPosition,
  asOf: Date = new Date(),
): number {
  return projectedValue(position, asOf) - position.amount;
}
