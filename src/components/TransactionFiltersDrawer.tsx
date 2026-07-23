"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { getPaymentMethodLabel, type GenericPaymentMethod } from "@/lib/payment-methods";
import type { Card, Category, TransactionStatus } from "@/types";

const STATUS_OPTIONS: TransactionStatus[] = [
  "pendente",
  "pago",
  "agendado",
  "atrasado",
];

const selectClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const fieldLabelClass =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500";

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--accent)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover filtro"
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] leading-none text-[var(--accent)]/70 hover:text-[var(--accent)]"
      >
        ✕
      </button>
    </span>
  );
}

export function TransactionFiltersDrawer({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  paymentMethodFilter,
  onPaymentMethodFilterChange,
  cards,
  genericPaymentMethods,
}: {
  statusFilter: TransactionStatus | "todos";
  onStatusFilterChange: (value: TransactionStatus | "todos") => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: Category[];
  paymentMethodFilter: string;
  onPaymentMethodFilterChange: (value: string) => void;
  cards: Card[];
  genericPaymentMethods: GenericPaymentMethod[];
}) {
  const [open, setOpen] = useState(false);
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

  const activeCategory =
    categoryFilter !== "todas"
      ? categories.find((c) => c.id === categoryFilter)
      : null;

  const activeCount =
    (statusFilter !== "todos" ? 1 : 0) +
    (categoryFilter !== "todas" ? 1 : 0) +
    (paymentMethodFilter !== "todos" ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative" ref={anchorRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
            open
              ? "text-[var(--accent)]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Filtros
          {activeCount > 0 && (
            <span className="btn-primary inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          <ChevronDownIcon
            className={`h-2.5 w-2.5 ${open ? "text-[var(--accent)]" : "text-slate-400 dark:text-slate-500"}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-[min(90vw,560px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={fieldLabelClass}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    onStatusFilterChange(e.target.value as TransactionStatus | "todos")
                  }
                  className={selectClass}
                >
                  <option value="todos">Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={fieldLabelClass}>Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilterChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="todas">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={fieldLabelClass}>Forma de pagamento</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => onPaymentMethodFilterChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="todos">Todas</option>
                  <optgroup label="Formas de pagamento">
                    {genericPaymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.icon} {method.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cartões">
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {statusFilter !== "todos" && (
        <ActivePill
          label={`Status: ${STATUS_LABELS[statusFilter]}`}
          onRemove={() => onStatusFilterChange("todos")}
        />
      )}
      {activeCategory && (
        <ActivePill
          label={`Categoria: ${activeCategory.icon} ${activeCategory.name}`}
          onRemove={() => onCategoryFilterChange("todas")}
        />
      )}
      {paymentMethodFilter !== "todos" && (
        <ActivePill
          label={`Forma: ${getPaymentMethodLabel(paymentMethodFilter, cards, genericPaymentMethods)}`}
          onRemove={() => onPaymentMethodFilterChange("todos")}
        />
      )}
    </div>
  );
}
