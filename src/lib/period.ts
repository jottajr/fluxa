import { MONTH_NAMES } from "@/lib/format";

export type PeriodType = "mensal" | "trimestral" | "semestral" | "anual";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function getMonthsInPeriod(
  periodType: PeriodType,
  year: number,
  subPeriod: number,
): string[] {
  if (periodType === "mensal") {
    return [`${year}-${pad(subPeriod)}`];
  }
  if (periodType === "trimestral") {
    const startMonth = (subPeriod - 1) * 3 + 1;
    return Array.from({ length: 3 }, (_, i) => `${year}-${pad(startMonth + i)}`);
  }
  if (periodType === "semestral") {
    const startMonth = (subPeriod - 1) * 6 + 1;
    return Array.from({ length: 6 }, (_, i) => `${year}-${pad(startMonth + i)}`);
  }
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`);
}

export function formatPeriodLabel(
  periodType: PeriodType,
  year: number,
  subPeriod: number,
): string {
  if (periodType === "mensal") return `${MONTH_NAMES[subPeriod - 1]} de ${year}`;
  if (periodType === "trimestral") return `${subPeriod}º trimestre de ${year}`;
  if (periodType === "semestral") return `${subPeriod}º semestre de ${year}`;
  return `Ano de ${year}`;
}

export function defaultSubPeriodFor(periodType: PeriodType, month: number): number {
  if (periodType === "mensal") return month;
  if (periodType === "trimestral") return Math.ceil(month / 3);
  if (periodType === "semestral") return Math.ceil(month / 6);
  return 1;
}
