import Link from "next/link";

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 20L10 8h20l4 12M6 20v10a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V20M6 20h9l1.5 4h7L25 20h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyState({
  message,
  actionLabel,
  actionHref,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <InboxIcon className="h-9 w-9 text-slate-300 dark:text-slate-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
