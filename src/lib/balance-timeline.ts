import type { TimelinePoint } from "@/lib/timeline";
import type { Currency, Transaction } from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function buildBalanceTimeline(
  transactions: Transaction[],
  currency: Currency,
  today: Date = new Date(),
): TimelinePoint[] {
  const relevant = transactions.filter((tx) => tx.currency === currency);
  if (relevant.length === 0) return [];

  const earliestDate = relevant.reduce(
    (min, tx) => (tx.date < min ? tx.date : min),
    relevant[0].date,
  );

  const [startYear, startMonth] = earliestDate.split("-").map(Number);
  const endYear = today.getFullYear();
  const endMonth = today.getMonth() + 1;

  const sorted = [...relevant].sort((a, b) => a.date.localeCompare(b.date));

  const points: TimelinePoint[] = [];
  let year = startYear;
  let month = startMonth;
  let cursor = 0;
  let balance = 0;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const isCurrentMonth = year === endYear && month === endMonth;
    const monthEndStr = isCurrentMonth
      ? `${year}-${pad(month)}-${pad(today.getDate())}`
      : `${year}-${pad(month)}-31`;

    while (cursor < sorted.length && sorted[cursor].date <= monthEndStr) {
      balance += sorted[cursor].type === "entrada" ? sorted[cursor].amount : -sorted[cursor].amount;
      cursor += 1;
    }

    points.push({ month: `${year}-${pad(month)}`, value: balance });

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return points;
}
