"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange as PickerRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { MONTH_NAMES } from "@/lib/format";
import {
  type DateRange,
  type PeriodType,
  formatPeriodLabel,
} from "@/lib/period";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";

const PERIOD_TABS: { value: PeriodType; label: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "personalizado", label: "Personalizado" },
];

const selectClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function parseISODate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function PeriodSelector({
  periodType,
  onPeriodTypeChange,
  subPeriod,
  onSubPeriodChange,
  year,
  onYearChange,
  years,
  customRange,
  onCustomRangeChange,
  align = "left",
}: {
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  subPeriod: number;
  onSubPeriodChange: (value: number) => void;
  year: number;
  onYearChange: (value: number) => void;
  years: number[];
  customRange: DateRange | null;
  onCustomRangeChange: (range: DateRange) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<PickerRange | undefined>(undefined);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || periodType !== "personalizado") return;
    setDraftRange(
      customRange
        ? {
            from: parseISODate(customRange.start),
            to: parseISODate(customRange.end),
          }
        : undefined,
    );
  }, [open, periodType, customRange]);

  function handleTabClick(type: PeriodType) {
    onPeriodTypeChange(type);
    if (type !== "personalizado") setOpen(false);
  }

  function applyCustomRange() {
    if (!draftRange?.from || !draftRange.to) return;
    onCustomRangeChange({
      start: toISODate(draftRange.from),
      end: toISODate(draftRange.to),
    });
    setOpen(false);
  }

  const label = formatPeriodLabel(periodType, year, subPeriod, customRange);

  return (
    <div className="relative inline-block" ref={anchorRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 border-b-[1.5px] py-1 text-sm font-semibold transition-colors ${
          open
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-transparent text-slate-800 hover:text-[var(--accent)] dark:text-slate-100"
        }`}
      >
        <CalendarIcon
          className={`h-3.5 w-3.5 ${open ? "text-[var(--accent)]" : "text-slate-400 dark:text-slate-500"}`}
        />
        {label}
        <ChevronDownIcon
          className={`h-2.5 w-2.5 ${open ? "text-[var(--accent)]" : "text-slate-400 dark:text-slate-500"}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${
            align === "right" ? "right-0" : "left-0"
          } ${periodType === "personalizado" ? "w-[min(94vw,540px)]" : ""}`}
        >
          <div className="mb-4 flex flex-nowrap items-center gap-4 whitespace-nowrap border-b border-slate-100 pb-3 dark:border-slate-800">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabClick(tab.value)}
                className={`whitespace-nowrap border-b-[1.5px] pb-0.5 text-xs font-semibold transition-colors ${
                  periodType === tab.value
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {periodType !== "personalizado" ? (
            <div className="flex flex-wrap items-center gap-2">
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
          ) : (
            <div className="flex flex-col gap-3">
              <div className="fluxa-calendar overflow-x-auto">
                <DayPicker
                  mode="range"
                  numberOfMonths={2}
                  locale={ptBR}
                  showOutsideDays
                  selected={draftRange}
                  onSelect={setDraftRange}
                  defaultMonth={
                    draftRange?.from ??
                    (customRange ? parseISODate(customRange.start) : new Date())
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {draftRange?.from && draftRange?.to
                    ? `${toISODate(draftRange.from).split("-").reverse().join("/")} — ${toISODate(draftRange.to).split("-").reverse().join("/")}`
                    : "Selecione a data inicial e final"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyCustomRange}
                    disabled={!draftRange?.from || !draftRange?.to}
                    className="btn-primary rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
