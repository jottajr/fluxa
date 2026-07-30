import { downsampleTimeline, type Timeline, type TimelinePoint } from "@/lib/timeline";
import type {
  Currency,
  InvestmentCategory,
  InvestmentPosition,
  InvestmentRateUnit,
  InvestmentReturn,
} from "@/types";

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
    key: "renda_fixa",
    label: "Renda fixa",
    category: "renda_fixa",
    rateValue: 12,
    rateUnit: "anual",
  },
  {
    key: "renda_variavel",
    label: "Renda variável",
    category: "renda_variavel",
    rateValue: null,
    rateUnit: null,
  },
];

const AVG_DAYS_PER_MONTH = 30.4368;
const MS_PER_DAY = 86400000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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

const MATURITY_WARNING_DAYS = 30;

export interface MaturityAlert {
  level: "critical" | "warning";
  message: string;
}

export function getMaturityAlert(
  maturityDate: string | null,
  today: Date = new Date(),
): MaturityAlert | null {
  if (!maturityDate) return null;

  const start = new Date(`${toLocalISODate(today)}T00:00:00`);
  const due = new Date(`${maturityDate}T00:00:00`);
  const diffDays = Math.round((due.getTime() - start.getTime()) / MS_PER_DAY);

  if (diffDays < 0) {
    return {
      level: "critical",
      message: `Venceu há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "dia" : "dias"}`,
    };
  }
  if (diffDays === 0) return { level: "warning", message: "Vence hoje" };
  if (diffDays === 1) return { level: "warning", message: "Vence amanhã" };
  if (diffDays <= MATURITY_WARNING_DAYS) {
    return { level: "warning", message: `Vence em ${diffDays} dias` };
  }
  return null;
}

export function buildPatrimonioTimeline(
  positions: InvestmentPosition[],
  returns: InvestmentReturn[],
  currency: Currency,
  today: Date = new Date(),
): TimelinePoint[] {
  const relevantPositions = positions.filter((p) => p.currency === currency);
  const relevantReturns = returns.filter((r) => r.currency === currency);
  if (relevantPositions.length === 0 && relevantReturns.length === 0) return [];

  const earliestDate = [
    ...relevantPositions.map((p) => p.date),
    ...relevantReturns.map((r) => r.date),
  ].reduce((min, d) => (d < min ? d : min));

  const [startYear, startMonth] = earliestDate.split("-").map(Number);
  const endYear = today.getFullYear();
  const endMonth = today.getMonth() + 1;

  const points: TimelinePoint[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const isCurrentMonth = year === endYear && month === endMonth;
    const asOf = isCurrentMonth ? today : new Date(year, month, 0);
    const asOfStr = toLocalISODate(asOf);

    const contributed = relevantPositions
      .filter((p) => p.date <= asOfStr)
      .reduce((sum, p) => sum + projectedValue(p, asOf), 0);
    const returned = relevantReturns
      .filter((r) => r.date <= asOfStr)
      .reduce((sum, r) => sum + r.amount, 0);

    points.push({ month: `${year}-${pad(month)}`, value: contributed + returned });

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return points;
}

export function buildInvestmentTimeline(
  positions: InvestmentPosition[],
  returns: InvestmentReturn[],
  currency: Currency,
  today: Date = new Date(),
): Timeline {
  return downsampleTimeline(buildPatrimonioTimeline(positions, returns, currency, today));
}
