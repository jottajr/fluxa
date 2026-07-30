export interface TimelinePoint {
  month: string;
  value: number;
}

export type TimelineGranularity = "mensal" | "semestral" | "anual";

export interface Timeline {
  points: TimelinePoint[];
  granularity: TimelineGranularity;
}

export function downsampleTimeline(monthly: TimelinePoint[]): Timeline {
  if (monthly.length <= 12) {
    return { points: monthly, granularity: "mensal" };
  }

  const granularity: TimelineGranularity = monthly.length <= 36 ? "semestral" : "anual";
  const step = granularity === "semestral" ? 6 : 12;

  const sampled: TimelinePoint[] = [];
  for (let i = monthly.length - 1; i >= 0; i -= step) {
    sampled.unshift(monthly[i]);
  }
  if (sampled[0] !== monthly[0]) {
    sampled.unshift(monthly[0]);
  }

  return { points: sampled, granularity };
}
