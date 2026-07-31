export function ProgressBarWithMarker({
  percent,
  color = "var(--accent)",
  trackHeight = 6,
}: {
  percent: number;
  color?: string;
  trackHeight?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const dotSize = trackHeight * 1.8;

  return (
    <div className="relative" style={{ height: dotSize }}>
      <div
        className="absolute top-1/2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-[var(--background)]"
        style={{ height: trackHeight }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--surface)]"
        style={{
          left: `${clamped}%`,
          width: dotSize,
          height: dotSize,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
