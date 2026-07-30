export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

export function SolidPieChart({ data }: { data: PieSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;
  const stops = data.map((slice) => {
    const start = total > 0 ? (cumulative / total) * 100 : 0;
    cumulative += slice.value;
    const end = total > 0 ? (cumulative / total) * 100 : 0;
    return `${slice.color} ${start}% ${end}%`;
  });
  const background =
    total > 0 ? `conic-gradient(${stops.join(", ")})` : "var(--background)";

  return (
    <div className="flex items-center gap-5">
      <div
        className="h-[110px] w-[110px] shrink-0 rounded-full"
        style={{ background }}
      />
      <div className="flex-1 space-y-2.5">
        {data.map((slice) => (
          <div
            key={slice.name}
            className="flex items-center gap-2 text-[12.5px] font-medium text-[var(--text-secondary)]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: slice.color }}
            />
            <span className="truncate">{slice.name}</span>
            <span className="ml-auto shrink-0 font-bold text-[var(--foreground)]">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
