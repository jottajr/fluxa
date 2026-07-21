"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transacoes", label: "Transações" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/investimentos", label: "Investimentos" },
  { href: "/metas", label: "Metas" },
  { href: "/configuracoes", label: "Configurações" },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "btn-primary"
                : "text-slate-600 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] dark:text-slate-400 dark:hover:bg-[var(--accent)]/15 dark:hover:text-[var(--accent)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
        <NavLinks pathname={pathname} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <NavLinks pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
