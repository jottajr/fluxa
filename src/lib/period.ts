import { MONTH_ABBR, MONTH_NAMES } from "@/lib/format";

export type PeriodType =
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual"
  | "personalizado";

export type DateRange = {
  start: string;
  end: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
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
  if (periodType === "personalizado") return [];
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`);
}

export function getPeriodRange(
  periodType: PeriodType,
  year: number,
  subPeriod: number,
  customRange: DateRange | null,
): DateRange {
  if (periodType === "personalizado") {
    if (customRange) return customRange;
    const today = new Date();
    const start = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
    return { start, end: today.toISOString().slice(0, 10) };
  }

  const months = getMonthsInPeriod(periodType, year, subPeriod);
  const first = months[0];
  const last = months[months.length - 1];
  const [lastYear, lastMonth] = last.split("-").map(Number);
  return {
    start: `${first}-01`,
    end: `${last}-${pad(lastDayOfMonth(lastYear, lastMonth))}`,
  };
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTH_ABBR[month - 1]}`;
}

export function formatPeriodLabel(
  periodType: PeriodType,
  year: number,
  subPeriod: number,
  customRange?: DateRange | null,
): string {
  if (periodType === "mensal") return `${MONTH_NAMES[subPeriod - 1]} de ${year}`;
  if (periodType === "trimestral") return `${subPeriod}º trimestre de ${year}`;
  if (periodType === "semestral") return `${subPeriod}º semestre de ${year}`;
  if (periodType === "personalizado") {
    if (!customRange) return "Período personalizado";
    const startYear = Number(customRange.start.slice(0, 4));
    const endYear = Number(customRange.end.slice(0, 4));
    return startYear === endYear
      ? `${formatShortDate(customRange.start)} a ${formatShortDate(customRange.end)} de ${endYear}`
      : `${formatShortDate(customRange.start)} de ${startYear} a ${formatShortDate(customRange.end)} de ${endYear}`;
  }
  return `Ano de ${year}`;
}

export function defaultSubPeriodFor(periodType: PeriodType, month: number): number {
  if (periodType === "mensal") return month;
  if (periodType === "trimestral") return Math.ceil(month / 3);
  if (periodType === "semestral") return Math.ceil(month / 6);
  return 1;
}
