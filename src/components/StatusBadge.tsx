import type { TransactionStatus } from "@/types";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  pago: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pendente: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  agendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  atrasado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  agendado: "Agendado",
  atrasado: "Atrasado",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
