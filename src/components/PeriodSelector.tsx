import { MONTH_NAMES } from "@/lib/format";
import type { PeriodType } from "@/lib/period";

const selectClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function PeriodSelector({
  periodType,
  onPeriodTypeChange,
  subPeriod,
  onSubPeriodChange,
  year,
  onYearChange,
  years,
}: {
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  subPeriod: number;
  onSubPeriodChange: (value: number) => void;
  year: number;
  onYearChange: (value: number) => void;
  years: number[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={periodType}
        onChange={(e) => onPeriodTypeChange(e.target.value as PeriodType)}
        className={selectClass}
      >
        <option value="mensal">Mensal</option>
        <option value="trimestral">Trimestral</option>
        <option value="semestral">Semestral</option>
        <option value="anual">Anual</option>
      </select>

      {periodType === "mensal" && (
        <select
          value={subPeriod}
          onChange={(e) => onSubPeriodChange(Number(e.target.value))}
          className={selectClass}
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
      )}

      {periodType === "trimestral" && (
        <select
          value={subPeriod}
          onChange={(e) => onSubPeriodChange(Number(e.target.value))}
          className={selectClass}
        >
          <option value={1}>1º trimestre (Jan-Mar)</option>
          <option value={2}>2º trimestre (Abr-Jun)</option>
          <option value={3}>3º trimestre (Jul-Set)</option>
          <option value={4}>4º trimestre (Out-Dez)</option>
        </select>
      )}

      {periodType === "semestral" && (
        <select
          value={subPeriod}
          onChange={(e) => onSubPeriodChange(Number(e.target.value))}
          className={selectClass}
        >
          <option value={1}>1º semestre (Jan-Jun)</option>
          <option value={2}>2º semestre (Jul-Dez)</option>
        </select>
      )}

      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
